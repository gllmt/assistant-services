# assistant-services

Local backend services for a personal assistant stack, with OpenClaw as one possible integration layer.

## First target

- `GET /health`
- `GET /search/kagi?q=...`

## Stack

- TypeScript
- Fastify
- Zod

## Structure

```text
src/
  routes/
  services/
  integrations/
  schemas/
  jobs/
  shared/
```

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill `KAGI_API_KEY` in `.env`, then run:

```bash
pnpm dev
```

## Example

```bash
curl "http://127.0.0.1:4318/health"
curl "http://127.0.0.1:4318/search/kagi?q=react%20server%20components&count=5"
```
