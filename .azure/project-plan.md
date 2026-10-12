# Project Plan

**Status**: Integrated
**Created**: 2026-10-12
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build AnChi Learning, a Vietnamese-language, installable learning PWA for children and their parents, with age-appropriate Math and Vietnamese activities, a map-based question journey, and a parent question-management experience. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**API Login**: No

**Mode**: NEW

**Deployment Plan**: No deployment plan found

**Persistence constraint**: `No datastore required` is the confirmed selection. Learner progress is therefore stored in browser IndexedDB and CSV imports are processed transiently by the API. Progress will not sync between devices, imported files will not be retained, and API-side progress persistence is out of scope until a datastore is selected.

---

## 2. Backend — Express API

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Framework** | Express |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | docker-compose |

The API owns child-profile endpoints, age- and subject-filtered question delivery, answer checking, question CRUD, and validated CSV import. Because no datastore was selected, question-bank edits live only for the API process lifetime; browser-local progress remains on its originating device. Treat those limits as first-release constraints, not durable multi-user storage.

---

## 3. Frontend — React PWA

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

The PWA provides Vietnamese child and parent interfaces, child profiles and age ranges, Math and Vietnamese activities (multiple choice, typed answers, and missing-letter prompts), map-based question nodes, animated progress, responsive iPad layouts, and an installable offline shell. IndexedDB holds device-local progress; the offline shell does not imply cross-device synchronization.

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Static Web Apps | Host the React PWA and its static assets | `VITE_API_BASE_URL` | `http://localhost:3000` | Essential |
| Azure App Service | Host the TypeScript/Express API | `PORT` | `3000` | Essential |

No Azure data store is provisioned for this plan, matching the confirmed `No datastore required` answer. Browser IndexedDB is local to each device; it is not an Azure service or a substitute for server-side persistence.

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | * | ✅ | 23.7.0 |
| npm | * | ✅ | 10.9.2 |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Google Chrome | frontend | ✅ | 154.0.8037.98 |

All listed prerequisites were positively detected. No local Azure-service emulator or Azure Functions extension is required because this plan has no emulated data service and uses an Express API rather than Azure Functions.

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: A map-first learning world for children, balanced by a calm, information-dense parent workspace. Use compact 4–8px corners for controls, lively teal and coral accents, clear progress cues, and uncluttered layouts sized for touch on iPad.
**Typography**: Segoe UI Variable, Trebuchet MS, sans-serif

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#146B65` | Learning-map actions, selected routes, and parent workspace links |
| `accent` | `#F18B63` | Active lesson markers, celebratory highlights, and secondary actions |
| `surface` | `#F5FAF8` | App canvas and calm lesson backgrounds |
| `text` | `#193431` | Vietnamese lesson prompts and parent data labels |
| `muted` | `#55716C` | Age labels, progress context, and supporting guidance |
| `border` | `#C8DAD5` | Map panels, question rows, and form-control boundaries |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Learning Map | `/` | Let a child choose Math or Vietnamese and continue along age-appropriate question nodes. | `header + nav + hero + grid + actions` |
| Activity | `/learn/:subject/:activityId` | Present one question at a time with answer choices or entry and visible lesson progress. | `header + nav + main + action-bar` |
| Parent Overview | `/parent` | Review child profiles, recent learning progress, and question-bank coverage. | `header + sidebar + main + tabs + table` |
| Import Questions | `/parent/import` | Assign a subject and age range, validate a CSV preview, and import question rows. | `header + sidebar + form + table + actions` |

### Sample Content

Learning Map — child profiles and learning paths:
| Child | Age | Subject path | Progress |
|---|---:|---|---|
| Bảo An | 7 | Toán: Phép cộng | 8 / 10 nodes |
| Minh Khuê | 9 | Tiếng Việt: Từ và câu | 6 / 8 nodes |
| Gia Huy | 6 | Toán: Làm quen số | 4 / 7 nodes |

Activity — question examples:
| Subject | Age | Prompt | Answer |
|---|---:|---|---|
| Toán | 7 | 8 + 5 = ? | 13 |
| Tiếng Việt | 8 | Điền chữ còn thiếu: con m_o | è |
| Tiếng Việt | 9 | Chọn từ chỉ hoạt động: bé đọc sách | đọc |

Parent Overview — recent progress:
| Child | Subject | Correct | Streak |
|---|---|---:|---:|
| Bảo An | Toán | 8 / 10 | 4 ngày |
| Minh Khuê | Tiếng Việt | 6 / 8 | 3 ngày |
| Gia Huy | Toán | 4 / 7 | 1 ngày |

Import Questions — validated CSV rows:
| Row | Subject | Age | Question | Correct answer | Status |
|---:|---|---:|---|---|---|
| 1 | Toán | 7 | 12 - 4 = ? | 8 | Hợp lệ |
| 2 | Tiếng Việt | 8 | Điền chữ: b_n học | ạ | Hợp lệ |
| 3 | Tiếng Việt | 9 | Từ nào đồng nghĩa với chăm chỉ? | siêng năng | Hợp lệ |

CSV defaults: subject `Toán` · age range `7-8 tuổi` · columns `subject, age, question, answer, choices`.

### Preview State Assignments

- Learning Map: populated data and a second lesson path in a loading skeleton state.
- Activity: populated question prompt and choices.
- Parent Overview: populated progress table plus an empty state for a filtered, not-yet-created question set.
- Import Questions: populated validation preview and an inline CSV-format error with retry action.

---

## 7. Project Structure

```text
AnChiLearning/
├── .azure/
│   └── project-plan.md
├── package.json
├── .env.example
├── services/
│   ├── anchi-learning-api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── validation/
│   │   │   └── server.ts
│   │   └── tests/
│   ├── anchi-learning-web/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── public/
│   │   └── src/
│   │       ├── api/
│   │       ├── components/
│   │       ├── pages/
│   │       └── progress/
│   └── shared/
│       ├── package.json
│       ├── schemas/
│       └── types/
└── docker-compose.yml
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | API health check | — | `{ status, services }` | 200, 503 |
| 2 | GET | `/api/children` | List child profiles | — | `{ children: Child[] }` | 200, 500 |
| 3 | POST | `/api/children` | Create a child profile | `{ name, age }` | `{ child: Child }` | 201, 422 |
| 4 | PATCH | `/api/children/:childId` | Update a child profile | `{ name?, age? }` | `{ child: Child }` | 200, 404, 422 |
| 5 | GET | `/api/questions` | Filter the question bank by subject and age | Query: `subject`, `age` | `{ questions: Question[] }` | 200, 422 |
| 6 | POST | `/api/questions` | Add a question | `{ subject, age, prompt, answer, choices? }` | `{ question: Question }` | 201, 422 |
| 7 | PATCH | `/api/questions/:questionId` | Update a question | `{ subject?, age?, prompt?, answer?, choices? }` | `{ question: Question }` | 200, 404, 422 |
| 8 | DELETE | `/api/questions/:questionId` | Remove a question | — | `{ deleted: true }` | 200, 404 |
| 9 | POST | `/api/questions/import` | Validate and import a CSV question file in memory | `multipart/form-data: file, subject, ageRange` | `{ imported, rejected, rows }` | 200, 400, 422 |
| 10 | POST | `/api/answers` | Check an answer and return feedback | `{ childId, questionId, answer }` | `{ correct, expectedAnswer, progress }` | 200, 404, 422 |

---

## 9. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to live data, smoke-test the backend, and create the migrations
3. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging
4. Run the **azure-deploy** agent when ready; it uses **azure-app-onboard** for architecture, cost estimation, IaC generation, provisioning, and health verification