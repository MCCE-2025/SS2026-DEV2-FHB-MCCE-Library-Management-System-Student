# Library Management System

System under test for the **FHB MCCE Test Automation** course.

---

## What the app does

The system models the operations of a public lending library:

- Members borrow and return books
- Late fees accrue at €0.50/day, capped at €20.00
- Books that are fully borrowed out can be reserved; the first reservation in the queue is automatically promoted when a copy is returned
- A documented REST API covers all operations
- A web UI provides access to all features

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| [Node.js](https://nodejs.org/) | 18 or newer |
| npm | included with Node.js |

No database server, no Docker, no Python required.

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/horvathkevin/FHB-MCCE-Library-Management-System-Student.git
cd FHB-MCCE-Library-Management-System-Student

# 2. Install dependencies
npm install

# 3. Seed the database with example data
npm run seed

# 4. Start the server
npm start
```

The server starts on **http://localhost:3000**.

---

## URLs

| URL | What's there |
|-----|-------------|
| `http://localhost:3000` | Web UI |
| `http://localhost:3000/api-docs` | Swagger UI — interactive API documentation |
| `http://localhost:3000/api-docs.json` | Raw OpenAPI spec (importable into Postman etc.) |

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start with auto-restart on file changes |
| `npm run seed` | Wipe the database and re-seed with example data |
| `npm test` | Run **all** suites (unit + api + integration) |
| `npm run test:unit` | Unit tests (`tests/unit/`) |
| `npm run test:unit:watch` | Unit tests in watch mode |
| `npm run test:unit:coverage` | Unit coverage → `coverage/` |
| `npm run test:api` | API tests (`tests/api/`) |
| `npm run test:api:watch` | API tests in watch mode |
| `npm run test:api:coverage` | API coverage → `coverage-api/` |
| `npm run test:integration` | Integration tests (`tests/integration/`) |
| `npm run test:integration:watch` | Integration tests in watch mode |
| `npm run test:integration:coverage` | Integration coverage → `coverage-integration/` |
| `npm run test:coverage` | All coverage reports |

> Run `npm run seed` before each testing session to reset the database to a known, clean state.

---

## Seed data

The seed script populates the database with realistic example data:

| Entity | Count |
|--------|-------|
| Books | 61 |
| Members | 55 (50 active, 5 inactive) |
| Loans | 55 (active, returned on time, returned late, overdue) |
| Reservations | 55 (pending, ready, cancelled) |

---

## API overview

| Base path | Domain |
|-----------|--------|
| `GET/POST /api/books` | Book catalog |
| `GET/PUT/DELETE /api/books/:id` | Single book |
| `GET/POST /api/members` | Members |
| `GET/PUT/DELETE /api/members/:id` | Single member |
| `POST /api/members/:id/activate` | Reactivate a member |
| `POST /api/members/:id/deactivate` | Deactivate a member |
| `GET/POST /api/loans` | Loans (borrow) |
| `GET /api/loans/:id` | Single loan |
| `POST /api/loans/:id/return` | Return a book |
| `GET /api/loans/:id/fee` | Calculate current fee |
| `GET/POST /api/reservations` | Reservations |
| `POST /api/reservations/:id/cancel` | Cancel a reservation |
| `GET /api/search/books` | Search books by title, author, ISBN, genre |
| `GET /api/search/members` | Search members by name or email |
| `GET /api/reports/members/:id/history` | Loan history for a member |
| `GET /api/reports/members/:id/stats` | Loan statistics for a member |
| `GET /api/reports/books/top` | Most borrowed books |
| `GET /api/reports/loans/overdue` | All currently overdue loans |

Full request/response documentation is available in the Swagger UI.

---

## Business rules

### Books
- ISBN must be a valid 10- or 13-digit number and is unique
- Publication year cannot be in the future
- A book with active loans cannot be deleted

### Members
- Email address is unique per member
- Members can be deactivated — inactive members cannot borrow or reserve
- A member with active loans cannot be deleted

### Borrowing
- A book can only be borrowed if at least one copy is available
- A member may not borrow the same book twice simultaneously
- A member may hold at most **5 active loans**
- Loans are due **14 days** after the borrow date

### Late fees
- Fee: **€0.50 per day** overdue
- Maximum fee: **€20.00** per loan
- Fee is calculated and frozen at the moment of return

### Reservations
- A book can only be reserved when all copies are currently on loan
- A member may hold at most **3 active reservations**
- Reservations are fulfilled in **FIFO order**
- When a book is returned, the oldest pending reservation is automatically promoted to "ready"

---

## Project structure

```
├── src/
│   ├── server.js           # Entry point — starts HTTP server on port 3000
│   ├── app.js              # Express app + Swagger setup
│   ├── db.js               # SQLite database wrapper (sql.js, file library.db)
│   ├── fees.js             # Pure functions: dueDate(), calculateFee() (late fees)
│   └── routes/
│       ├── books.js
│       ├── members.js
│       ├── loans.js        # borrow, return, GET /loans/:id/fee
│       ├── reservations.js
│       ├── search.js
│       └── reports.js      # overdue report uses accrued fees
├── tests/
│   ├── unit/
│   │   └── fees.test.js
│   ├── api/
│   │   └── loan-fee-api.spec.js
│   ├── integration/
│   │   └── return-fee-freeze.spec.js
│   ├── fixtures/
│   │   └── loans.js
│   └── helpers/
│       └── testApp.cjs
├── public/
│   ├── index.html
│   └── app.js
├── coverage/                    # Unit coverage (generated)
├── coverage-api/                # API coverage (generated)
├── coverage-integration/        # Integration coverage (generated)
├── seed.js
├── vitest.config.js
├── vitest.api.config.js
├── vitest.integration.config.js
└── package.json
```

---

## Running the project

From the repository root:

```bash
npm install          # once — install dependencies
npm run seed         # reset DB to known seed data (run before manual/API testing)
npm start            # http://localhost:3000
```

For development with auto-restart on file changes:

```bash
npm run dev
```

Open the web UI at `http://localhost:3000` or the API docs at `http://localhost:3000/api-docs`.

---

## Tests

### Unit tests (`tests/unit/`)

Pure functions in **`src/fees.js`**. Vitest + v8 → `coverage/`.

### API tests (`tests/api/`)

Single-endpoint HTTP checks (status, JSON body) via **Vitest + supertest**.
Example: `loan-fee-api.spec.js` → `GET /api/loans/:id/fee`, `GET /api/reports/loans/overdue`.

Coverage → `coverage-api/`.

### Integration tests (`tests/integration/`)

Multi-step flows across endpoints and DB state.
Example: `return-fee-freeze.spec.js` → borrow, return, fee stored and **frozen** on later reads.

Coverage → `coverage-integration/`.

### Shared test data (`tests/fixtures/`)

Reusable seed helpers (e.g. `fixtures/loans.js` — insert book, member, loan rows).
Used by both API and integration specs via `tests/helpers/testApp.cjs`.

CI: three workflows upload JUnit + Cobertura XML — `unit-tests.yaml`, `api-tests.yaml`, `integration-tests.yaml`.

```bash
npm test                      # unit + api + integration
npm run test:unit
npm run test:api
npm run test:integration
npm run test:coverage         # all three coverage folders
```

### Unit test catalogue (`tests/unit/fees.test.js`)

| # | Test name | What it verifies |
|---|-----------|------------------|
| 1 | exposes the business rule constants | `DAILY_RATE`, `MAX_FEE`, and `LOAN_DAYS` match the spec (€0.50, €20, 14 days). |
| 2 | adds exactly 14 calendar days to the borrow date | `dueDate('2024-06-01')` → `2024-06-15`. |
| 3 | rolls over to the next month | Borrow near month end produces correct due date in the next month. |
| 4 | rolls over to the next year | December borrow rolls into January. |
| 5 | handles leap-day borrow dates | Leap-year February dates add 14 days correctly. |
| 6 | handles month-end borrow dates | e.g. Jan 31 → Feb 14. |
| 7 | keeps due date in the same month when possible | Short month-span cases stay in one month. |
| 8 | returns an ISO date string (YYYY-MM-DD) | `dueDate()` output format. |
| 9 | returns 0 when returned on the due date | On-time return → €0.00. |
| 10 | returns 0 when returned before the due date | Early return → €0.00. |
| 11 | returns 0 when returned one day before due (boundary) | Last day before due → €0.00. |
| 12 | returns 0 when return date equals due date after borrow on day 0 | `dueDate()` + return on due → €0.00. |
| 13 | charges €0.50 for the first overdue day | First day after due → €0.50. |
| 14 | charges €1.00 for two overdue days | Linear rate for 2 days. |
| 15 | charges €5.00 for ten overdue days | Linear rate for 10 days. |
| 16 | charges €9.50 for nineteen overdue days | Linear rate below cap. |
| 17 | rounds fee to two decimal places | Fee is a valid monetary amount. |
| 18 | charges €19.50 for thirty-nine overdue days | One day below cap. |
| 19 | reaches exactly €20.00 at forty overdue days | Cap boundary (40 × €0.50). |
| 20 | stays capped at €20.00 beyond forty overdue days | Over-cap days still €20.00. |
| 21 | stays capped at €20.00 for very long overdue periods | Extreme overdue still capped. |
| 22 | uses today when returnDate is null | Active loan fee uses current date. |
| 23 | uses today when returnDate is undefined | Same as null for open loans. |
| 24 | returns 0 for an active loan not yet overdue | Open loan before due → €0.00. |
| 25 | does not mis-count overdue days when the clock hits 00:00 UTC | At 00:00 on due day → €0; at 00:00 next day → €0.50 (no off-by-one). |
| 26 | does not change when a fixed return date is supplied | Returned loan fee is frozen on return date. |
| 27 | dueDate() throws for an invalid borrow date | **Negative:** garbage input → `RangeError`. |
| 28 | calculateFee() returns NaN when dueDate is invalid | **Negative:** invalid due date → `NaN`. |

Coverage target: **100%** of `src/fees.js` (see `vitest.config.js`).

### API test catalogue (`tests/api/loan-fee-api.spec.js`)

| # | Test name | What it verifies |
|---|-----------|------------------|
| 1 | returns fee 0 for an active loan not yet overdue | `GET /api/loans/:id/fee` → 200, fee 0. |
| 2 | returns accrued fee for an active overdue loan | Overdue active loan returns calculated fee. |
| 3 | returns frozen fee for a returned loan | Returned loan reads stored fee from DB. |
| 4 | returns 404 when the loan does not exist | **Negative:** unknown loan → 404. |
| 5 | lists overdue active loans with accruedFee | `GET /api/reports/loans/overdue` shape + fee. |
| 6 | returns an empty array when no loans are overdue | Overdue report with no matches → `[]`. |

### Integration test catalogue (`tests/integration/return-fee-freeze.spec.js`)

| # | Test name | What it verifies |
|---|-----------|------------------|
| 1 | calculates fee on return and keeps it frozen on later fee checks | Return → store fee → time passes → fee unchanged. |
| 2 | returns 409 when the loan was already returned | **Negative:** double return → 409. |
| 3 | returns 404 when returning a missing loan | **Negative:** unknown loan return → 404. |
| 4 | creates a loan with due date 14 days after borrow | `POST /api/loans` borrow flow + due date. |
