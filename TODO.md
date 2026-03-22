# TODO

Roadmap for turning `assistant-services` into a usable personal-assistant backend.

## Current Status

- `Kagi` is the only real integration currently wired into the server.
- `Notion`, `Gmail`, `Twitter`, and `Watch` still exist mostly as scaffolding.
- `OpenClaw` response mapping currently covers only the `web_search` shape.
- `Jobs` exist as placeholders and are not scheduled yet.
- `Tests` exist only as empty placeholders.

## P0

- [ ] Merge `feat/kagi-browser-fallback` and resync local `main`.
- [ ] Add unit tests for the Kagi parser in `src/services/kagi/html.ts`.
- [ ] Add fallback tests for `api -> browser_session` in `src/services/kagi/client.ts`.
- [ ] Add a Kagi smoke-test command that verifies `/search/kagi` returns usable results.
- [ ] Improve the expired-session UX for Kagi and suggest `pnpm kagi:login` automatically.
- [ ] Decide how the service should run persistently on the machine: `node dist/index.js`, `pm2`, or `launchd`.
- [ ] Keep the service local-only on `127.0.0.1` and decide whether local auth is needed before adding Gmail and Notion.

## P1

- [ ] Implement real Notion integration in `src/services/notion/*` and `src/routes/notion.ts`.
- [ ] Define the Notion MVP clearly: `create page`, `append blocks`, `query database`, `update page status`.
- [ ] Add Notion env configuration and document the setup.
- [ ] Implement real Gmail integration in `src/services/gmail/*` and `src/routes/gmail.ts`.
- [ ] Use Gmail API with OAuth instead of browser automation.
- [ ] Implement the Watch workflow in `src/services/watch/*` and `src/routes/watch.ts`.
- [ ] Define concrete watch sources, refresh frequency, deduplication, summary format, and delivery destination.
- [ ] Leave Twitter until Notion, Gmail, and Watch are stable.

## P2

- [ ] Register the Notion, Gmail, Twitter, and Watch routes in `src/server.ts`.
- [ ] Extend the OpenClaw adapter beyond `web_search`.
- [ ] Add a real test runner and `pnpm test` script.
- [ ] Replace the placeholder tests in `tests/kagi/client.test.ts` and `tests/notion/create-page.test.ts`.
- [ ] Add CI with at least `pnpm install`, `pnpm check`, and `pnpm build`.
- [ ] Add a proper secrets strategy for local development and long-running usage.
- [ ] Implement the jobs in `src/jobs/daily-digest.ts`, `src/jobs/watch-refresh.ts`, and `src/jobs/inbox-summary.ts`.
- [ ] Add real scheduling for these jobs.
- [ ] Standardize logs, retries, timeouts, and provider-specific error handling across all integrations.

## Recommended Order

1. Finalize Kagi with tests and a smoke test.
2. Implement Notion.
3. Implement Gmail.
4. Build Watch plus scheduled jobs.
5. Add CI, tests, and hardening.
6. Implement Twitter last.
