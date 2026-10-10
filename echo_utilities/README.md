# @echo/utilities

Shared package used by both `echo_backend` and `echo_frontend`. It is built to `dist/` and must be built before the other workspaces can type-check.

## Contents

- **Types**: the types the API exchanges, each inferred from its zod schema (`src/**/schemas/`), which also validates it at runtime and gives the backend the schema of its routes.
- **Env parsing**: `parseConfig` for the variables common to frontend and backend (`SERVER_NAME`, `SERVER_URL`, `HAS_AUTHENTICATION`; `API_URL` and `APP_URL` are derived).
- **Log filtering**: `filterLogByCategories`, `filterLogBySearch`, and `parseLogSearchInput`, which turns what the user typed in the search field into the filters `filterLogBySearch` applies (`src/modules/logs/consts/logSearchFilter.ts` lists the fields a search can target). Shared so server and client filter identically.
- **Auth**: `needsSignupMessage`, the message of the 401 answer of the auth check when no account exists yet, which the frontend compares against.

It runs in the browser as well as in Node.js, so it imports no built-in module of Node.js (`npm run arch:check` refuses it). It has no side effect when imported (`"sideEffects": false`), which lets the frontend bundle leave out what it does not use.

`src/index.ts` is the single barrel export. Import from `@echo/utilities`, never from internal paths.

## Commands

```bash
npm run build --workspace=echo_utilities
npm run test:coverage --workspace=echo_utilities
```
