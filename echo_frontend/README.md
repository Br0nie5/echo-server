# echo_frontend

The web app of Echo: a single-page app to browse, filter and search logs, with an optional login. React 19, MUI, TanStack Query and React Router, built with Vite.

It has two screens, below the path it is served under:

| Path    | Screen                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/logs` | The logs, from a start date to now, in boxes by day, by group and by job, with a date picker, level chips and a search bar.       |
| `/auth` | The login form, or the sign-up form while no account exists. Only with the authentication: without it, the app opens on the logs. |

Any other path goes to the default screen.

## Commands

Run from this directory.

```bash
npm run dev             # Vite dev server on http://localhost:5173
npm run build           # type-check, then production build to dist/
npm run preview         # serves the build
npm run lint            # eslint --fix, Prettier included
npm run format          # prettier --write
npm run arch:check      # dependency-cruiser rules (.dependency-cruiser.mts)
npm run test            # vitest run
npm run test:coverage   # vitest run --coverage, 100% threshold
npm run test:watch
npm run open:coverage   # serves coverage/ on port 9003, until stopped, the cache off so a reload shows the latest run
```

`npm run build` type-checks the sources and the tests (`tsc -b`) before building.

The dev server serves the app under `/app` and proxies `/api` and `/documentation` to `http://localhost:4000`, where it expects the API (see `vite.config.ts`). The app and the API then share one origin, as they do once deployed.

## Runtime configuration

The bundle holds no configuration, so one build fits any deployment. The app reads it when it loads, from two places.

**`env.<mode>.json`**, fetched next to the app, holds its variables, each written as text, as a number or as a boolean:

| Variable                     | Description                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `SERVER_NAME`                | The name shown in the header.                                                                 |
| `HAS_AUTHENTICATION`         | Whether the app has an auth screen.                                                           |
| `LOGS_INITIAL_DATE_DAYS_AGO` | How many days back the logs start when the address gives no `fromDate`. At most the next one. |
| `LOGS_MINIMAL_DATE_DAYS_AGO` | How many days back the start date can be set at most.                                         |

`public/` holds the file of each mode, and the build leaves `env.development.json` out. Whoever deploys the app writes `env.production.json` again.

**The `<base>` of the page** says where the app is served, the path of a reverse proxy included. Whatever serves `index.html` adds it. `appUrl` is that URL and `apiUrl` is next to it, under `/api` (`parseAppUrls`), both on the host the user reached. The build therefore only uses relative URLs. In dev, a plugin of `vite.config.ts` adds the `<base>`.

`parseFrontConfig` (`shared/config/utils/`) builds the `FrontConfig` from both, its numbers of days ago turned into the dates the logs start at when the app loads (`logsInitialDate`, `logsMinimalDate` and `logsMaximalDate`), and `useConfig` gives it. The app shows an error page when the file cannot be loaded or when a variable is missing or not valid.

## Layout

```
src/
  main.tsx          the entry point
  App.tsx           the composition root: the router inside the providers
  initializers/     what App.tsx sets up: the providers (theme, query client, config, API client) and the routes
  modules/
    auth/           sign-up and login
    logs/           the logs, their filters, the filter Web Worker
      domain/         the contract the module needs from the outside
      infra/          its implementation: the endpoints of the API, the Web Worker
      application/    the TanStack Query hooks, one per file
      presentation/   the screen, with its hooks/, layouts/, components/ and utils/
  shared/           the config and the API client (contexts and hooks), navigation, i18n (English), components, layouts, hooks, theme, utils
  test/             the helpers of the tests: the render functions, with components/, mocks/ and utils/
```

Both modules have these four layers, `domain/` at the center:

- `presentation/` imports `application/`, which imports the hook of `infra/` directly: nothing is injected.
- `domain/` imports no other layer and no package, only the models of `@echo/utilities`.
- Only `presentation/` imports MUI or React Router.
- A module never imports another module, and `shared/` imports nothing of the rest of `src/`.

`npm run arch:check` enforces all of it.

## How it works

**The filters are in the address.** The logs screen reads its start date, its levels and its search from the query params (`fromDate`, `logLevels`, `logSearch`) and writes them back at each change, so a filtered view can be bookmarked. A start date outside of the dates the picker offers, such as the one of an old bookmark, is moved to the closest one.

**Only the start date is given to the API.** The levels and the search are applied in the app, in a Web Worker (`modules/logs/infra/workers/`), so changing a filter asks the API nothing and typing a search never freezes the page. The filtering is debounced, and one whose filters changed before it ended is cancelled.

**A 401 goes to the auth screen.** `useSendApiRequest` (`shared/api/`) sends every request to the API. When the answer is a 401, it navigates to the auth screen, with the page the user was on as the `redirect` query param, where they are sent back once authenticated. No request handles it on its own.

**Every answer of the API is validated** against its zod schema of `@echo/utilities`, in the `infra/` of each module.

**The texts are translations.** `useAppTranslation` gives the function translating a key, an unknown key being a compile error (`shared/i18n/`).

**Data stays on screen while it reloads.** When the start date or the filters change, the logs already displayed stay, under a progress bar, until the new ones are ready (`keepPreviousData`). The auth check is the exception: it is fetched fresh each time the auth screen opens.

**The look is in the theme.** Every color, text style, spacing and shape a component uses is a role of `shared/theme.ts`, named after where it is used: `palette` (`logLevelBackground`, `logJobBorder`), the `typography` variants (`logJobTitle`, `logMessage`), `shape` (`logCardRadius`, `logJobRadius`) and `dimensions`, grouped by the place that uses them. Only the layout (`flex`, alignment, overflow) is written in the components.

**Dates are those of the user.** The logs are grouped by day and their dates formatted in the time zone and the locale of the browser.

## Tests

The tests live in a `__tests__` directory next to the code they test. They never reach the network: `nock` answers the requests, and a request that is mocked but never sent fails its test (`src/setupTests.ts`).

- **A module is tested through its screen**, with a few integration tests (`LogsScreen.test.tsx`, `AuthScreen.test.tsx`): a snapshot shows what the user sees, for each layout, and every other test is an action of the user (filtering, opening and closing a box, logging in), one test telling a whole feature.

  ```tsx
  nock(mockAppUrls.apiUrl).get('/auth/status').reply(200, { status: 'authenticated' })

  const screen = renderFakeRouterApp('/auth')

  expect(await screen.findByTestId(getRouteTestId('/logs'))).toBeInTheDocument()
  ```

  `renderFakeRouterApp` (`src/test/`) renders the app at a path, with its real providers and router, and the screen of that path as the only real one: any other screen is an empty box with a test id (`getRouteTestId`), so a test checks where the app navigated without rendering another module nor mocking its requests. `renderRealRouterApp` renders every screen for real, for the snapshots.

- **Only the outside is replaced**: the network, and the Web Worker, which the page of the tests cannot start. `stubFilterWorker` runs the code of the worker on the thread of the test.
- **`shared/`, the `utils/` folders and the edge cases of `infra/`** have unit tests. A component is rendered alone with `renderComponent`, and a hook that needs the config, the API or the router with `renderAppHook`.
- **`src/__tests__/App.test.tsx`** is the unit test of the app itself: its config (which cannot be loaded, or is not valid) and its routes, with and without authentication. Both screens are mocked there, so a change in a screen never changes that file. `App.tsx` and `initializers/` have no other test.

A test finds a text of the app by its translation key (`appTranslation`), never by the text itself. The tests run in UTC and in British English (`vitest.globalSetup.ts`), since the app groups and formats the logs in the time zone and the locale of the user.
