# Echo

[![Docker image](https://img.shields.io/badge/ghcr.io-br0nie5%2Fecho-blue?logo=docker)](https://github.com/br0nie5/echo/pkgs/container/echo)

Echo is a self-hosted log viewer. Point it at a directory of `.jsonl` log files and it serves them through a web UI where you can browse, filter by category, and search. Optionally, it can push warnings and errors to Telegram on a schedule.

- Reads log files straight from disk. No database, no ingestion pipeline.
- Web UI with live filtering by date, category and free text.
- Optional login (first user becomes admin) or fully open mode for use behind your own proxy.
- Optional Telegram notifications for problem logs.
- Optional HTTPS.
- Multi-arch image: `amd64` and `arm64`.

## Table of contents

- [Supported architectures](#supported-architectures)
- [Application setup](#application-setup)
- [Usage](#usage)
  - [docker-compose (recommended)](#docker-compose-recommended)
  - [docker cli](#docker-cli)
- [Parameters](#parameters)
  - [Environment variables](#environment-variables)
  - [Volumes](#volumes)
  - [Ports](#ports)
- [Log file format](#log-file-format)
- [Authentication](#authentication)
- [Telegram notifications](#telegram-notifications)
- [HTTPS](#https)
- [Reverse proxy](#reverse-proxy)
- [Building locally](#building-locally)
- [Development](#development)
- [Further documentation](#further-documentation)

## Supported architectures

| Architecture | Available |
| :----------: | :-------: |
|    amd64     |    ✅     |
|    arm64     |    ✅     |

Pulling `ghcr.io/br0nie5/echo:latest` retrieves the right image for your platform.

## Application setup

The web UI is available at `SERVER_URL/app` (for example `http://localhost:4000/app`). The REST API lives under `/api` and interactive API docs under `/documentation`.

1. Mount the directory that holds your `.jsonl` logs at `/watched_logs`.
2. Set `SERVER_URL` to the exact URL you use in your browser to reach Echo (scheme, host and port). It is used for cookie configuration and by the frontend, so a mismatch will break login.
3. Open `SERVER_URL/app`. With authentication enabled (the default), the first visit asks you to create the admin account. See [Authentication](#authentication).

Your logs must follow the [log file format](#log-file-format), otherwise lines are silently skipped.

## Usage

### docker-compose (recommended)

```yaml
services:
  echo:
    image: ghcr.io/br0nie5/echo:latest
    container_name: echo
    environment:
      - SERVER_NAME=Echo
      - SERVER_URL=http://localhost:4000
      - HAS_AUTHENTICATION=true
      # Optional: Telegram notifications, see the section below
      # - LOGS_CRON_SCHEDULE_REGEX=*/30 * * * *
      # - LOGS_CRON_WATCHED_LOGS_CATEGORIES=ERROR,WARNING
      # - LOGS_CRON_TELEGRAM_CHAT_ID=123456789
      # - LOGS_CRON_TELEGRAM_BASE_URL=https://api.telegram.org/bot<token>
    volumes:
      - /path/to/your/logs:/watched_logs:ro
      - /path/to/echo/data:/app/data
    ports:
      - 4000:4000
    restart: unless-stopped
```

### docker cli

```bash
docker run -d \
  --name=echo \
  -e SERVER_NAME=Echo \
  -e SERVER_URL=http://localhost:4000 \
  -e HAS_AUTHENTICATION=true \
  -p 4000:4000 \
  -v /path/to/your/logs:/watched_logs:ro \
  -v /path/to/echo/data:/app/data \
  --restart unless-stopped \
  ghcr.io/br0nie5/echo:latest
```

## Parameters

Container parameters are given as `<external>:<internal>` for ports and volumes. For example `-p 8080:4000` exposes container port 4000 on host port 8080 (remember to update `SERVER_URL` accordingly).

### Ports

| Parameter | Function                                     |
| :-------: | -------------------------------------------- |
| `4000`    | Web UI (`/app`), API (`/api`) and API docs (`/documentation`). Internal port is set by `HTTP_PORT`. |

### Environment variables

| Variable                              | Default                    | Description |
| ------------------------------------- | -------------------------- | ----------- |
| `SERVER_NAME`                         | `Docker Production`        | Display name of this instance. Shown in the UI and in Telegram messages. |
| `SERVER_URL`                          | `http://localhost:<HTTP_PORT>` | Public URL of the instance, **as reached by the browser**. Determines the cookie domain and the `secure` flag. Use `https://` when serving over TLS. |
| `HTTP_PORT`                           | `4000`                     | Port the server listens on inside the container. |
| `HAS_AUTHENTICATION`                  | `true`                     | `true` enables login (cookie + JWT). `false` disables auth entirely and exposes logs to anyone who can reach the port. |
| `LOGS_DIR_PATH`                       | `/watched_logs`            | Directory scanned for `.jsonl` files. Normally left as is and controlled via the volume. |
| `LOGS_CRON_SCHEDULE_REGEX`            | `*/30 * * * *`             | Cron expression for the Telegram check. |
| `LOGS_CRON_WATCHED_LOGS_CATEGORIES`   | `ERROR,WARNING`            | Comma-separated categories that trigger a notification. Valid values: `SUCCESS`, `INFO`, `WARNING`, `ERROR`. |
| `LOGS_CRON_TELEGRAM_CHAT_ID`          | _(empty)_                  | Telegram chat that receives notifications. |
| `LOGS_CRON_TELEGRAM_BASE_URL`         | _(empty)_                  | Bot API base URL, `https://api.telegram.org/bot<token>`. Treat as a secret. |
| `TLS_CERT_PATH`                       | _(empty)_                  | Path (inside the container) to a PEM certificate. Set with `TLS_KEY_PATH` to serve HTTPS. |
| `TLS_KEY_PATH`                        | _(empty)_                  | Path (inside the container) to the PEM private key. |

The Telegram job only starts when all four `LOGS_CRON_*` variables are set and valid. Otherwise it is silently disabled.

### Volumes

| Parameter        | Function |
| ---------------- | -------- |
| `/watched_logs`  | The directory containing your `.jsonl` logs (subdirectories are scanned). Read-only (`:ro`) is enough. |
| `/app/data`      | Persistent state: `users.db` (SQLite, hashed passwords) and `last_logs_check.json` (Telegram checkpoint). Without this volume, the admin account is lost when the container is recreated. |

## Log file format

Echo reads every `.jsonl` file under the logs directory. Each line must be one JSON object with exactly these fields:

```json
{"job_id":1,"timestamp":"2026-09-19 16:41:09.669","status":"INFO","message":"Log file has been successfully set up."}
```

| Field       | Type   | Notes |
| ----------- | ------ | ----- |
| `job_id`    | number | Identifier of the run/job that produced the line. |
| `timestamp` | string | Format `yyyy-MM-dd HH:mm:ss.SSS`. **Interpreted as Europe/Paris time.** |
| `status`    | string | One of `SUCCESS`, `INFO`, `WARNING`, `ERROR`. |
| `message`   | string | Free text. |

Lines that are not valid JSON, do not match this shape, have an unknown `status`, or have an unparsable timestamp are skipped without error.

**Grouping.** Logs are grouped by their directory. The first directory level under the logs root is dropped, any directory named `log` is ignored, and the rest are joined with `_`. For example, with the logs root mounted at `/watched_logs`:

| File                                                 | Group          |
| ---------------------------------------------------- | -------------- |
| `/watched_logs/backup/log/nightly.log.jsonl`         | _(none)_       |
| `/watched_logs/scripts/docker/utils/log/prune.log.jsonl` | `docker_utils` |

The file name (without its extension) is shown as the log source.

## Authentication

With `HAS_AUTHENTICATION=true`:

- Until a user exists, the UI offers a sign-up form. **Only the very first user can sign up, and becomes the admin.** Further sign-ups are refused.
- Passwords are hashed with bcrypt and stored in `/app/data/users.db`.
- Sessions use a JWT in an `httpOnly` cookie valid for 24 hours. The signing secret is regenerated at every start, so **restarting the container logs everyone out**.
- The cookie is only marked `secure` when `SERVER_URL` is not `localhost`, so use HTTPS for any public deployment.

With `HAS_AUTHENTICATION=false`, no auth routes exist and anyone with network access can read your logs. Only use this behind something that already authenticates (VPN, reverse proxy with SSO, etc.).

## Telegram notifications

1. Create a bot with [@BotFather](https://t.me/BotFather) and note the token.
2. Send your bot a message, then find your chat id (for example via `https://api.telegram.org/bot<token>/getUpdates`).
3. Set the variables:

```yaml
environment:
  - LOGS_CRON_SCHEDULE_REGEX=*/30 * * * *
  - LOGS_CRON_WATCHED_LOGS_CATEGORIES=ERROR,WARNING
  - LOGS_CRON_TELEGRAM_CHAT_ID=123456789
  - LOGS_CRON_TELEGRAM_BASE_URL=https://api.telegram.org/bot<token>
```

On each run, Echo sends the matching logs written since the previous run. The first run only records a checkpoint (in `/app/data/last_logs_check.json`) and sends nothing. Messages are capped at Telegram's 4096 characters; overflow is summarised as "N other logs to see inside the console". Times in messages are shown as GMT+2.

## HTTPS

Mount a certificate and key and point Echo at them:

```yaml
environment:
  - SERVER_URL=https://echo.example.com:4000
  - TLS_CERT_PATH=/certs/cert.pem
  - TLS_KEY_PATH=/certs/key.pem
volumes:
  - /path/to/certs:/certs:ro
```

Both variables are required together, and `SERVER_URL` must start with `https://`. HTTPS is only supported in production mode (which the Docker image always uses). If you terminate TLS at a reverse proxy instead, leave these unset.

## Reverse proxy

Set `SERVER_URL` to the **public** URL (for example `https://echo.example.com`) and proxy everything to the container port. Echo serves the UI, API and docs from one origin, so no path rewriting is needed. The container health check always targets `localhost` inside the container, so it is unaffected by your proxy.

## Building locally

Requirements: Node.js 24 (see [.tool-versions](.tool-versions)), Docker.

```bash
git clone https://github.com/br0nie5/echo.git
cd echo
npm ci
npm run build:docker
```

`npm run start:docker` builds the image and runs it against the sample logs in `test_logs/`, using the self-signed development certificate in `certs/` (**never use those certificates outside local testing**).

## Development

```bash
npm ci
npm run dev
```

This starts the backend on `http://localhost:4000` and the Vite frontend on `http://localhost:5173` (open the latter). By default the backend reads logs from `test_logs/` (create it and add some `.jsonl` files, it is git-ignored).

Common commands:

| Command                     | Purpose |
| --------------------------- | ------- |
| `npm run build`             | Build all workspaces |
| `npm run lint`              | ESLint (with fix) |
| `npm run format`            | Prettier |
| `npm run test:coverage`     | Vitest, 100% coverage threshold |
| `npm run generate:types`    | Regenerate shared types from the backend's OpenAPI schema |

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/development.md](docs/development.md) for details.

## Further documentation

- [Configuration reference](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Development guide](docs/development.md)
- [Contributing](CONTRIBUTING.md)
- Workspace READMEs: [echo_backend](echo_backend/README.md), [echo_frontend](echo_frontend/README.md), [echo_utilities](echo_utilities/README.md)
