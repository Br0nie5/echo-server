# Echo

[![Docker image](https://img.shields.io/badge/ghcr.io-br0nie5%2Fecho-blue?logo=docker)](https://github.com/Br0nie5/echo-server/pkgs/container/echo)

Echo is a self-hosted log viewer. Mount a directory of `.jsonl` log files, and Echo shows them in a web app where you browse them by day, by group of scripts and by run, filter them by level and search them. It can also send the warnings and the errors to Telegram on a schedule.

- **No database, no ingestion.** The log files are read from the disk at each request.
- **A web app** grouping the logs by day, group and job, with a date, level and text filter.
- **An optional login.** The first user to sign up becomes the admin. Without it, Echo is open, for use behind something that already authenticates.
- **Optional Telegram notifications** of the watched logs.
- **HTTPS**, served by Echo itself or by a reverse proxy, at the root of a domain or under a path.
- **One image for `amd64` and `arm64`**, running as an unprivileged user.

## Contents

- [Quick start](#quick-start)
- [Using the app](#using-the-app)
- [Parameters](#parameters)
  - [Ports](#ports)
  - [Volumes](#volumes)
  - [Environment variables](#environment-variables)
- [Log file format](#log-file-format)
- [Self reports](#self-reports)
- [Authentication](#authentication)
- [Telegram notifications](#telegram-notifications)
- [HTTPS](#https)
- [Reverse proxy](#reverse-proxy)
- [Running from the sources](#running-from-the-sources)
- [Further documentation](#further-documentation)

## Quick start

1. Run the container with the directory holding your `.jsonl` logs mounted at `/watched_logs`, and a directory for its data at `/app/data`.
2. Open `http://localhost:4000/app`. With the authentication enabled, which is the default, the first visit asks you to create the admin account.

Your logs must follow the [log file format](#log-file-format): a line that does not is left out.

### docker compose (recommended)

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
      # Optional: show the lines Echo cannot read among the logs, see the section below
      # - INCLUDE_SELF_REPORTS_IN_LOGS=true
    volumes:
      - /path/to/your/logs:/watched_logs:ro
      - /path/to/echo/data:/app/data
      # Needed with INCLUDE_SELF_REPORTS_IN_LOGS=true: a writable volume of its own, so /watched_logs stays read-only.
      # - /path/to/echo/self-reports:/self_reports
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

`ghcr.io/br0nie5/echo:latest` is the highest stable version, for `amd64` and `arm64`: Docker pulls the image of your platform. Each version also has its own tag (`ghcr.io/br0nie5/echo:1.2.0`).

[examples/](examples/) holds a complete deployment for each common setup: on its own, behind an HTTP or an HTTPS reverse proxy, on a subdomain, under a path.

## Using the app

Echo serves three things, below the address you reach it at:

| Path             | What                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `/app`           | The web app.                                                                                  |
| `/api`           | The REST API the app reads the logs from. See the [API reference](docs/api.md).               |
| `/documentation` | The interactive documentation of the API, only with `HAS_DOCUMENTATION_ROUTE=true`. No login. |

The address itself, with no path, redirects to the web app.

The logs screen shows the logs from a start date to now, newest first, in three levels of boxes you open and close:

1. **By day**, in the time zone of your browser. Only the most recent day starts open.
2. **By group**, the directory of the log file (see [grouping](#grouping)).
3. **By job**, the consecutive logs of one file that share a `jobId`: one run of a script.

Its header holds the filters:

- **The start date.** It starts `LOGS_INITIAL_DATE_DAYS_AGO` days ago (2 by default) and can go back `LOGS_MINIMAL_DATE_DAYS_AGO` days at most (14 by default).
- **The levels**, one chip for each level the displayed logs have. Select several to keep the logs of any of them.
- **The search**, applied when you submit it (Enter, or its button).

The filters are written in the address of the page (`fromDate`, `logLevels`, `logSearch`), so a filtered view can be bookmarked or shared.

### Search syntax

A search is a list of terms separated by spaces. A log is kept when it satisfies every one of them. Case is ignored.

| Term              | Keeps the logs…                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `timeout`         | holding `timeout` in their message, their file name, their group or their job id                                |
| `message:timeout` | holding `timeout` in that field only: one of `message`, `locationName` (the file name), `groupName` and `jobId` |
| `-timeout`        | that do **not** hold `timeout`. Works with a field too: `-groupName:billing`                                    |
| `"disk full"`     | holding these words together. A space can also be escaped: `disk\ full`                                         |

For example, `message:"disk full" -groupName:billing` keeps the logs whose message holds `disk full`, outside of the `billing` group. Type `:` in the search field to pick a field name from a list.

## Parameters

Ports and volumes are given as `<host>:<container>`: `-p 8080:4000` exposes the port 4000 of the container on the port 8080 of the host.

### Ports

| Port   | Function                                                       |
| ------ | -------------------------------------------------------------- |
| `4000` | The web app, the API and, when enabled, the API documentation. |

### Volumes

| Path            | Function                                                                                                                                                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/watched_logs` | The directory holding your `.jsonl` logs, read at any depth. Read-only (`:ro`) is enough.                                                                                                                                                                                                                            |
| `/app/data`     | What Echo remembers: `users.db` (the accounts, with hashed passwords), `last_logs_check.json` (when the logs were last checked for Telegram) and the two `*_self_reports_session.json` files (the last session of the self reports). Without this volume, the admin account is lost when the container is recreated. |
| `/self_reports` | Only with `INCLUDE_SELF_REPORTS_IN_LOGS=true`: where Echo writes its [self reports](#self-reports). Writable, and apart from `/watched_logs`, which can stay read-only.                                                                                                                                              |

Choose the host directories with the volumes, and leave these paths as they are. `/watched_logs` and `/self_reports` are the values of `LOGS_DIR_PATH` and `SELF_REPORTS_DIR_PATH` in the image: the container refuses to start when one of them is set to another path, and says which one in its logs.

The container runs as the unprivileged `node` user (uid `1000`, gid `1000`), not as root. It must be able to read the logs, and to write to `/app/data` and `/self_reports`. With bind mounts, give the host directories to that user:

```bash
sudo chown -R 1000:1000 /path/to/echo/data /path/to/echo/self-reports
```

A new named volume needs nothing: Docker gives it the owner the directory has in the image.

### Environment variables

Every variable has a default in the container, so none is required there. A value that is not valid stops the container at startup, with an error naming the variable.

| Variable                            | Default         | Description                                                                                                                                                                                                                  |
| ----------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SERVER_NAME`                       | `Echo`          | Name of this instance, shown in the app and in the Telegram messages. It also names the session cookie, and the directory and the group of the self reports.                                                                 |
| `HAS_AUTHENTICATION`                | `true`          | `true` asks for a login. `false` removes it: anyone who can reach the port reads the logs. See [Authentication](#authentication).                                                                                            |
| `LOGS_INITIAL_DATE_DAYS_AGO`        | `2`             | How many days back the logs shown in the app start by default. A positive integer or zero, at most `LOGS_MINIMAL_DATE_DAYS_AGO`.                                                                                             |
| `LOGS_MINIMAL_DATE_DAYS_AGO`        | `14`            | How many days back the start date of the logs can be set at most. A positive integer or zero.                                                                                                                                |
| `INCLUDE_SELF_REPORTS_IN_LOGS`      | `false`         | `true` shows the lines Echo cannot read among the logs. Needs the `/self_reports` volume. See [Self reports](#self-reports).                                                                                                 |
| `SELF_REPORTS_RETENTION_DAYS`       | `10`            | How many days a self report is kept. A strictly positive integer. Only read when the self reports are enabled.                                                                                                               |
| `TELEGRAM_CHAT_ID`                  | _(empty)_       | Telegram chat the notifications are sent to. See [Telegram notifications](#telegram-notifications).                                                                                                                          |
| `TELEGRAM_BOT_TOKEN`                | _(empty)_       | Token of the Telegram bot sending them, as BotFather gives it (`123456:ABC-DEF…`), without `https://api.telegram.org/bot` in front. A secret.                                                                                |
| `LOGS_NOTIFIER_SCHEDULE`            | `*/30 * * * *`  | Cron expression saying when the logs are checked for Telegram.                                                                                                                                                               |
| `LOGS_NOTIFIER_WATCHED_LOGS_LEVELS` | `ERROR,WARNING` | Levels that are notified, separated by commas, among `SUCCESS`, `INFO`, `WARNING` and `ERROR`: any other one stops the server.                                                                                               |
| `LOGS_NOTIFIER_TIMEZONE`            | `UTC`           | Time zone the schedule is read in and the dates of the Telegram messages are shown in: a fixed offset (`UTC+2`, `GMT+2`) or an IANA zone (`Europe/Paris`), which follows daylight saving.                                    |
| `TLS_CERT_PATH`                     | _(empty)_       | Path, in the container, of a PEM certificate. Set with `TLS_KEY_PATH` to make Echo serve HTTPS itself. See [HTTPS](#https).                                                                                                  |
| `TLS_KEY_PATH`                      | _(empty)_       | Path, in the container, of the PEM private key of that certificate.                                                                                                                                                          |
| `BASE_PATH`                         | _(empty)_       | Path a reverse proxy serves Echo under, when it is not at the root of its domain: `/echo` for `https://example.com/echo`. See [Reverse proxy](#reverse-proxy).                                                               |
| `TRUSTED_PROXIES`                   | _(empty)_       | Optional hardening: the reverse proxies whose `X-Forwarded-*` headers Echo believes. Empty, it believes whatever sends a request, so it works behind any proxy. See [Reverse proxy](#reverse-proxy).                         |
| `HAS_DOCUMENTATION_ROUTE`           | `false`         | `true` serves the interactive documentation of the API under `/documentation`, and its OpenAPI document under `/documentation/json`. Neither asks for a login.                                                               |
| `HTTP_PORT`                         | `4000`          | Port Echo listens on in the container. Only change it when the container has no port mapping of its own: with host networking, or when it shares the network of another container. Otherwise choose the host port with `-p`. |

The three `LOGS_NOTIFIER_*` variables are only read once `TELEGRAM_CHAT_ID` and `TELEGRAM_BOT_TOKEN` are both set.

`NODE_ENV` is always `production` in the container: any other value is replaced, with a warning in the logs of the container.

The [configuration reference](docs/configuration.md) has the details of each variable, and of the cookie and CORS settings.

## Log file format

Echo reads every file whose name ends with `.jsonl` under the logs directory, at any depth. Each line is one JSON object:

<!-- prettier-ignore -->
```jsonl
{"jobId":1,"timestamp":"2026-09-19T14:41:09.669Z","level":"INFO","message":"Log file has been successfully set up.","origin":"rotate_logs.sh:12"}
```

| Field       | Type   | Required | Notes                                                                                                                              |
| ----------- | ------ | :------: | ---------------------------------------------------------------------------------------------------------------------------------- |
| `jobId`     | number |   yes    | Identifies the run of the script that wrote the line. The app shows the lines of one run together.                                 |
| `timestamp` | string |   yes    | An ISO 8601 date, such as `2026-09-19T14:41:09.669Z` (`date -u +'%Y-%m-%dT%H:%M:%S.%3NZ'`). Read as UTC when it carries no offset. |
| `level`     | string |   yes    | One of `SUCCESS`, `INFO`, `WARNING`, `ERROR`.                                                                                      |
| `message`   | string |   yes    | Free text.                                                                                                                         |
| `origin`    | string |    no    | Where the line was emitted from, in any form but an empty string: `rotate_logs.sh:12`.                                             |

A blank line is ignored. A line that is not JSON, that misses a required field, or whose `level` or `timestamp` is not valid is left out of the logs, without an error. Enable the [self reports](#self-reports) to see these lines in the app.

### Grouping

The app shows each log with the name of its file, without its last extension: `nightly.log.jsonl` shows as `nightly.log`.

The group of a log comes from the directories of its file. Below the logs directory, the first directory is left out, every directory named `logs` too, and what is left is put in lower case, its spaces replaced with `_`, and joined with `_`:

| File                                                      | Group             |
| --------------------------------------------------------- | ----------------- |
| `/watched_logs/backup/logs/nightly.log.jsonl`             | _(none)_          |
| `/watched_logs/scripts/docker/utils/logs/prune.log.jsonl` | `docker_utils`    |
| `/watched_logs/scripts/Docker/Clean Up/prune.log.jsonl`   | `docker_clean_up` |

So scripts can keep their log files in a `logs` directory next to them without `logs` showing up in the group names.

## Self reports

By default, a line Echo cannot read is silently left out. With `INCLUDE_SELF_REPORTS_IN_LOGS=true`, Echo reports what goes wrong on its side, and shows each report among the logs, like any other log. It reports two things, each in a file of its own:

| File            | Reports                                                  | Level     | Message                                    | `origin`                                                                                                         |
| --------------- | -------------------------------------------------------- | --------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `parseLogs`     | A line of a log file that holds no log.                  | `WARNING` | The line itself.                           | The path of the log file and the position of the line among its non-blank lines, from 1: `…/nightly.log.jsonl:3` |
| `notifications` | A Telegram message that could not be sent, when enabled. | `ERROR`   | `The notification was not sent: <reason>`. | `notificationsTelegramService`                                                                                   |

Both are in the group `self_reports_<server name>`, the server name being `SERVER_NAME` with every character other than a letter, a digit, `-`, `_` or a space replaced with `_`, then in lower case with its spaces replaced with `_` (`self_reports_shop_prod` for `Shop Prod`).

The self reports are stored in `/self_reports/<server name>/`, apart from the logs, which are only read from `/watched_logs`. This needs the writable `/self_reports` volume (see [Volumes](#volumes)). When that directory cannot be written, Echo says so in the logs of the container and starts without the self reports.

A self report is kept `SELF_REPORTS_RETENTION_DAYS` days (10 by default). A line that is still wrong is reported again each time the logs are read, but stored once: its report keeps the date the line was first found wrong at, until that report is too old to be kept, when the line is stored again, with a new date. A message that could not be sent is stored each time it fails.

The self reports written between two starts of the container share a `jobId`, and each start takes a new one, so the app shows them as one job per run of Echo.

## Authentication

With `HAS_AUTHENTICATION=true`:

- Until an account exists, the app shows a sign-up form. **Only the very first user can sign up, and becomes the admin.** Any later sign-up is refused.
- Passwords are hashed with bcrypt and stored in `/app/data/users.db`, which only the user of the container can read.
- A session is a JWT in an `httpOnly` cookie, both valid for 24 hours. The secret signing it is created again at every start, so **restarting the container logs everyone out**.
- Login and sign-up are limited to 5 attempts a minute per address. Behind a reverse proxy, that address is the one of the proxy, so its clients share the limit, unless `TRUSTED_PROXIES` names the proxy: the limit is then per client.
- The cookie is named after `SERVER_NAME` (`Echo_echo_access_token` by default) and bound to the host that set it. It is `secure` when the request opening the session is sent over HTTPS: to Echo itself (see [HTTPS](#https)), or to a reverse proxy saying so with `X-Forwarded-Proto` (see [Reverse proxy](#reverse-proxy)). Use HTTPS for any public deployment.

With `HAS_AUTHENTICATION=false`, there is no login at all, and anyone who can reach Echo reads your logs. Only use it behind something that already authenticates: a VPN, a reverse proxy with SSO.

## Telegram notifications

1. Create a bot with [@BotFather](https://t.me/BotFather) and note its token.
2. Send your bot a message, then find the id of your chat, for example at `https://api.telegram.org/bot<token>/getUpdates`.
3. Set the variables:

```yaml
environment:
  - TELEGRAM_CHAT_ID=123456789
  - TELEGRAM_BOT_TOKEN=<token>
  - LOGS_NOTIFIER_SCHEDULE=*/30 * * * * # optional, every 30 minutes by default
  - LOGS_NOTIFIER_WATCHED_LOGS_LEVELS=ERROR,WARNING # optional, the default
  - LOGS_NOTIFIER_TIMEZONE=Europe/Paris # optional, UTC by default
```

The notifications are enabled once both `TELEGRAM_*` variables are set: setting only one of them stops the server. At each run of the schedule, Echo sends one message listing the logs of the watched levels written since the previous run, so each log is sent once:

```
Logs from server Echo:


[12] [2026-09-19 16:41:09 UTC+2] [ERROR] - nightly.log > Backup failed: disk full
```

- The first run sends every log of the watched levels, then records its date, in `/app/data/last_logs_check.json`: the next runs start from there.
- A message holds 4096 characters at most, the limit of Telegram. The logs that do not fit are counted in its last line: `3 other logs to see inside the app`.
- When a message cannot be sent, the same logs are sent again by the next run. With the [self reports](#self-reports) enabled, the failure is shown among the logs too.
- With the [self reports](#self-reports) enabled and `WARNING` watched, a line Echo cannot read is sent at every run until its file is fixed, since it is reported again each time the logs are read.

## HTTPS

To make Echo serve HTTPS itself, mount a certificate and its key, and give their paths:

```yaml
environment:
  - TLS_CERT_PATH=/certs/cert.pem
  - TLS_KEY_PATH=/certs/key.pem
volumes:
  - /path/to/certs:/certs:ro
```

Both variables go together: the container does not start with only one of them. The files must be readable by the `node` user of the container (uid `1000`).

When a reverse proxy handles HTTPS in front of Echo, leave them unset.

## Reverse proxy

Proxy everything to the port of the container. Echo is never told its public address: it reads it from each request, so it relies on what your proxy forwards.

- **The host.** Echo only accepts a request sent by a page when it serves that page itself, which it checks by comparing the `Origin` header of the request to its host. Your proxy must therefore forward the host the browser reached, as the `Host` header (the default of Caddy and Traefik; `proxy_set_header Host $http_host;` with nginx) or as `X-Forwarded-Host`. Otherwise the login fails, and the logs of the container say `Not allowed by CORS`.
- **The protocol.** The session cookie is `secure` when your proxy says the browser uses HTTPS, with `X-Forwarded-Proto`, which most proxies send by default.
- **The path.** When Echo is not at the root of its domain (`https://example.com/echo`), set `BASE_PATH=/echo`. Your proxy may forward the requests with that path or strip it: Echo answers both. The path cannot start with `/api`, `/app` or `/documentation`, which Echo serves itself.

Nothing else is required. To harden the instance, tell Echo which proxy to believe, with the address the container sees it at:

```yaml
environment:
  - TRUSTED_PROXIES=172.18.0.2 # or a range: 172.18.0.0/16, uniquelocal; several are separated by ";"
```

An entry is an IP address, a CIDR range (`172.16.0.0/12`) or one of `loopback`, `linklocal` and `uniquelocal`. A host name is refused: it is never resolved. The `X-Forwarded-*` headers are then ignored when they come from anything else, and the login attempts are limited per client, read from `X-Forwarded-For`, instead of being shared by all the clients of the proxy. Only list addresses your proxy alone can have: whoever reaches Echo from one of them chooses its own client address, and so escapes that limit.

The health check of the container always targets `localhost` inside the container, so your proxy does not change it.

[examples/](examples/) holds a complete deployment for each of these cases, with its `compose.yaml` and the configuration of its proxy.

## Running from the sources

Requirements: Node.js 24 (the version is pinned in [.tool-versions](.tool-versions)) and, for the image, Docker.

```bash
git clone https://github.com/Br0nie5/echo-server.git
cd echo-server
npm ci
```

| Command                  | What it runs                                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`            | The development servers. Open `http://localhost:5173/app`.                                                                                                                  |
| `npm start`              | A production build, served by the backend alone, with `echo_backend/.env.production`: over HTTPS, with the test certificate of `certs/`. Open `https://localhost:4000/app`. |
| `npm run start:docker`   | The image, built from the sources, in the deployment of [examples/](examples/) you pick.                                                                                    |
| `docker build -t echo .` | The image alone, after `npm run build`.                                                                                                                                     |

Without Docker, the logs are read from `test_logs/`, at the root of the repository, and the self reports written to `self_reports/` and the data to `data/`, next to it: create `test_logs/` and put some `.jsonl` files in it. All three are git-ignored.

See the [development guide](docs/development.md) for the rest, and [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Further documentation

- [Configuration reference](docs/configuration.md): every variable, the cookie and CORS settings
- [API reference](docs/api.md)
- [Architecture](docs/architecture.md)
- [Development guide](docs/development.md)
- [Examples of deployments](examples/README.md)
- [Changelog](CHANGELOG.md)
- The packages: [echo_backend](echo_backend/README.md), [echo_frontend](echo_frontend/README.md), [echo_utilities](echo_utilities/README.md)
