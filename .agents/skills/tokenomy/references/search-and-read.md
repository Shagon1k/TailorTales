---
audience: ai
---

# Searching & reading without burning tokens

Loaded by `SKILL.md` when you need the concrete commands. Principle: the cost of reading
scales with how much you pull into context; pull the least that still answers the question.
These are defaults — when the user asks for full output, or filtered output loses needed
context, or a file is small (<~200 lines), just read it.

## Contents

1. Find before you read
2. Big files: window, don't slurp
3. Logs
4. Structured data (JSON / CSV / YAML / XML / properties)
5. Understanding a codebase
6. Delegate fan-out to a subagent
7. Git diffs and history
8. Visual state — snapshot vs screenshot

## 1. Find before you read

Locate the relevant spot, then read only around it.

```bash
grep -rn "functionName" src/        # where is it
grep -rn "class .*Service" --include=*.java   # by pattern
```

Then read a window rather than the whole file — use your file-read tool's windowing
(`offset`/`limit`) if it has one, or:

```bash
sed -n '120,180p' big_file.py       # just the relevant span
```

## 2. Big files: window, don't slurp

```bash
wc -l path/to/file        # how big is it
sed -n '1,60p' file       # header / imports
tail -40 file             # end
```

## 3. Logs

Logs are often the worst offenders (tens of thousands of lines). Never read one whole.

```bash
tail -100 app.log                         # most recent
grep -iE "error|fail|exception" app.log | tail -50   # just the problems
grep -c "ERROR" app.log                   # count first, then sample
```

## 4. Structured data (JSON / CSV / YAML / XML / properties)

Extract the field; don't read the document.

```bash
jq '.dependencies'      package.json
jq 'keys'               config.json              # top-level shape only
head -1 data.csv | tr ',' '\n' | nl             # column names + indices
wc -l data.csv                                   # row count

# YAML — yq (if available), otherwise grep
yq '.server.port'       application.yml
grep "^server.port"     application.properties   # Java .properties key

# XML — xmllint (if available), otherwise grep
xmllint --xpath '//dependency/artifactId/text()' pom.xml 2>/dev/null
grep -m5 "<artifactId>"  pom.xml                 # fallback: first 5 artifact names
grep "<version>"         pom.xml | head -3        # spot-check versions
```

## 5. Understanding a codebase

Go top-down: shape first, then targeted reads.

```bash
git ls-files | sed 's#/[^/]*$##' | sort -u | head -40   # directory map
```

Read entry points and the one or two files you've localized to — not everything
sequentially.

**Symbol density by file** — adapt the extension and pattern to your language:

| Language         | Command                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Python           | `grep -rEc "^\s*(def\|class) " --include="*.py" .`                                                                         |
| Java             | `grep -rEc "^\s*(class\|interface\|record) " --include="*.java" .`                                                         |
| TypeScript / JS  | `grep -rEc "^\s*(function\|class\|const .+=.*=>)" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .` |
| Go               | `grep -rEc "^func " --include="*.go" .`                                                                                    |
| Ruby             | `grep -rEc "^\s*(def\|class\|module) " --include="*.rb" .`                                                                 |
| General fallback | `grep -rEc "^[A-Za-z]" --include="*.ext" . \| sort -t: -k2 -rn \| head -20`                                                |

Sort the output by count (`sort -t: -k2 -rn`) to find the densest files first.

## 6. Delegate fan-out to a sub-agent

When answering means sweeping many files or naming conventions and you only need the
conclusion, delegate to a sub-agent / exploration agent if your runtime provides one. It
reads the excerpts; your main context keeps only the summary. Rule of thumb: if it would
take reading >3 files you don't already know, delegate it.

## 7. Git diffs and history

Never read a full diff first. Scope, then target.

```bash
# Scope before reading
git diff --stat HEAD                    # which files changed, how much
git diff main...HEAD --stat             # PR scope: all files this branch touched
git diff HEAD | wc -l                   # how large is the diff before committing

# Targeted reads
git diff HEAD -- path/to/file.java      # one file only
git diff main...HEAD -- path/to/file    # one file across the whole branch

# Understand a commit without reading its full diff
git log --oneline -20                   # recent history at a glance
git show --name-only <sha>              # which files a commit touched
git show --stat <sha>                   # files + lines changed, no diff body
```

When reviewing a PR or branch: `--stat` first → read only the files that changed
significantly or match the task. Ignore churn files (auto-generated, lock files).

## 8. Visual state — snapshot vs screenshot

|                | Snapshot (a11y tree)                                  | Screenshot (image)                           |
| -------------- | ----------------------------------------------------- | -------------------------------------------- |
| **Token cost** | Low (~1–5K tokens, text)                              | High (1K–4K+ tokens, image)                  |
| **Greppable**  | Yes                                                   | No                                           |
| **Use for**    | Element location, text content, structure, form state | Visual layout, CSS rendering, colors, images |

**Default: snapshot.** Switch to screenshot only when visual rendering is what you need
to verify — layout, color, image presence — and the snapshot doesn't capture it.

When you do screenshot: target a specific element (`uid` parameter) rather than the full
page. A cropped element screenshot costs a fraction of a full-page one.

```
take_snapshot()             ← always try first
take_screenshot(uid=...)    ← element crop when visual check is needed
take_screenshot(fullPage=true)  ← only when full-page visual is the actual task
```

_(Tool names vary by runtime — adapt these to your environment's equivalents.)_

## A note on `cp`/`sed` vs Read+Edit

For _bulk mechanical_ edits on large or many files, shell tools (`sed -i`, `cp`) avoid loading
content into context. But editing code blind is risky — you can't see what you're changing.
Use Read+Edit for code and anything where correctness depends on surrounding context; reserve
`sed`/`cp` for safe, repetitive, well-understood transforms.

---

See also: [`doc-authoring.md`](doc-authoring.md) — efficient documentation patterns.
See also: [`sub-agent-prompts.md`](sub-agent-prompts.md) — lean spawn prompt patterns.
