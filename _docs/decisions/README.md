# Architecture Decision Records

Design choices that were non-obvious or had meaningful alternatives considered.

| Decision                                                | Read                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Why MinIO locally and AWS S3 in production              | [storage-minio-vs-s3.md](storage-minio-vs-s3.md)           |
| Why BullMQ for the generation queue                     | [queue-bullmq.md](queue-bullmq.md)                         |
| Why Puppeteer + Handlebars + pdf-lib for PDF generation | [pdf-puppeteer-handlebars.md](pdf-puppeteer-handlebars.md) |
| Why OpenRouter for text and image generation            | [ai-openrouter.md](ai-openrouter.md)                       |
| Why pnpm workspaces monorepo (no Turborepo)             | [monorepo-pnpm-workspaces.md](monorepo-pnpm-workspaces.md) |
| Why Resend for transactional email                      | [email-resend.md](email-resend.md)                         |
