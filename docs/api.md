# API reference

The API is served under `/api`, below `BASE_PATH` when Echo has one. It exchanges JSON.

An instance started with `HAS_DOCUMENTATION_ROUTE=true` also serves this reference in an interactive form (Swagger UI) at `/documentation`, and the OpenAPI document at `/documentation/json`. Both are built from the routes when the server starts, so they always match the running version. A container does not serve them by default.

- [Errors](#errors)
- [Authentication routes](#authentication-routes)
- [`GET /logs`](#get-logs)
- [Changing the API](#changing-the-api)

## Errors

Unless a route says otherwise below, an error is answered as an `EchoError`:

```json
{ "statusCode": 404, "message": "Not found." }
```

| Status | When                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | The query or the body of the request is not valid. The message says what is wrong.                                                  |
| `401`  | The route needs a session and the request has none, or one that is over.                                                            |
| `404`  | The path is no route. A path under `/app` is not concerned: it answers the page of the app.                                         |
| `429`  | Too many login or sign-up attempts from one address: 5 a minute.                                                                    |
| `500`  | Anything else, with the message `An unexpected error occurred.`: what went wrong is in the logs of the server, never in the answer. |

A request carrying an `Origin` header other than the host it is sent to is refused with a `500` too (see [CORS](configuration.md#cors)).

## Authentication routes

They only exist with `HAS_AUTHENTICATION=true`: otherwise their paths answer a `404`.

A session is a JWT, valid for 24 hours, in an `httpOnly` cookie named after `SERVER_NAME` (see [Session cookie](configuration.md#session-cookie)). A client only has to send its cookies back.

Every one of these routes answers an `AuthToken`, whatever the status:

```json
{ "success": true, "message": "Login successful." }
```

| Method | Path           | Body                     | Answers                                                                                                                                 |
| ------ | -------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/auth/signup` | `{ username, password }` | `200` the account is created, as the admin, and the session opened. `403` an account already exists, or another sign-up is in progress. |
| `POST` | `/auth/login`  | `{ username, password }` | `200` the session is opened. `401` the username or the password is wrong.                                                               |
| `GET`  | `/auth/check`  | none                     | `200` the request has a valid session. `401` it has none, or no account exists yet: the message is then `No account found.`             |
| `POST` | `/auth/logout` | none                     | `200`, and the cookie is cleared.                                                                                                       |

Only the very first user can sign up. A client tells the two `401` of `/auth/check` apart by their message, to offer the sign-up instead of the login.

`/auth/signup` and `/auth/login` are the two rate-limited routes: their `429`, and the `400` of a body that is not valid, are `EchoError`s.

```bash
curl --cookie-jar cookies.txt \
  --header 'Content-Type: application/json' \
  --data '{"username":"admin","password":"<password>"}' \
  http://localhost:4000/api/auth/login
```

## `GET /logs`

Gives the logs matching the query, from the newest to the oldest. With the authentication, it needs a session: a request without one gets a `401` before its query is even validated.

| Query parameter | Required | Description                                                                                                      |
| --------------- | :------: | ---------------------------------------------------------------------------------------------------------------- |
| `fromDate`      |   yes    | ISO 8601 date-time. The logs before it are left out.                                                             |
| `toDate`        |    no    | ISO 8601 date-time. The logs at that date or after are left out.                                                 |
| `logLevels`     |    no    | `SUCCESS`, `INFO`, `WARNING` or `ERROR`. Repeat the parameter to keep several levels. All of them when left out. |
| `logSearch`     |    no    | A search, in the syntax below.                                                                                   |

```bash
curl --cookie cookies.txt \
  "http://localhost:4000/api/logs?fromDate=2026-09-19T00:00:00Z&logLevels=ERROR&logLevels=WARNING"
```

### The search

`logSearch` is a list of terms separated by spaces, and a log is kept when it satisfies every one of them. Case is ignored.

| Term              | Satisfied by a log…                                                                    |
| ----------------- | -------------------------------------------------------------------------------------- |
| `timeout`         | holding `timeout` in its `message`, its `locationName`, its `groupName` or its `jobId` |
| `message:timeout` | holding `timeout` in that field: `message`, `locationName`, `groupName` or `jobId`     |
| `-timeout`        | **not** holding `timeout`. A field can follow the dash: `-groupName:billing`           |
| `"disk full"`     | holding these words together. A space can also be escaped with a backslash             |

### A log

```json
{
  "id": "{\"idNumber\":0,\"date\":\"2026-09-19T14:41:09.669Z\",\"jobId\":1,\"location\":\"/watched_logs/scripts/docker/utils/logs/prune.log.jsonl\",\"level\":\"INFO\",\"message\":\"Pruning the unused Docker images.\",\"origin\":\"prune.sh:12\"}",
  "contentId": "{\"location\":\"/watched_logs/scripts/docker/utils/logs/prune.log.jsonl\",\"level\":\"INFO\",\"message\":\"Pruning the unused Docker images.\",\"origin\":\"prune.sh:12\"}",
  "date": "2026-09-19T14:41:09.669Z",
  "groupName": "docker_utils",
  "location": "/watched_logs/scripts/docker/utils/logs/prune.log.jsonl",
  "locationName": "prune.log",
  "jobId": 1,
  "level": "INFO",
  "message": "Pruning the unused Docker images.",
  "origin": "prune.sh:12"
}
```

| Field          | Description                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | Identifies the log among all of them. Treat it as an opaque string.                                                                                     |
| `contentId`    | Identifies what the log says: two logs share it when they have the same `location`, `level`, `message` and `origin`, whatever their date and their job. |
| `date`         | When the log was emitted, as an ISO 8601 date-time in UTC.                                                                                              |
| `groupName`    | The group of the log, made of the directories of its file. Left out when it has none.                                                                   |
| `location`     | Where the log is stored: the path of its file on the server.                                                                                            |
| `locationName` | The short name of `location`, the one the app shows: the name of the file without its last extension.                                                   |
| `jobId`        | The run of the script that emitted the log, an integer.                                                                                                 |
| `level`        | `SUCCESS`, `INFO`, `WARNING` or `ERROR`.                                                                                                                |
| `message`      | What the script wrote.                                                                                                                                  |
| `origin`       | Where the log was emitted from, as the script wrote it, never empty. Left out when it wrote none.                                                       |

The [README](../README.md#log-file-format) says how a line of a log file becomes a log, and how its group is made.

## Changing the API

What the API exchanges is described once, by the zod schemas of `echo_utilities`: the TypeScript types and the JSON schemas of the routes are both derived from them (see [Type flow](architecture.md#type-flow)). Nothing has to be generated after changing a route or one of these schemas.

Keep the `schema` of each route accurate, its `operationId` and its answers above all: it validates the requests and it is what `/documentation` shows.
