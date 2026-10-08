# echo_backend

Fastify API server for Echo. It reads `.jsonl` logs from disk, exposes them under `/api`, serves the built frontend under `/app` and Swagger docs under `/documentation`.

## Commands

```bash
npm run dev --workspace=echo_backend            # tsx watch
npm run build --workspace=echo_backend          # tsc to dist/
npm run start --workspace=echo_backend          # NODE_ENV=production node dist/server.js
npm run test:coverage --workspace=echo_backend
```

## Configuration

Environment variables, validated at startup by `loadBackConfig` (`src/shared/config/loadBackConfig.ts`), which builds the `BackConfig` every part of the backend reads its settings, paths and file names from. Defaults for local work are in `.env.development` and `.env.production`. Full list: [docs/configuration.md](../docs/configuration.md).

## Layout

```
src/
  server.ts              app wiring, Swagger, static serving, 404 handling
  modules/
    auth/                signup / login / check / logout, SQLite users, JWT hooks
    logs/                logs API, parsing, cron notifying the problem logs
    notification/        sending a message to the outside (Telegram)
    selfReport/          diagnostics the backend reports about itself
  shared/                config (BackConfig, loadBackConfig, utils), error schemas, helpers
```

Each module uses `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.schemas.ts` and `utils/`. See [docs/architecture.md](../docs/architecture.md).

## Notes

- Route JSON schemas drive both the Swagger docs and the shared types. Run `npm run generate:types` at the repo root after changing them.
