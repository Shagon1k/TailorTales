#!/usr/bin/env python3
"""
tokenomy audit — compare configured tooling against what's actually used.

The concept is runtime-agnostic: startup token cost is dominated by MCP servers (their
tool schemas load every session whether used or not), so flagging configured-but-unused
servers is a real saving. The *inputs*, however, are runtime-specific — where tool/MCP
config lives, and where (or whether) the agent records a usage history. There is no
universal format, so this script is best-effort and pluggable:

  * MCP config: auto-discovered from common locations, or pass --mcp-config.
    Recognizes both the `mcpServers` (Claude Code, Cursor, Codex) and
    `servers` (VS Code) shapes. Checks project-local and user-global paths.
  * Usage history: Anthropic-format JSONL transcripts
    (message.content[].type == "tool_use"). Auto-detected for Claude Code;
    for other runtimes, point --transcripts at their logs. Without a usage
    source, the script lists configured tools but cannot determine "unused".

Dependency-free (Python 3 stdlib). Examples:
    python3 <skill_dir>/scripts/audit-usage.py
    python3 <skill_dir>/scripts/audit-usage.py --mcp-config .cursor/mcp.json \\
            --transcripts '~/.myagent/logs/*.jsonl'
    python3 <skill_dir>/scripts/audit-usage.py --json
"""
import argparse
import glob
import json
import os
import re
import sys
from collections import Counter

__version__ = "0.1.0"


# --- MCP config discovery (multi-runtime) --------------------------------

def _servers_from_config(path):
    try:
        with open(os.path.expanduser(path)) as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return set()
    # `mcpServers` (Claude Code, Cursor, Codex) or `servers` (VS Code).
    keys = set(data.get("mcpServers", {}).keys()) | set(data.get("servers", {}).keys())
    # ~/.claude.json also nests config per project.
    for proj in data.get("projects", {}).values():
        if isinstance(proj, dict):
            keys |= set(proj.get("mcpServers", {}).keys())
    return keys


def discover_mcp(cwd, explicit):
    if explicit:
        out = set()
        for p in explicit:
            out |= _servers_from_config(p)
        return out
    candidates = [
        os.path.join(cwd, ".mcp.json"),                    # generic / multi-runtime
        os.path.join(cwd, ".claude", "settings.json"),     # Claude Code project
        os.path.join(cwd, ".cursor", "mcp.json"),          # Cursor
        os.path.join(cwd, ".vscode", "mcp.json"),          # VS Code
        "~/.claude.json",                                   # Claude Code global
        "~/.claude/settings.json",                         # Claude Code global (alt)
        "~/.cursor/mcp.json",                              # Cursor global
    ]
    out = set()
    for p in candidates:
        out |= _servers_from_config(p)
    return out


# --- Usage history discovery (Anthropic JSONL transcripts) ---------------

def encode_project_dir(cwd):
    """Claude Code encodes a project path by replacing every non-alphanumeric
    character with a dash, e.g. /Users/a_b/Dev/_x -> -Users-a-b-Dev--x."""
    return re.sub(r"[^a-zA-Z0-9]", "-", cwd)


def discover_transcripts(cwd, explicit):
    if explicit:
        files = []
        for pat in explicit:
            files += glob.glob(os.path.expanduser(pat))
        return sorted(set(files))
    # Default adapter: Claude Code's per-project transcript directory.
    base = os.path.expanduser("~/.claude/projects")
    leaf = encode_project_dir(cwd)
    tdir = os.path.join(base, leaf)
    if not os.path.isdir(tdir) and os.path.isdir(base):
        # Fuzzy fallback: match by project basename only.
        basename_leaf = re.sub(r"[^a-zA-Z0-9]", "-", os.path.basename(cwd.rstrip("/")))
        cands = [d for d in os.listdir(base) if d.endswith(basename_leaf)]
        if len(cands) == 1:
            tdir = os.path.join(base, cands[0])
            print(
                f"[info] Exact transcript dir not found for this project path.\n"
                f"       Using fuzzy match by basename: {os.path.basename(tdir)}\n"
                f"       Pass --project-dir <full-path> if usage data looks wrong.",
                file=sys.stderr,
            )
        elif len(cands) > 1:
            # Ambiguous: multiple projects share this basename. Pick the most recently
            # modified and warn — the user may need to pass --project-dir explicitly.
            cands_full = sorted(
                (os.path.join(base, d) for d in cands),
                key=os.path.getmtime,
                reverse=True,
            )
            tdir = cands_full[0]
            print(
                f"[warn] Multiple transcript dirs match '{basename_leaf}': {cands}\n"
                f"       Using most recent: {os.path.basename(tdir)}\n"
                f"       Pass --project-dir <full-path> to disambiguate.",
                file=sys.stderr,
            )
    return sorted(glob.glob(os.path.join(tdir, "*.jsonl")))


