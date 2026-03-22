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

Configure one of these in `.env`, then run:

- `KAGI_API_KEY` for the beta Search API
- or `KAGI_SESSION_LINK` / `KAGI_SESSION_TOKEN` for browser bootstrap

`KAGI_SEARCH_MODE=auto` tries API first, then falls back to a persistent Playwright browser session if the API is unavailable.

Useful browser settings:

- `KAGI_BROWSER_EXECUTABLE_PATH` points to your local Chrome binary
- `KAGI_BROWSER_PROFILE_DIR` stores the dedicated persistent Kagi profile
- `KAGI_BROWSER_HEADLESS=false` is useful for the first bootstrap or manual sign-in

Recommended first bootstrap:

1. Set `KAGI_SEARCH_MODE=browser_session`
2. Set `KAGI_BROWSER_HEADLESS=false`
3. Keep `KAGI_SESSION_LINK` or `KAGI_SESSION_TOKEN` in `.env`
4. Run `pnpm kagi:login`
5. If Kagi still asks for auth, sign in once in the opened browser profile
6. Press Enter in the terminal once the profile is authenticated
7. Set `KAGI_BROWSER_HEADLESS=true` again after the profile is authenticated

```bash
pnpm kagi:login
pnpm dev
pnpm kagi:smoke
```

If `/search/kagi` or `pnpm kagi:smoke` reports an authentication problem, run `pnpm kagi:login` again to refresh the dedicated Kagi browser profile.

## Example

```bash
curl "http://127.0.0.1:4318/health"
curl "http://127.0.0.1:4318/search/kagi?q=react%20server%20components&count=5"
pnpm kagi:smoke
```
