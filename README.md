# Echo

[![Docker image](https://img.shields.io/badge/ghcr.io-br0nie5%2Fecho-blue?logo=docker)](https://github.com/Br0nie5/echo-server/pkgs/container/echo)

Echo is a self-hosted log viewer. Point it at a directory of `.jsonl` log files and it serves them through a web UI where you can browse, filter by level, and search. Optionally, it can push warnings and errors to Telegram on a schedule.

- Reads log files straight from disk. No database, no ingestion pipeline.
- Web UI with live filtering by date, level and free text.
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
- [Self reports](#self-reports)
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

The web UI is available under `/app` of the address you reach Echo at (for example `http://localhost:4000/app`). The REST API lives under `/api`. Interactive API docs are served under `/documentation` when `HAS_DOCUMENTATION_ROUTE=true`.

1. Mount the directory that holds your `.jsonl` logs at `/watched_logs`.
2. Open `/app`. With authentication enabled (the default), the first visit asks you to create the admin account. See [Authentication](#authentication).

Echo is not told the address it is reached at: it reads it from each request. Behind a reverse proxy, see [Reverse proxy](#reverse-proxy).

Your logs must follow the [log file format](#log-file-format), otherwise lines are silently skipped.

## Usage

### docker-compose (recommended)

```yaml
services:
  echo:
    image: ghcr.io/br0nie5/echo:latest
    container_name: echo
    # Optional: without it, Node.js ignores the stop signal of Docker, which waits 10 seconds
    # before killing the container each time it is stopped or restarted.
    init: true
    environment:
      - SERVER_NAME=Echo
      - HAS_AUTHENTICATION=true
      # Optional: Telegram notifications, see the section below
      # - LOGS_NOTIFIER_SCHEDULE=*/30 * * * *
      # - LOGS_NOTIFIER_WATCHED_LOGS_LEVELS=ERROR,WARNING
      # - TELEGRAM_CHAT_ID=123456789
      # - TELEGRAM_BOT_TOKEN=<token>
      # Optional: surface log-parsing failures in the UI, see the section below
      # - SAVE_SELF_REPORTS_TO_FILE=true
      # - SELF_REPORTS_RETENTION_DAYS=10
    volumes:
      - /path/to/your/logs:/watched_logs:ro
      # Needed if SAVE_SELF_REPORTS_TO_FILE=true: a writable volume of its own, so /watched_logs stays read-only.
      # - /path/to/echo/server-logs:/server_logs
      - /path/to/echo/data:/app/data
    ports:
      - 4000:4000
    restart: unless-stopped
```

### docker cli

```bash
docker run -d \
  --name=echo \
  --init \
  -e SERVER_NAME=Echo \
  -e HAS_AUTHENTICATION=true \
  -p 4000:4000 \
  -v /path/to/your/logs:/watched_logs:ro \
  -v /path/to/echo/data:/app/data \
  --restart unless-stopped \
  ghcr.io/br0nie5/echo:latest
```

`--init` is optional: without it, Node.js ignores the stop signal of Docker, which waits 10 seconds before killing the container each time it is stopped or restarted.

If you enable `SAVE_SELF_REPORTS_TO_FILE` (see below), also add `-e SAVE_SELF_REPORTS_TO_FILE=true` and a writable volume of its own: `-v /path/to/echo/server-logs:/server_logs`.

## Parameters

Container parameters are given as `<external>:<internal>` for ports and volumes. For example `-p 8080:4000` exposes container port 4000 on host port 8080.

### Ports

| Parameter | Function                                                                      |
| :-------: | ----------------------------------------------------------------------------- |
|  `4000`   | Web UI (`/app`), API (`/api`) and, when enabled, API docs (`/documentation`). |

### Environment variables

| Variable                            | Default         | Description                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SERVER_NAME`                       | `Echo`          | Display name of this instance. Shown in the UI and in Telegram messages.                                                                                                                                                                                                                                                                                                                            |
| `HAS_AUTHENTICATION`                | `true`          | `true` enables login (cookie + JWT). `false` disables auth entirely and exposes logs to anyone who can reach the port.                                                                                                                                                                                                                                                                              |
| `LOGS_INITIAL_DATE_DAYS_AGO`        | `2`             | How many days back the logs shown in the UI start by default. A positive integer or zero, at most `LOGS_MINIMAL_DATE_DAYS_AGO`.                                                                                                                                                                                                                                                                     |
| `LOGS_MINIMAL_DATE_DAYS_AGO`        | `14`            | How many days back the start date of the logs can be set in the UI at most. A positive integer or zero.                                                                                                                                                                                                                                                                                             |
| `LOGS_NOTIFIER_SCHEDULE`            | `*/30 * * * *`  | Cron expression for the Telegram check.                                                                                                                                                                                                                                                                                                                                                             |
| `LOGS_NOTIFIER_WATCHED_LOGS_LEVELS` | `ERROR,WARNING` | Comma-separated levels that trigger a notification. Valid values: `SUCCESS`, `INFO`, `WARNING`, `ERROR`.                                                                                                                                                                                                                                                                                            |
| `TELEGRAM_CHAT_ID`                  | _(empty)_       | Telegram chat that receives notifications.                                                                                                                                                                                                                                                                                                                                                          |
| `TELEGRAM_BOT_TOKEN`                | _(empty)_       | Token of the Telegram bot, as given by BotFather (`123456:ABC-DEF…`), without the `https://api.telegram.org/bot` prefix. Treat as a secret.                                                                                                                                                                                                                                                         |
| `LOGS_NOTIFIER_TIMEZONE`            | `UTC`           | Timezone the dates of Telegram messages are shown in: a fixed offset (`UTC+2`, `GMT+2`) or an IANA zone (`Europe/Paris`, follows daylight saving). An unknown value stops the server at startup.                                                                                                                                                                                                    |
| `TLS_CERT_PATH`                     | _(empty)_       | Path (inside the container) to a PEM certificate. Set with `TLS_KEY_PATH` to serve HTTPS.                                                                                                                                                                                                                                                                                                           |
| `TLS_KEY_PATH`                      | _(empty)_       | Path (inside the container) to the PEM private key.                                                                                                                                                                                                                                                                                                                                                 |
| `SAVE_SELF_REPORTS_TO_FILE`         | `false`         | When `true`, `.jsonl` lines the backend fails to parse are written to `/server_logs/self_reports/<SERVER_NAME>/logs/parseLogFile.jsonl`, and `/server_logs` is scanned too, so they show up in the UI like any other log. Requires a writable volume, see Volumes below.                                                                                                                            |
| `SELF_REPORTS_RETENTION_DAYS`       | `10`            | Self-report lines older than this many days are pruned once at each server start.                                                                                                                                                                                                                                                                                                                   |
| `BASE_PATH`                         | _(empty)_       | Path a reverse proxy serves Echo under, when it is not at the root of its domain (`/echo` for `https://example.com/echo`). See [Reverse proxy](#reverse-proxy).                                                                                                                                                                                                                                     |
| `TRUSTED_PROXIES`                   | _(empty)_       | Optional hardening. By default, Echo believes the `X-Forwarded-*` headers of whatever sends a request, so it works behind any reverse proxy. Set it to the addresses of your proxy to believe only that one: a list, separated by `;`, of IP addresses, CIDR ranges (`172.16.0.0/12`) and `loopback`, `linklocal`, `uniquelocal`. A host name is not resolved. See [Reverse proxy](#reverse-proxy). |
| `HAS_DOCUMENTATION_ROUTE`           | `false`         | When `true`, the interactive documentation of the API (Swagger UI) is served under `/documentation`, and its OpenAPI document under `/documentation/json`. Neither asks for a login.                                                                                                                                                                                                                |

The Telegram job only starts when `TELEGRAM_CHAT_ID` and `TELEGRAM_BOT_TOKEN` are both set. Otherwise it is disabled. Once they are, an invalid `LOGS_NOTIFIER_SCHEDULE` or `LOGS_NOTIFIER_TIMEZONE`, or a `LOGS_NOTIFIER_WATCHED_LOGS_LEVELS` naming no valid level, stops the server at startup.

#### Advanced

| Variable    | Default | Description                                                                                                                                                                                                                                                                                                            |
| ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HTTP_PORT` | `4000`  | Port the server listens on inside the container. Only needed when the container has no port mapping of its own: with host networking (`--network host`), or when it shares the network of another container (`network_mode: service:<name>`, a Kubernetes pod). Otherwise leave it and choose the host port with `-p`. |

`NODE_ENV` is always `production` in the container: any other value is replaced, with a warning in the logs of the container.

### Volumes

| Parameter       | Function                                                                                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/watched_logs` | The directory containing your `.jsonl` logs (subdirectories are scanned). Read-only (`:ro`) is enough.                                                                                                                                          |
| `/server_logs`  | Optional, only needed when `SAVE_SELF_REPORTS_TO_FILE=true`: a writable volume for the backend's own self reports, apart from `/watched_logs`, which can stay read-only. Without it, the self reports are lost when the container is recreated. |
| `/app/data`     | Persistent state: `users.db` (SQLite, hashed passwords) and `last_logs_check.json` (Telegram checkpoint). Without this volume, the admin account is lost when the container is recreated.                                                       |

Choose the host directories with the volumes, and leave these paths as they are: they are the defaults of `LOGS_DIR_PATH` and `SERVER_LOGS_DIR_PATH`, directories the image creates, `/server_logs` writable by its user. The container refuses to start when one of them is set to another path, and says which one in its logs.

The container runs as the unprivileged `node` user (uid `1000`, gid `1000`), not as root. It must be able to read the logs, and to write to `/app/data` and `/server_logs`: with bind mounts, give the host directories to that user, for example `sudo chown -R 1000:1000 /path/to/echo/data /path/to/echo/server-logs`. A new named volume needs nothing: Docker gives it the owner of the directory of the image.

## Log file format

Echo reads every `.jsonl` file under the logs directory. Each line must be one JSON object with these fields, `origin` being the only optional one:

<!-- prettier-ignore -->
```jsonl
{"jobId":1,"timestamp":"2026-09-19T14:41:09.669Z","level":"INFO","message":"Log file has been successfully set up.","origin":"rotate_logs.sh:12"}
```

| Field       | Type   | Notes                                                                                                                                                                                                                |
| ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jobId`     | number | Identifier of the run/job that produced the line.                                                                                                                                                                    |
| `timestamp` | string | ISO 8601, e.g. `2026-09-19T14:41:09.669Z` (`date -u +'%Y-%m-%dT%H:%M:%S.%3NZ'`). Read as UTC when it carries no offset. Any other format (including the former `yyyy-MM-dd HH:mm:ss.SSS`) makes the line unparsable. |
| `level`     | string | One of `SUCCESS`, `INFO`, `WARNING`, `ERROR`.                                                                                                                                                                        |
| `message`   | string | Free text.                                                                                                                                                                                                           |
| `origin`    | string | Optional. Where the line was emitted from, in any form but an empty string, e.g. `rotate_logs.sh:12`.                                                                                                                |

Lines that are not valid JSON, do not match this shape, have an unknown `level`, or have an unparsable timestamp are skipped without error (unless `SAVE_SELF_REPORTS_TO_FILE=true`, see below).

**Grouping.** Logs are grouped by their directory. The first directory level under the logs root is dropped, any directory named `logs` is ignored, and the rest are joined with `_`. For example, with the logs root mounted at `/watched_logs`:

| File                                                      | Group          |
| --------------------------------------------------------- | -------------- |
| `/watched_logs/backup/logs/nightly.log.jsonl`             | _(none)_       |
| `/watched_logs/scripts/docker/utils/logs/prune.log.jsonl` | `docker_utils` |

The file name, without its last extension, is shown as the log source: `nightly.log.jsonl` shows as `nightly.log`.

## Self reports

Set `SAVE_SELF_REPORTS_TO_FILE=true` to have the backend report the `.jsonl` lines it fails to parse as regular log entries, so they show up in the UI instead of only in the container's own logs. Each failing line becomes a `WARNING` entry in group `<SERVER_NAME>`, source `parseLogFile`, at `/server_logs/self_reports/<SERVER_NAME>/logs/parseLogFile.jsonl` (scanned along with `/watched_logs`). This needs a writable volume of its own (see Volumes above), so `/watched_logs` can stay read-only. All entries written to one self-report file during one server run share the same `jobId`, and each self-report file takes its own, so a server start uses as many `jobId`s as it has self-report files; entries older than `SELF_REPORTS_RETENTION_DAYS` (default `10`) are pruned once at each start.

Since every request re-scans and re-parses all `.jsonl` files, a line that still fails to parse is reported again on every request. It is not written a second time: each entry's `origin` is the path of the log file the failing line comes from, followed by that line's position (1-based, among the non-blank lines of that file), as in `/watched_logs/backup/logs/nightly.log.jsonl:3`, and reporting a failure that already has an entry with the same `level`, `origin` and message only brings the `timestamp` of that entry up to now. So the entry of a problem that is still there always has a recent date, and the entry of a problem you fixed keeps the date it was last seen at, until `SELF_REPORTS_RETENTION_DAYS` prunes it at a later start. A line of a self-report file that fails to parse is reported the same way, with the path of that self-report file in its `origin`, and is then removed from that file the next time it is written or at the next start.

## Authentication

With `HAS_AUTHENTICATION=true`:

- Until a user exists, the UI offers a sign-up form. **Only the very first user can sign up, and becomes the admin.** Further sign-ups are refused.
- Passwords are hashed with bcrypt and stored in `/app/data/users.db`.
- Sessions use a JWT in an `httpOnly` cookie, both valid for 24 hours. The signing secret is regenerated at every start, so **restarting the container logs everyone out**.
- Login and sign-up are limited to 5 attempts a minute per address. Behind a reverse proxy, that address is the one of the proxy, so the limit is shared by all its clients, unless `TRUSTED_PROXIES` names the proxy: the limit is then per client.
- The cookie is named after `SERVER_NAME` (`Echo_echo_access_token` by default), and marked `secure` when the request that opens the session is sent over HTTPS: to Echo itself (see [HTTPS](#https)), or to a reverse proxy saying so with `X-Forwarded-Proto` (see [Reverse proxy](#reverse-proxy)). Use HTTPS for any public deployment.

With `HAS_AUTHENTICATION=false`, no auth routes exist and anyone with network access can read your logs. Only use this behind something that already authenticates (VPN, reverse proxy with SSO, etc.).

## Telegram notifications

1. Create a bot with [@BotFather](https://t.me/BotFather) and note the token.
2. Send your bot a message, then find your chat id (for example via `https://api.telegram.org/bot<token>/getUpdates`).
3. Set the variables:

```yaml
environment:
  - LOGS_NOTIFIER_SCHEDULE=*/30 * * * *
  - LOGS_NOTIFIER_WATCHED_LOGS_LEVELS=ERROR,WARNING
  - TELEGRAM_CHAT_ID=123456789
  - TELEGRAM_BOT_TOKEN=<token>
  - LOGS_NOTIFIER_TIMEZONE=UTC+2 # optional, UTC by default
```

On each run, Echo sends the matching logs written since the previous run, each one once. The first run only records a checkpoint (in `/app/data/last_logs_check.json`) and sends nothing. With `SAVE_SELF_REPORTS_TO_FILE=true`, the lines Echo cannot read are reported as `WARNING` logs, dated from the last time they were read: when `WARNING` is watched, they are sent on every run until the file holding them is fixed. Messages are capped at Telegram's 4096 characters; overflow is summarized as "N other logs to see inside the console". Times in messages are shown in `LOGS_NOTIFIER_TIMEZONE` (UTC by default), labeled with their offset (e.g. `2026-01-01 12:00:00 UTC+2`).

## HTTPS

Mount a certificate and key and point Echo at them:

```yaml
environment:
  - TLS_CERT_PATH=/certs/cert.pem
  - TLS_KEY_PATH=/certs/key.pem
volumes:
  - /path/to/certs:/certs:ro
```

Both variables are required together. The files must be readable by the `node` user of the container (uid `1000`). If you terminate TLS at a reverse proxy instead, leave these unset. [examples/](examples/) has a deployment of each kind.

## Reverse proxy

Proxy everything to the container port. [examples/](examples/) holds a complete deployment, with its `compose.yaml` and the configuration of the proxy, for each of the cases below. Echo is not told its public URL, so it relies on what your proxy forwards:

- **The host.** Echo only answers a login sent from the page it serves itself, which it recognizes by comparing the `Origin` of the request to its host. Your proxy must therefore forward the host the browser reached, either as the `Host` header (the default of Caddy and Traefik; `proxy_set_header Host $http_host;` with nginx) or as `X-Forwarded-Host`. Otherwise the login is refused with `Not allowed by CORS`.
- **The protocol.** The session cookie is `secure` when your proxy says the browser uses HTTPS, with `X-Forwarded-Proto` (most send it by default).
- **The path.** When Echo is not at the root of its domain (`https://example.com/echo`), set `BASE_PATH=/echo`. Your proxy may forward the requests with that path or strip it: Echo answers both. The path cannot start with `/api`, `/app` or `/documentation`, which Echo serves itself.

Nothing else is required. To harden the instance, tell Echo which proxy to believe, with the address the container sees it at:

```yaml
environment:
  - TRUSTED_PROXIES=172.18.0.2 # or a range: 172.18.0.0/16, uniquelocal; several are separated by ";"
```

The `X-Forwarded-*` headers are then ignored when they come from anything else, and the login attempts are limited per client, read from `X-Forwarded-For`, instead of being shared by all the clients of the proxy. Only list addresses your proxy alone can have: whoever reaches Echo from one of them chooses its own client address, so it escapes that limit.

The container health check always targets `localhost` inside the container, so it is unaffected by your proxy.

## Building locally

Requirements: Node.js 24 (see [.tool-versions](.tool-versions)), Docker.

```bash
git clone https://github.com/Br0nie5/echo-server.git
cd echo-server
npm ci
npm run build
docker build -t echo .
```

`npm run start:docker` builds the image, asks which deployment of [examples/](examples/) to run with it, and runs it against the sample logs in `test_logs/`. Those behind a reverse proxy are reached at `testing.cc`, which `npm run dns:enable` makes resolve to your machine (`npm run dns:disable` undoes it), and serve HTTPS with the self-signed certificate in `certs/` (**never use it outside local testing**).

## Development

```bash
npm ci
npm run dev
```

This builds `echo_utilities`, then starts it in watch mode with the backend on `http://localhost:4000` and the Vite frontend on `http://localhost:5173` (open the latter). Development is HTTP only: the backend refuses to start there when `TLS_CERT_PATH` or `TLS_KEY_PATH` is set. By default the backend reads logs from `test_logs/` (create it and add some `.jsonl` files, it is git-ignored).

Common commands:

| Command                 | Purpose                         |
| ----------------------- | ------------------------------- |
| `npm run build`         | Build all workspaces            |
| `npm run lint`          | ESLint (with fix)               |
| `npm run format`        | Prettier                        |
| `npm run test:coverage` | Vitest, 100% coverage threshold |

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/development.md](docs/development.md) for details.

## Further documentation

- [Configuration reference](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Development guide](docs/development.md)
- [Contributing](CONTRIBUTING.md)
- Workspace READMEs: [echo_backend](echo_backend/README.md), [echo_frontend](echo_frontend/README.md), [echo_utilities](echo_utilities/README.md)
