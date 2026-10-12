# echo_frontend

The web app of Echo: a React 19 + MUI + TanStack Query single-page app to browse and filter logs, with an optional login.

## Commands

Run from this directory.

```bash
npm run dev             # Vite dev server on http://localhost:5173
npm run build           # type-check, then production build to dist/
npm run lint            # eslint --fix
npm run arch:check      # dependency-cruiser rules (.dependency-cruiser.mts)
npm run test:coverage   # vitest run --coverage, 100% threshold
npm run test:watch
```

The dev server serves the app under `/app` and proxies `/api` and `/documentation` to `http://localhost:4000`, where it expects the API (see `vite.config.ts`). The app and the API then share one origin, as they do once deployed.

## Runtime configuration

The bundle contains no configuration, so one build fits any deployment. The app reads it when it loads, from two places:

- **`env.<mode>.json`**, fetched next to the app: `SERVER_NAME`, `HAS_AUTHENTICATION`, `LOGS_INITIAL_DATE_DAYS_AGO` and `LOGS_MINIMAL_DATE_DAYS_AGO`, each written as text, a number or a boolean. `public/` holds the one of each mode. Whoever deploys the app writes `env.production.json` again.
- **The `<base>` of the page**, which whatever serves `index.html` adds to it: it says where the app is served, the path of a reverse proxy included. `APP_URL` is that URL and `API_URL` is next to it (`parseAppUrls`), both on the host the user reached. The build therefore only uses relative URLs. In dev, a plugin of `vite.config.ts` adds the `<base>`.

`parseFrontConfig` (`shared/config/utils/`) builds the `FrontConfig` from both, and `useConfig` gives it. The app displays an error page when the file cannot be loaded or is not valid.

With `HAS_AUTHENTICATION` set to `false`, the app has no auth screen and opens on the logs.

## Layout

```
src/
  main.tsx          entry point
  App.tsx           composition root: the router inside the providers
  initializers/     what App.tsx sets up: the providers (theme, query client, config, API client) and the routes
  modules/
    auth/           sign up and login
    logs/           the logs, their filters, the filter Web Worker
      domain/         contracts the module needs from the outside
      infra/          their implementations: the endpoints of the API, the Web Worker
      application/    TanStack Query hooks, one file per hook
      presentation/   the screen, with its hooks/, layouts/, components/ and utils/
  shared/           the config and the API client (contexts and hooks), navigation, i18n (English), components, layouts, theme, utils
  test/             helpers of the tests: the render functions, with components/, mocks/ and utils/
```

Both modules have these four layers, `domain/` at the center. `presentation/` imports `application/`, which imports the hooks of `infra/` directly, and a module never imports another one. `npm run arch:check` enforces it.

The level and search filters are applied in the app, in a Web Worker (`modules/logs/infra/workers/`), so typing a search never freezes the page. Only the date the logs start at is given to the API.

## Tests

Tests live in a `__tests__` directory next to the code they test. They never reach the network: `nock` answers the requests, and a request that is mocked but never sent fails its test (`src/setupTests.ts`).

- **Modules** are tested through their screen, with a few integration tests: a snapshot shows what the user sees, and every other test is an action of the user (filtering, opening and closing a box, logging in), one test telling a whole feature. `renderFakeRouterApp` (`src/test/`) renders the app at a path, with its real providers and router, and the screen of that path as the only real one: any other screen is an empty box with a test id (`getRouteTestId`), so a test checks where the app navigated without rendering another module. `renderRealRouterApp` renders every screen for real, for the snapshots. Only the network is mocked, and the Web Worker, which the page of the tests cannot start (`stubFilterWorker`). `App.tsx` and `initializers/` have no test of their own, since every screen test goes through them.
- **`shared/`** and the `utils/` folders have unit tests, a component being rendered alone with `renderComponent`, and a hook that needs the config, the API or the router with `renderAppHook`.
- **`src/__tests__/App.test.tsx`** is the unit test of the app itself: its config (which cannot be loaded, or is not valid) and its routes, with and without authentication. Both screens are mocked there, so a change in a screen never changes that file.

A test finds a text of the app by its translation key (`appTranslation`). The tests run in UTC and in British English (`vitest.globalSetup.ts`), since the app groups and formats the logs in the time zone and the locale of the user.
