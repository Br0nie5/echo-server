# echo_frontend

React 19 + MUI + TanStack Query single-page app for browsing and filtering logs. In production it is served by the backend under `/app`.

## Commands

```bash
npm run dev --workspace=echo_frontend            # Vite on http://localhost:5173
npm run build --workspace=echo_frontend          # production build to dist/
npm run test:coverage --workspace=echo_frontend
```

In dev, Vite proxies `/api` to the backend on port 4000 (see `vite.config.ts`), so start the backend too (`npm run dev` at the repo root does both).

## Runtime configuration

The bundle contains no configuration. On load it fetches `env.<mode>.json` (`SERVER_NAME`, `SERVER_URL`, `HAS_AUTHENTICATION`). In dev these come from `public/`; in Docker the entrypoint regenerates `env.production.json` on every start. The app handles both authenticated and open modes.

## Layout

```
src/
  initializers/     API client, env loading, routing
  modules/
    auth/           sign-up and login
    logs/           log list, filters, filter Web Worker
      infra/        TanStack Query hooks + keys (one file per hook)
      screens/      screen component with hooks/, layouts/, components/, utils/
  shared/           i18n (English), layouts, theme, utils
  test/             render helpers for tests
```

Live filtering runs in a Web Worker (`modules/logs/infra/__workers__/filterWorker.ts`) using the same functions as the backend, from `@echo/utilities`.
