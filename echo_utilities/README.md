# @echo/utilities

Shared package used by both `echo_backend` and `echo_frontend`. It is built to `dist/` and must be built before the other workspaces can type-check.

## Contents

- **Types**: the types the API exchanges, each inferred from its zod schema (`src/**/schemas/`), which also validates it at runtime and gives the backend the schema of its routes.
- **Env parsing**: `parseEchoEnv` for the variables common to frontend and backend (`SERVER_NAME`, `SERVER_URL`, `HAS_AUTHENTICATION`; `API_URL` and `APP_URL` are derived).
- **Log filtering**: `filterLogByCategories`, `filterLogBySearch`. Shared so server and client filter identically.
- **Helpers**: URL and domain utilities.

`src/index.ts` is the single barrel export. Import from `@echo/utilities`, never from internal paths.

## Commands

```bash
npm run build --workspace=echo_utilities
npm run test:coverage --workspace=echo_utilities
```
