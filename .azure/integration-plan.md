# Integration Handoff

## Backend
- Project: `services/anchi-learning-api`
- Run: `npm --prefix services/anchi-learning-api run start` (after build)
- Build: `npm run build --workspace @anchi/shared && npm run build --workspace @anchi/api`
- Port: `3000` (`PORT`)
- Health: `GET /api/health`
- OpenAPI: `GET /api/openapi.json`
- Persistence: no datastore. Child/question edits exist only in the API process; CSV data is parsed transiently and not retained as a file. API-side learner-progress persistence is out of scope.

## Frontend
- Project: `services/anchi-learning-web`
- Build: `npm --prefix services/anchi-learning-web run build`
- Dev: `npm --prefix services/anchi-learning-web run dev`
- API base: `VITE_API_BASE_URL`; local Vite proxy targets `http://localhost:3000` or `VITE_API_PROXY_TARGET`.
- Swap seam: `services/anchi-learning-web/src/api/index.ts`; replace `mockClient` with the live `ApiClient` implementation.
- Mock teardown: `src/api/mockClient.ts`, `src/mocks/data.ts`, local API types in `src/api/types.ts`, `src/api/previewState.ts`, and `PreviewStateSwitcher` in `src/App.tsx`. Keep `src/progress/progressStore.ts`; learner progress is browser-local IndexedDB data.
- Shared contracts: `services/shared`, package `@anchi/shared`. Use these entity/schema contracts in the live client; API compilation includes shared source through relative imports.

## API Routes
- `GET /api/health`
- `GET /api/children`
- `POST /api/children`
- `PATCH /api/children/:childId`
- `GET /api/questions?subject=&age=`
- `POST /api/questions`
- `PATCH /api/questions/:questionId`
- `DELETE /api/questions/:questionId`
- `POST /api/questions/import` (`multipart/form-data`: `file`, `subject`, `ageRange`)
- `POST /api/answers`
- `GET /api/openapi.json` (scaffold documentation endpoint)

## Database
- Type: none selected; browser IndexedDB is device-local progress storage, not a server datastore.
- Migrations: none; no database migration work is applicable.
- Seed data: explicitly create NO database seed data. Existing sample rows are in-memory API fixtures and frontend preview mocks only.
- Connection variables: none. API environment: `PORT`, `NODE_ENV`, `CORS_ORIGIN`; frontend: `VITE_API_BASE_URL`.

## Azure Services
- Essential: Azure Static Web Apps (React PWA), Azure App Service (Express API).
- Enhancement: none.

## Integration Results
- Database and migrations: Not applicable. The approved plan selects no server datastore; browser IndexedDB remains local progress storage. No migration or seed data was added.
- Backend: Shared contracts and API TypeScript builds passed. Health, OpenAPI, child CRUD, question CRUD/filtering, answer checking, and CSV import returned their expected successful responses.
- Frontend: Production build completed. The API seam now uses the typed live client; Vite continues to proxy `/api` to `http://localhost:3000` by default, with `VITE_API_BASE_URL` available for deployed API origins.
- Mock removal: Deleted the mock client, preview-state switcher/state module, and frontend sample data. API startup now begins with empty child and question collections.
- End-to-end: With API on port 3000 and Vite on port 5173, the parent form created a child through the live client and the API-backed child list rendered that profile. The browser began from the API's empty state.
- Validation note: Workspace test scripts were not run because the terminal could not resolve its command launcher consistently. Frontend source diagnostics and mock-reference scans were clean.
