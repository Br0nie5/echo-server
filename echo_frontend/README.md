# echo_frontend

React 19 + MUI + TanStack Query single-page app for browsing and filtering logs. In production it is served by the backend under `/app`.

## Commands

```bash
npm run dev --workspace=echo_frontend            # Vite on http://localhost:5173
npm run build --workspace=echo_frontend          # production build to dist/
npm run test:coverage --workspace=echo_frontend
```

In dev, Vite proxies `/api` and `/documentation` to the backend on port 4000 (see `vite.config.ts`), so start the backend too (`npm run dev` at the repo root does both).

## Runtime configuration

The bundle contains no configuration. On load it fetches `env.<mode>.json` (`SERVER_NAME`, `HAS_AUTHENTICATION`, `LOGS_INITIAL_DATE_DAYS_AGO`, `LOGS_MINIMAL_DATE_DAYS_AGO`) and parses it into the `FrontConfig` (`shared/config/utils/parseFrontConfig.ts`), read through `useConfig`. Where the app and the API are reached (`APP_URL`, `API_URL`) is not in it: `parseAppUrls` reads it from the `<base>` of the page, which the backend adds to `index.html` (and a plugin of `vite.config.ts` in dev), so the app works at any path behind a reverse proxy and on any address that reaches it. In dev these come from `public/`; in Docker the entrypoint regenerates `env.production.json` on every start. The app handles both authenticated and open modes.

## Layout

```
src/
  initializers/     providers setting up the API client and the config, query client, routing
  modules/
    auth/           sign-up and login
    logs/           log list, filters, filter Web Worker
      domain/         contracts the module needs from the outside
      infra/          their implementations: backend endpoints, Web Worker
      application/    TanStack Query hooks (one file per hook)
      presentation/   screen component with hooks/, layouts/, components/, utils/
  shared/           config and API client (contexts and hooks), navigation, i18n (English), layouts, theme, utils
  test/             render helpers for tests
```

Both modules have these four layers, `domain/` at the center, `application/` importing `infra/` directly (see [docs/architecture.md](../docs/architecture.md#frontend-layout)).

Live filtering runs in a Web Worker (`modules/logs/infra/workers/`) using the same functions as the backend, from `@echo/utilities`.
