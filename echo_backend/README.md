# echo_backend

Fastify API server for Echo. It reads `.jsonl` logs from disk, exposes them under `/api`, serves the built frontend under `/app` and Swagger docs under `/documentation`.

## Commands

```bash
npm run dev --workspace=echo_backend            # tsx watch
npm run build --workspace=echo_backend          # tsc to dist/
npm run start --workspace=echo_backend          # NODE_ENV=production node dist/main.js
npm run test:coverage --workspace=echo_backend
```

## Configuration

Environment variables, validated at startup by `loadBackConfig` (`src/shared/config/loadBackConfig.ts`), which builds the `BackConfig` every part of the backend reads its settings, paths and file names from. Defaults for local work are in `.env.development` and `.env.production`. Full list: [docs/configuration.md](../docs/configuration.md).

## Layout

```
src/
  main.ts                entry point: calls startServer
  server.ts              buildServer, the app wiring, and startServer, which builds it and starts listening
  plugins/               what buildServer registers: Swagger, cookie/JWT and CORS, the routes of the API, static serving and 404 handling, the logs notifier
  modules/
    auth/                signup / login / check / logout, SQLite users, JWT hooks
    logs/                logs API, parsing, cron notifying the problem logs
    notification/        sending a message to the outside (Telegram)
    selfReport/          diagnostics the backend reports about itself
  shared/                config (BackConfig, loadBackConfig, utils), error schemas, helpers
```

Each module is split into the layer folders it needs: `domain/`, `application/`, `infra/` and `presentation/`. See [docs/architecture.md](../docs/architecture.md).

## Notes

- The JSON schemas of the routes are derived from the zod schemas of `@echo/utilities`, and drive the Swagger docs.
