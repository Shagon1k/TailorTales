# Decision: OpenRouter for text and image generation

## Decision

Use **OpenRouter** as the single gateway for both text LLM calls (Planning stage) and image
generation (Pictures stage). Models are env-configurable; local/CI runs use stub clients
(`USE_AI_STUBS=true`) to avoid spend.

## Context

TailorTales needs:

1. A text LLM that can produce a structured JSON Story Plan (title + per-page text + image
   prompts) with constrained output format.
2. An image generation model that accepts a text prompt and returns an image.

## Why OpenRouter?

- **Model flexibility.** OpenRouter is a single API that routes to dozens of providers
  (Google, OpenAI, Anthropic, etc.). Swapping models is an env var change
  (`OPENROUTER_TEXT_MODEL`, `OPENROUTER_IMAGE_MODEL`) — no code change.
- **One API key, one integration.** Text and image generation use the same OpenRouter client.
  Maintaining one integration is cheaper than maintaining two (e.g. separate OpenAI +
  Stability AI SDKs).
- **JSON Schema enforcement.** OpenRouter forwards `response_format: json_schema` to capable
  models, which guarantees the Story Plan structure. A Zod `safeParse` runs regardless as
  defense-in-depth.
- **Cost control.** `USE_AI_STUBS=true` replaces the real client with `AiStubClient` —
  canned plan + placeholder PNG. The entire pipeline (including CI) runs offline with zero
  API spend.

## Implementation

- Direct `fetch` calls to the OpenRouter API — no SDK dependency.
- Text calls: structured JSON output with `response_format: json_schema` derived from the Zod
  `storyPlanSchema`. Exponential backoff on 5xx (3 retries); 4xx fails immediately.
- Image calls: `base64` response format — bytes are decoded and uploaded directly to S3/MinIO.

## Revisit if

- A specific model not available on OpenRouter becomes a hard requirement.
- Dedicated provider SDKs offer features (streaming, batching) that OpenRouter doesn't
  expose.
- Direct provider relationships offer significant cost advantages.
