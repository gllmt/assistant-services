# TODO

Roadmap for turning `assistant-services` into a reliable local backend for personal automation and OpenClaw integration.

## Current Status

- `Kagi` is the only real integration currently wired into the server and exposed through `/search/kagi`.
- The Kagi browser fallback is already merged on `main` and works end-to-end locally.
- `OpenClaw` support currently stops at a response mapper for the `web_search` shape. There is no real OpenClaw plugin/provider integration yet.
- `Notion`, `Gmail`, `Twitter`, and `Watch` still exist mostly as scaffolding.
- `Jobs` exist only as placeholders and are not scheduled yet.
- `TypeScript` check/build pass, but tests are still empty placeholders and there is no real test runner.
- The service is local-only on `127.0.0.1`, but there is no explicit local auth boundary yet.

## P0 - Stabilize Kagi and local runtime

- [x] Add unit tests for the Kagi parser in `src/services/kagi/html.ts`.
- [x] Add fallback tests for `api -> browser_session` in `src/services/kagi/client.ts`.
- [x] Add a Kagi smoke-test command that verifies `/search/kagi` returns usable results on the local machine.
- [x] Improve the expired-session UX for Kagi and suggest `pnpm kagi:login` automatically.
- [x] Add explicit timeouts and limited retries around upstream HTTP calls.
- [x] Decide and document how the service should run persistently on this machine. Preferred on macOS: `launchd`.
- [ ] Keep the service bound to `127.0.0.1` and add local auth before exposing Gmail or Notion.
- [x] Document the operational basics: start/stop flow, logs, browser profile location, and recovery steps.

## P1 - Connect OpenClaw properly

- [ ] Build a real OpenClaw plugin/provider instead of extending response DTOs inside this repo.
- [ ] Register a custom OpenClaw `web_search` provider that calls `GET /search/kagi`.
- [ ] Map the `assistant-services` Kagi response into the OpenClaw provider result shape inside the plugin.
- [ ] Document local OpenClaw plugin installation and configuration.
- [ ] Add an end-to-end verification path: OpenClaw `web_search` -> `assistant-services` -> `Kagi`.
- [ ] Decide whether future routes should return provider-neutral domain models plus dedicated adapters. Recommended: yes.

## P2 - Implement Notion MVP

- [ ] Define the Notion MVP clearly: `create page`, `append blocks`, `query database`, `update page status`.
- [ ] Add Notion env configuration and document the setup.
- [ ] Implement a real Notion client in `src/services/notion/*`.
- [ ] Implement real Notion route handlers in `src/routes/notion.ts`.
- [ ] Register Notion routes in `src/server.ts`.
- [ ] Add tests for the Notion happy path and mapper behavior.

## P3 - Implement Gmail MVP

- [ ] Use Gmail API with OAuth instead of browser automation.
- [ ] Add Gmail env/auth configuration and document the setup.
- [ ] Implement `list`, `read`, and `send` flows in `src/services/gmail/*`.
- [ ] Implement real Gmail route handlers in `src/routes/gmail.ts`.
- [ ] Register Gmail routes in `src/server.ts`.
- [ ] Add tests for auth handling and core mail flows.

## P4 - Build Watch on top of persistence

- [ ] Choose a lightweight local persistence layer for watch state, deduplication, and job cursors. Recommended: `SQLite`.
- [ ] Define concrete watch sources, refresh frequency, deduplication, summary format, and delivery destination.
- [ ] Implement the Watch workflow in `src/services/watch/*` and `src/routes/watch.ts`.
- [ ] Register Watch routes in `src/server.ts`.
- [ ] Implement the jobs in `src/jobs/daily-digest.ts`, `src/jobs/watch-refresh.ts`, and `src/jobs/inbox-summary.ts` on top of real storage.
- [ ] Add real scheduling for these jobs.

## P5 - Quality, CI, and hardening

- [ ] Add a real test runner and `pnpm test` script.
- [ ] Replace the placeholder tests in `tests/kagi/client.test.ts` and `tests/notion/create-page.test.ts`.
- [ ] Add CI with at least `pnpm install`, `pnpm check`, `pnpm build`, and `pnpm test`.
- [ ] Add a proper secrets strategy for local development and long-running usage.
- [ ] Standardize logs, retries, timeouts, and provider-specific error handling across all integrations.
- [ ] Add deterministic fixtures or mocks for provider responses where possible.

## Later

- [ ] Leave Twitter until Notion, Gmail, and Watch are stable.
- [ ] Implement Twitter only after auth, persistence, and job patterns are proven elsewhere.

## Recommended Order

1. Stabilize Kagi with tests, smoke checks, and runtime docs.
2. Connect OpenClaw through a real plugin/provider.
3. Implement Notion.
4. Implement Gmail.
5. Add persistence, Watch, and scheduled jobs.
6. Add CI, tests, and hardening.
7. Implement Twitter last.
