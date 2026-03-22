# macOS `launchd` Runbook

`assistant-services` should run persistently on macOS via a user `LaunchAgent`, not a `LaunchDaemon`.

Why this is the default:

- The service is local-only and should live inside the logged-in user session.
- The Kagi browser fallback uses a persistent Playwright profile under the user workspace.
- `launchd` is the native macOS supervisor and is simpler than adding `pm2` for a single local service.

## Files

- Versioned template: `ops/launchd/com.gllmt.assistant-services.plist`
- Installed agent: `~/Library/LaunchAgents/com.gllmt.assistant-services.plist`

## Prerequisites

1. Configure `.env` in the repo root.
2. Build the service:

```bash
cd /Users/friday/assistant-services
pnpm install
pnpm build
```

3. If Kagi browser auth is not already healthy, bootstrap it once:

```bash
pnpm kagi:login
pnpm kagi:smoke
```

## Install

Copy the versioned plist into the user LaunchAgents directory:

```bash
mkdir -p ~/Library/LaunchAgents
cp /Users/friday/assistant-services/ops/launchd/com.gllmt.assistant-services.plist \
  ~/Library/LaunchAgents/com.gllmt.assistant-services.plist
```

Load and start it:

```bash
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.gllmt.assistant-services.plist
launchctl kickstart -k "gui/$(id -u)/com.gllmt.assistant-services"
```

## Day-to-day operations

Restart after config or build changes:

```bash
launchctl kickstart -k "gui/$(id -u)/com.gllmt.assistant-services"
```

Stop and unload:

```bash
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/com.gllmt.assistant-services.plist
```

Inspect status:

```bash
launchctl print "gui/$(id -u)/com.gllmt.assistant-services"
```

Tail logs:

```bash
tail -f ~/Library/Logs/assistant-services.log
tail -f ~/Library/Logs/assistant-services.error.log
```

Verify the service:

```bash
curl "http://127.0.0.1:4318/health"
pnpm kagi:smoke
```

## Update workflow

After pulling changes:

```bash
cd /Users/friday/assistant-services
git pull
pnpm install
pnpm build
launchctl kickstart -k "gui/$(id -u)/com.gllmt.assistant-services"
```

## Operational notes

- `WorkingDirectory` must stay `/Users/friday/assistant-services`. The app loads `.env` from the repo root and uses `process.cwd()` for the default Kagi browser profile path.
- The plist pins the current `node` binary at `/Users/friday/.nvm/versions/node/v24.14.0/bin/node`. If the local Node version changes, update the plist and reload the agent.
- Logs are written to `~/Library/Logs/assistant-services.log` and `~/Library/Logs/assistant-services.error.log`.
- The service should stay bound to `127.0.0.1`. Do not widen the bind address before local auth exists.
- If Kagi auth expires, run `pnpm kagi:login`, then restart the agent with `launchctl kickstart -k ...`.