def iter_tool_uses(jsonl_path):
    """Yield (tool_name, input_dict) for each tool_use block in a JSONL transcript.

    Default format: Anthropic message schema — each line is a JSON object:
      {"message": {"content": [{"type": "tool_use", "name": "...", "input": {...}}]}}

    To adapt for another runtime, replace the extraction logic below:
      - OpenAI / Codex function calls:
          look for message["function_call"]["name"] and ["arguments"]
      - Cursor (when it records usage): similar to Anthropic; adjust key names
      - Custom runtimes: any per-line JSON where tool invocations are recorded
    """
    with open(jsonl_path, "r", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            msg = rec.get("message")
            if not isinstance(msg, dict):
                continue
            content = msg.get("content")
            if not isinstance(content, list):
                continue
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    yield block.get("name", ""), block.get("input") or {}


# --- Optional: locally-installed skills (Claude-style; shown only if present) ---

def discover_skills(cwd):
    """Return {skill_name: skill_dir_path} for all locally installed skills."""
    skills = {}
    for root in (os.path.join(cwd, ".claude", "skills"),
                 os.path.expanduser("~/.claude/skills")):
        if os.path.isdir(root):
            for d in os.listdir(root):
                skill_md = os.path.join(root, d, "SKILL.md")
                if os.path.isfile(skill_md) and d not in skills:
                    skills[d] = os.path.join(root, d)
    return skills


def _estimate_tokens(path):
    """Rough token estimate: word count × 1.3 (English prose).
    Code and JSON tokenize at a different ratio; treat result as a lower bound.
    Returns None if the file can't be read."""
    try:
        with open(path) as f:
            words = len(f.read().split())
        return int(words * 1.3)
    except OSError:
        return None


def _skill_file_overhead(skill_dir):
    """Token estimates for all files a skill loads: SKILL.md + references/*.
    Returns {relative_path: token_count}."""
    result = {}
    skill_md = os.path.join(skill_dir, "SKILL.md")
    t = _estimate_tokens(skill_md)
    if t is not None:
        result["SKILL.md"] = t
    ref_dir = os.path.join(skill_dir, "references")
    if os.path.isdir(ref_dir):
        for fn in sorted(os.listdir(ref_dir)):
            p = os.path.join(ref_dir, fn)
            if os.path.isfile(p):
                t = _estimate_tokens(p)
                if t is not None:
                    result[f"references/{fn}"] = t
    return result


def main():
    ap = argparse.ArgumentParser(description="Audit configured vs. used tooling.")
    ap.add_argument("--project-dir", default=os.getcwd())
    ap.add_argument("--mcp-config", action="append", default=[],
                    help="Path to an MCP config file. Repeatable. Overrides auto-detect.")
    ap.add_argument("--transcripts", action="append", default=[],
                    help="Glob for usage-history JSONL files. Repeatable. Overrides auto-detect.")
    ap.add_argument("--json", action="store_true",
                    help="Output machine-readable JSON instead of a human-readable report.")
    args = ap.parse_args()
    cwd = os.path.abspath(os.path.expanduser(args.project_dir))

    configured_mcp = discover_mcp(cwd, args.mcp_config)
    configured_skills = discover_skills(cwd)
    files = discover_transcripts(cwd, args.transcripts)

    mcp_calls, skill_calls, builtin_calls = Counter(), Counter(), Counter()
    for f in files:
        for name, inp in iter_tool_uses(f):
            if not name:
                continue
            if name.startswith("mcp__"):
                parts = name.split("__")
                mcp_calls[parts[1] if len(parts) > 1 else name] += 1
            elif name == "Skill":
                sk = inp.get("skill", "")
                skill_calls[sk.split(":")[-1] if sk else "(unknown)"] += 1
            else:
                builtin_calls[name] += 1

    have_usage = bool(files)
    unused_mcp = sorted(s for s in configured_mcp if mcp_calls.get(s, 0) == 0) if have_usage else []

    # Context overhead: root config files (every session) and skill files (per invocation).
    overhead = {}
    for name in ("CLAUDE.md", "AGENTS.md"):
        p = os.path.join(cwd, name)
        t = _estimate_tokens(p)
        if t is not None:
            overhead[name] = t

    skill_overheads = {}
    for sname, spath in sorted(configured_skills.items()):
        so = _skill_file_overhead(spath)
        if so:
            skill_overheads[sname] = so

    if args.json:
        result = {
            "version": __version__,
            "project": cwd,
            "transcripts_found": len(files),
            "have_usage": have_usage,
            "mcp_servers": [
                {
                    "name": s,
                    "calls": mcp_calls.get(s, 0),
                    "configured": True,
                    "candidate_to_remove": have_usage and mcp_calls.get(s, 0) == 0,
                }
                for s in sorted(configured_mcp)
            ] + [
                {"name": s, "calls": mcp_calls[s], "configured": False, "candidate_to_remove": False}
                for s in sorted(set(mcp_calls) - configured_mcp)
            ],
            "skills": [
                {"name": s, "calls": skill_calls.get(s, 0), "configured": True}
                for s in sorted(configured_skills)
            ],
            "builtin_calls": [{"name": n, "calls": c} for n, c in builtin_calls.most_common(10)],
            "unused_mcp": unused_mcp,
            "context_overhead_estimates": overhead,
            "context_overhead_note": "Runtime-specific imports (e.g. @./file in Claude Code) are not counted; actual loaded cost may be higher.",
            "skill_load_estimates": {
                name: {"total_tokens": sum(files.values()), "files": files}
                for name, files in skill_overheads.items()
            },
        }
        json.dump(result, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return

    print("=" * 60)
    print(f"TOKENOMY USAGE AUDIT  v{__version__}")
    print("=" * 60)
    print(f"Project:        {cwd}")
    print(f"MCP config:     {len(configured_mcp)} server(s) discovered")
    print(f"Usage history:  {len(files)} transcript file(s)"
          + ("" if have_usage else "  (none found — usage cannot be determined)"))

    # --- Context overhead estimates ----------------------------------------
    if overhead:
        print("\n## Context overhead (approximate token cost, word-count × 1.3)")
        for name, tokens in overhead.items():
            print(f"  {name:<28} ~{tokens:,} tokens")
        print("  Note: code/JSON tokenize differently; treat as a lower bound.")
        print("  Note: runtime-specific imports (e.g. @./file in Claude Code) are not")
        print("        counted — actual loaded cost may be higher.")

    # --- MCP servers: the real startup-cost lever -------------------------
    print("\n## MCP servers (schemas load every session — biggest token cost)")
    if not configured_mcp:
        print("  none discovered (pass --mcp-config to point at your runtime's config)")
    for s in sorted(configured_mcp):
        if have_usage:
            n = mcp_calls.get(s, 0)
            flag = "  <-- never used; candidate to remove" if n == 0 else ""
            print(f"  {s:<28} {n:>5} call(s){flag}")
        else:
            print(f"  {s}")
    extra = sorted(set(mcp_calls) - configured_mcp)
    if extra:
        print("  (also invoked, configured elsewhere: "
              + ", ".join(f"{s}={mcp_calls[s]}" for s in extra) + ")")

    # --- Skills (only if any are installed locally) -----------------------
    if configured_skills:
        print("\n## Skills (cost only name+description — minor; prune dead weight)")
        for s in sorted(configured_skills):
            if have_usage:
                n = skill_calls.get(s, 0)
                flag = "  <-- never invoked" if n == 0 else ""
                print(f"  {s:<28} {n:>5} call(s){flag}")
            else:
                print(f"  {s}")

    # --- Skill load cost (per invocation) ---------------------------------
    if skill_overheads:
        print("\n## Skill load cost (tokens loaded when a skill runs)")
        for sname, files in sorted(skill_overheads.items()):
            total = sum(files.values())
            print(f"  {sname:<28} ~{total:,} tokens total")
            for fn, t in sorted(files.items()):
                print(f"    {fn:<30} ~{t:,}")

    # --- Built-in tools: informational ------------------------------------
    if builtin_calls:
        print("\n## Other tools invoked (informational)")
        for name, n in builtin_calls.most_common(10):
            print(f"  {name:<28} {n:>5} call(s)")

    # --- Bottom line ------------------------------------------------------
    print("\n## Recommendation")
    if not have_usage:
        print("  No usage history for this runtime, so 'unused' can't be determined.")
        print("  Re-run with --transcripts pointing at your agent's logs, or review the")
        print("  configured MCP servers above and drop any you don't recognise needing.")
        return
    if unused_mcp:
        print("  Unused MCP server(s) cost startup tokens every session. Consider removing")
        print("  from their config (then restart the runtime): " + ", ".join(unused_mcp))
    else:
        print("  No unused MCP servers detected. Tooling looks lean.")
    print("  (Reflects recorded history only; a rarely-used server may still show usage.")
    print("   Decide based on how often you actually need it.)")


if __name__ == "__main__":
    sys.exit(main())
