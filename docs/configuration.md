# Configuration reference

Echo is configured with environment variables only. They are read and validated once, when the server starts: it refuses to start when a required one is missing or when one is not valid, with an error naming the variable. Nothing else in the code reads the environment.

- [Where the variables come from](#where-the-variables-come-from)
- [Shared variables](#shared-variables)
- [Backend variables](#backend-variables)
- [Frontend variables](#frontend-variables)
- [What is not a variable](#what-is-not-a-variable)
- [The address Echo is reached at](#the-address-echo-is-reached-at)
- [Session cookie](#session-cookie)
- [CORS](#cors)
- [Time zones](#time-zones)

## Where the variables come from

| Context       | Source                                                                                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker        | The environment of the container. The [Dockerfile](../Dockerfile) sets `HTTP_PORT`, `LOGS_DIR_PATH` and `SELF_REPORTS_DIR_PATH`, and [docker-entrypoint.sh](../docker-entrypoint.sh) gives every other variable its default. |
| `npm run dev` | `echo_backend/.env.development` for the backend, `echo_frontend/public/env.development.json` for the frontend.                                                                                                               |
| `npm start`   | `echo_backend/.env.production` for the backend, `echo_frontend/public/env.production.json`, copied into the build, for the frontend.                                                                                         |

The backend loads `.env.production` when `NODE_ENV` is `production`, `.env.development` otherwise, from its working directory, `echo_backend/`, where npm runs its scripts. A variable already set in the environment wins over the file. `NODE_ENV` only chooses that file: no variable is read differently in development.

**The code holds no default.** A variable is required unless being unset means something (`BASE_PATH`, `TRUSTED_PROXIES`, the TLS and the Telegram variables). The "Docker default" columns below are the values the image gives, which is why nothing is required in a container.

The variables of a part that is disabled are not read, so a wrong value there stops nothing: `SELF_REPORTS_RETENTION_DAYS` and `SELF_REPORTS_DIR_PATH` without the self reports, the `LOGS_NOTIFIER_*` variables without Telegram.

## Shared variables

Read by the backend and by the frontend, with `parseConfig` of [echo_utilities](../echo_utilities/src/shared/config/parseConfig.ts).

| Variable             | Required | Docker default | Description                                                                                                                                                              |
| -------------------- | :------: | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SERVER_NAME`        |   yes    | `Echo`         | Name of the instance, never blank. Shown in the app and in the Telegram messages, it also names the session cookie, and the directory and the group of the self reports. |
| `HAS_AUTHENTICATION` |   yes    | `true`         | `true` or `false`. Whether a user must log in to read the logs. `false` leaves out the auth routes, the cookie and the JWT.                                              |

## Backend variables

Read by [loadBackConfig.ts](../echo_backend/src/shared/config/loadBackConfig.ts), which builds the `BackConfig` ([backConfig.ts](../echo_backend/src/shared/config/backConfig.ts)) the server is built with. Each variable has its own parser, in [utils/](../echo_backend/src/shared/config/utils/).

### Server

| Variable                  | Required | Docker default | Description                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | :------: | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HTTP_PORT`               |   yes    | `4000`         | Port the server listens on, an integer between 1 and 65535. The server always binds to `0.0.0.0`. The health check of the container reads it too.                                                                                                                                                                                    |
| `HAS_DOCUMENTATION_ROUTE` |   yes    | `false`        | `true` or `false`. Whether Swagger UI is served under `/documentation`, and the OpenAPI document under `/documentation/json`. Neither asks for a login. When `false`, both paths answer a 404.                                                                                                                                       |
| `BASE_PATH`               |    no    | _(empty)_      | Path a reverse proxy serves Echo under: `/echo` for `https://example.com/echo`. Unset, empty or `/` means the root. Its trailing slashes are left out. Each of its parts holds letters, digits, `.`, `_`, `~` and `-` only, and its first part cannot be `api`, `app` or `documentation`, which Echo serves itself.                  |
| `TRUSTED_PROXIES`         |    no    | _(empty)_      | Reverse proxies whose `X-Forwarded-Proto`, `X-Forwarded-Host` and `X-Forwarded-For` headers are believed: a list separated by `;` of IP addresses, CIDR ranges (`172.16.0.0/12`) and `loopback`, `linklocal`, `uniquelocal`. Any other entry is refused, a host name included. Unset or empty, whatever sends a request is believed. |
| `TLS_CERT_PATH`           |    no    | _(empty)_      | Path of a PEM certificate. With `TLS_KEY_PATH`, the server serves HTTPS instead of HTTP.                                                                                                                                                                                                                                             |
| `TLS_KEY_PATH`            |    no    | _(empty)_      | Path of the PEM private key of that certificate. Both are set or neither: the server does not start with only one, nor when one of the two files cannot be read.                                                                                                                                                                     |

### Logs

| Variable                       | Required | Docker default  | Description                                                                                                                                                                                                                                                    |
| ------------------------------ | :------: | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOGS_DIR_PATH`                |   yes    | `/watched_logs` | Directory the `.jsonl` log files are read from, at any depth. A relative path resolves from the working directory of the backend. In a container, leave it: the entrypoint refuses any other value, mount your logs there instead.                             |
| `INCLUDE_SELF_REPORTS_IN_LOGS` |   yes    | `false`         | `true` or `false`. Whether the self reports are added to the logs, so they show up in the app like any other log. The backend stores its self reports only when something uses them, that is when this is `true`.                                              |
| `SELF_REPORTS_DIR_PATH`        |  yes\*   | `/self_reports` | Directory the self reports are stored in, in a directory named after `SERVER_NAME`, made safe for a path. Their group is named from every directory of that path: `self_reports_<server name>` in a container. In a container, leave it, like `LOGS_DIR_PATH`. |
| `SELF_REPORTS_RETENTION_DAYS`  |  yes\*   | `10`            | How many days a self report is kept, a strictly positive integer. The older ones are removed when the server starts.                                                                                                                                           |

\* Only with `INCLUDE_SELF_REPORTS_IN_LOGS=true`. Not read otherwise.

### Notifications

| Variable                            | Required | Docker default  | Description                                                                                                                                                                  |
| ----------------------------------- | :------: | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TELEGRAM_CHAT_ID`                  |    no    | _(empty)_       | Telegram chat the messages are sent to.                                                                                                                                      |
| `TELEGRAM_BOT_TOKEN`                |    no    | _(empty)_       | Token of the bot sending them, as BotFather gives it (`123456:ABC-DEF…`), without `https://api.telegram.org/bot` in front. A secret.                                         |
| `LOGS_NOTIFIER_SCHEDULE`            |  yes\*   | `*/30 * * * *`  | Cron expression ([node-cron](https://github.com/node-cron/node-cron) syntax) saying when the logs are checked.                                                               |
| `LOGS_NOTIFIER_WATCHED_LOGS_LEVELS` |  yes\*   | `ERROR,WARNING` | Levels that are notified, separated by commas, among `SUCCESS`, `INFO`, `WARNING` and `ERROR`. An unknown entry is ignored, and the server does not start when none is left. |
| `LOGS_NOTIFIER_TIMEZONE`            |  yes\*   | `UTC`           | Time zone the dates of the messages are shown in: a fixed offset (`UTC+2`, or `GMT+2`) or an IANA zone (`Europe/Paris`).                                                     |

\* Only once `TELEGRAM_CHAT_ID` and `TELEGRAM_BOT_TOKEN` are both set, which is what enables the notifications. Not read otherwise.

## Frontend variables

The built frontend holds no configuration, so one build fits any deployment. When it loads, it fetches `env.<mode>.json` next to itself, and [parseFrontConfig.ts](../echo_frontend/src/shared/config/utils/parseFrontConfig.ts) builds the `FrontConfig` ([frontConfig.ts](../echo_frontend/src/shared/config/frontConfig.ts)) from it: the [shared variables](#shared-variables), and the two below. The app shows an error page when the file cannot be loaded, or when a variable is missing or not valid.

| Variable                     | Required | Docker default | Description                                                                                                                                           |
| ---------------------------- | :------: | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOGS_INITIAL_DATE_DAYS_AGO` |   yes    | `2`            | How many days back the logs start when the address of the page gives no `fromDate`. A positive integer or zero, at most `LOGS_MINIMAL_DATE_DAYS_AGO`. |
| `LOGS_MINIMAL_DATE_DAYS_AGO` |   yes    | `14`           | How many days back the start date of the logs can be set at most. A positive integer or zero.                                                         |

In the file, a value is written as text, as a number or as a boolean:

```json
{
  "SERVER_NAME": "Echo",
  "HAS_AUTHENTICATION": true,
  "LOGS_INITIAL_DATE_DAYS_AGO": 2,
  "LOGS_MINIMAL_DATE_DAYS_AGO": 14
}
```

In a container, the entrypoint writes `echo_frontend/dist/env.production.json` from the environment at every start, which is how the same four variables configure both sides. Outside of one, the files of `echo_frontend/public/` are used.

## What is not a variable

Paths, file names and limits are constants of `loadBackConfig`, part of the `BackConfig` like the rest. They are given here from the root of the repository, which is `/app` in the image:

| What                                                                      | Value                                                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Users database                                                            | `data/users.db`                                                                       |
| Date of the last check of the logs notifier                               | `data/last_logs_check.json`                                                           |
| Id of the last session of the self reports, one file per self-report file | `data/logs_self_reports_session.json`, `data/logs_notifier_self_reports_session.json` |
| Built frontend                                                            | `echo_frontend/dist`                                                                  |
| Extension of a log file                                                   | `.jsonl`                                                                              |
| Directory name left out of the group names                                | `logs`                                                                                |
| Self-report files                                                         | `parseLogFile.jsonl`, `logsNotifier.jsonl`                                            |
| Extension of a self-report file                                           | `.jsonl`                                                                              |
| Route prefixes, below `BASE_PATH`                                         | `/api`, `/app`, `/documentation`                                                      |
| Length of a session                                                       | 24 hours                                                                              |
| Login and sign-up attempts                                                | 5 a minute per address                                                                |
| Telegram bot API, and the size limit of a message                         | `https://api.telegram.org`, 4096 characters                                           |

## The address Echo is reached at

No variable gives the URL of Echo. Both sides read it where it already is:

- **The backend** reads the protocol and the host from each request: those of its `X-Forwarded-Proto` and `X-Forwarded-Host` headers when it has some and its sender is believed (see `TRUSTED_PROXIES`), those of the connection and of its `Host` header otherwise. Only the path a reverse proxy serves it under cannot be read from a request, hence `BASE_PATH`. The backend answers a request whether the proxy forwards it with that path or strips it, so the API is reached at `<BASE_PATH>/api` and the app at `<BASE_PATH>/app` either way.
- **The frontend** reads it from the page it was loaded from. The backend answers `index.html` with a `<base href="<BASE_PATH>/app/">`: the app is there, and the API next to it, under `/api`, on whatever host the user reached, a LAN address included.

## Session cookie

Only with the authentication. The cookie holds the JWT of the session.

| Setting    | Value                                                                                                                                                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name       | `<SERVER_NAME>_echo_access_token`, every character of `SERVER_NAME` other than a letter, a digit, `-` or `_` replaced with `_`: `My_Server_echo_access_token` for `My Server`. Two instances on one host keep their own session when they are named differently. |
| Domain     | None: the browser only sends the cookie back to the host that set it.                                                                                                                                                                                            |
| Path       | `BASE_PATH`, or `/` when it is empty: two instances served at two paths of one host keep their own session.                                                                                                                                                      |
| `secure`   | Decided for each request: yes over HTTPS, no over HTTP, since a browser refuses a secure cookie set over HTTP.                                                                                                                                                   |
| `httpOnly` | Yes.                                                                                                                                                                                                                                                             |
| `sameSite` | `lax`.                                                                                                                                                                                                                                                           |
| Max age    | 24 hours, like the JWT it holds.                                                                                                                                                                                                                                 |

A request is over HTTPS when the backend serves HTTPS itself (`TLS_CERT_PATH`, `TLS_KEY_PATH`), or when it carries `X-Forwarded-Proto: https` and its sender is believed. With a `TRUSTED_PROXIES` that leaves out the reverse proxy handling HTTPS, the backend only sees HTTP, and the cookie is not `secure`.

The JWT is signed with a secret created when the process starts, so no session survives a restart.

**The limit of the login attempts** is per address. While whatever sends a request is believed (the default), a client could name any address in `X-Forwarded-For`, so the address counted is the one of the connection: the reverse proxy, shared by all its clients, when there is one. Once `TRUSTED_PROXIES` lists the proxies, it is the address of the client they forward.

## CORS

A request carrying an `Origin` header is only answered when that origin is the one the request is itself sent to: same host and port as its `Host` header, or as its `X-Forwarded-Host` when its sender is believed. The page then comes from the server itself, on whatever address the user reached. A request without `Origin`, which no page of another site sent, is answered.

Any other origin is refused: the request gets a 500, and the logs of the server say `Not allowed by CORS: <origin> (Allowed: <host>)`. A reverse proxy must therefore forward the host the browser reached, one way or the other.

In development, the Vite dev server forwards the `Host` header as it is, so the app and the API share the origin `http://localhost:5173` there too.

## Time zones

The backend does not depend on the time zone of its machine. The `timestamp` of a log line is read as UTC unless it carries an offset ([convertToDate.ts](../echo_backend/src/shared/utils/convertToDate.ts)), the API gives dates in UTC, and the Telegram messages show them in `LOGS_NOTIFIER_TIMEZONE` ([buildNotifierMessage.ts](../echo_backend/src/modules/logs/modules/logsNotifier/application/utils/buildNotifierMessage.ts)).

The frontend shows the dates, and groups the logs by day, in the time zone of the browser.
