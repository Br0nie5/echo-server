# API reference

Live, interactive documentation is served at `/documentation` (Swagger UI) by every running instance. The machine-readable spec is committed at [openApi.json](../openApi.json). All routes below are under `/api`.

## Authentication routes

Registered only when `HAS_AUTHENTICATION=true`. Responses have the shape `{ "success": boolean, "message": string }`. Successful sign-up and login set the auth cookie.

| Method | Path | Body | Responses |
| ------ | ---- | ---- | --------- |
| POST | `/auth/signup` | `{ username, password }` | `200` created and logged in; `403` a user already exists |
| POST | `/auth/login` | `{ username, password }` | `200`; `401` invalid credentials |
| GET | `/auth/check` | none | `200` valid session; `401` invalid session, or no user exists yet (the message tells the UI to show sign-up) |
| POST | `/auth/logout` | none | `200`, clears the cookie |

## Logs

### `GET /logs`

Requires a valid session when authentication is enabled.

| Query parameter | Required | Description |
| --------------- | :------: | ----------- |
| `fromDate` | yes | ISO 8601 date-time. Only logs at or after it are returned. |
| `logCategories` | no | One of `SUCCESS`, `INFO`, `WARNING`, `ERROR`; repeat the parameter for several. |
| `logSearch` | no | Free-text filter. |

Example:

```bash
curl --cookie cookies.txt \
  "http://localhost:4000/api/logs?fromDate=2026-09-19T00:00:00Z&logCategories=ERROR&logCategories=WARNING"
```

Each returned log:

```json
{
  "id": "0 [docker_utils] [prune] {\"job_id\":1,...}",
  "date": "2026-09-19T14:41:09.669Z",
  "groupName": "docker_utils",
  "fileName": "prune",
  "jobId": 1,
  "category": "INFO",
  "message": "Starting rotate_logs script.",
  "callFile": "prune.sh",
  "callLine": 12
}
```

Errors use the `EchoError` schema: `400` invalid params, `401` unauthenticated, `500` server error.

## Changing the API

Routes and schemas are the source of truth for the shared types. After editing a route schema, run `npm run generate:types` (see the [development guide](development.md#regenerating-shared-types)).
