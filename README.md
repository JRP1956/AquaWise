# AquaWise — Smart Water Conservation and Awareness Portal

> A MERN web portal for **UN SDG 6 — Clean Water and Sanitation**, targets 6.1 (safe
> drinking water for all) and 6.4 (water-use efficiency).

Mini project for **Web Programming Laboratory (216U40L501)**, Sem 5, TY EXCP-A,
K J Somaiya College of Engineering, Somaiya Vidyavihar University.

| | |
| --- | --- |
| **Team** | *(member 1 — name, roll no.)*, *(member 2 — name, roll no.)* |
| **Guide** | Prof. Sonia Joshi |
| **Stack** | HTML5 · CSS3 · Bootstrap 5 · JavaScript · React · Node.js/Express · MongoDB |

---

## The problem

Households rarely know three things: how much water they actually use, what to do the
moment supply fails or turns unsafe, and who to call about it. Meanwhile NITI Aayog puts
nearly 600 million Indians under high to extreme water stress, and one in four people
worldwide still lacked safely managed drinking water in 2024.

AquaWise answers all three in one portal, and adds the layer that individual advice
misses — the housing society, where most urban water problems are actually fixed.

## The three functionalities

### 1. Water requirement & usage calculator
Household details in; litres per day out, split across eight activities, compared against
the CPHEEO planning norm for your city type (70 / 135 / 150 lpcd) and the WHO service
levels. It flags **both** over-use and under-supply — a family receiving 40 lpcd does not
need a lecture about shorter showers. Ends with the three changes that would save the most
water in *your* home, with the litres each would save.

All formulas, constants and sources are in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) §7.

### 2. Crisis advisory engine
Pick one of five problems — leakage, no supply, unsafe drinking water, low pressure,
contamination — answer one to three questions, and get ordered steps plus the right contact.
14 rules, matched most-severe-first. Critical rules raise a 112 emergency banner. Logged-in
members see their own society's numbers instead of the generic directory, and can turn the
advice into a pre-filled complaint in one click.

The rules live in [`shared/advisory-rules.json`](shared/advisory-rules.json) as data — adding
a sixth problem type means editing JSON, not code.

### 3. Society portal
Sign up, create or join a society by 6-character code, file complaints that are **routed
automatically** to whoever handles that category, and track them through
active → in progress → resolved with a full audit trail. The filer can reopen a complaint
within 7 days. Session-based authentication, bcrypt password hashing, role checks on every
protected route.

---

## Running it locally

**You need:** Node.js 20+ and a MongoDB database (a free
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster is easiest — no local
install needed).

```bash
git clone <your-repo-url> && cd wpl-miniproject
npm run install:all
```

Configure the server:

```bash
cp server/.env.example server/.env
```

Then edit `server/.env` and set:
- `MONGODB_URI` — your Atlas connection string, or `mongodb://127.0.0.1:27017/aquawise`
- `SESSION_SECRET` — generate one with `openssl rand -hex 32`

Load the demo data (a society, three users, three complaints in different states):

```bash
npm --prefix server run seed
```

Run the two servers in separate terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Open **http://localhost:5173**. Vite proxies `/api` to the server on port 4000.

### Demo accounts (after seeding)

| Role | Email | Password |
| --- | --- | --- |
| Society admin | `asha@aquawise.test` | `water1234` |
| Resident | `vikram@aquawise.test` | `water1234` |
| Resident | `meera@aquawise.test` | `water1234` |

Join code for **Sagar Darshan CHS**: `AQUA26`

---

## Tests

```bash
npm test
```

Runs the pure-function suites for the calculator formulas and the advisory resolver —
no React, no Express, no database (NFR-M2).

```bash
npm --prefix server test
```

Runs the end-to-end API suite: boots the real Express app against an in-process MongoDB and
walks the whole journey, including every permission boundary and failure case. First run
downloads a MongoDB binary, so give it a minute.

There is also a Postman collection at
[docs/AquaWise.postman_collection.json](docs/AquaWise.postman_collection.json) — import it,
set `baseUrl`, and run the folders in order. Results are logged in
[docs/testing.md](docs/testing.md).

---

## API

Errors always come back as `{ error: { code, message, fields? } }`.

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Service check |
| POST | `/api/auth/signup` | — | Create an account |
| POST | `/api/auth/login` | — | Start a session (rate-limited) |
| POST | `/api/auth/logout` | — | Destroy the session |
| GET | `/api/auth/me` | session | Current user + society |
| PATCH | `/api/auth/password` | session | Change password |
| POST | `/api/societies` | session | Create a society, become its admin |
| POST | `/api/societies/join` | session | Join by code |
| GET | `/api/societies/mine` | member | Society details and contacts |
| GET | `/api/societies/mine/members` | member | Member list |
| POST | `/api/societies/mine/join-code` | admin | Regenerate the join code |
| POST | `/api/societies/mine/contacts` | admin | Add a routing contact |
| DELETE | `/api/societies/mine/contacts/:id` | admin | Remove a contact |
| POST | `/api/complaints` | member | File a complaint |
| GET | `/api/complaints` | member | List (own, or all for admin) + counts |
| GET | `/api/complaints/:id` | member | One complaint with history |
| PATCH | `/api/complaints/:id/status` | admin / filer | Advance or reopen |
| POST | `/api/calculator` | optional | Compute usage; saves if logged in |
| GET | `/api/calculator/history` | session | Last 10 saved runs |
| GET | `/api/advisory/rules` | — | Problem types and questions |
| POST | `/api/advisory/evaluate` | optional | Resolve answers to a rule |

---

## How the code is organised

```
wpl-miniproject/
├── shared/                     Pure logic, imported by BOTH client and server
│   ├── calculator.js             Formulas, validation, bands, savings  (§7)
│   ├── advisory.js               Rule resolver — data in, rule out     (§8)
│   ├── advisory-rules.json       The 14 rules, as data
│   └── *.test.js                 Unit tests, no framework
│
├── server/src/
│   ├── models/                   Mongoose schemas + their own validation
│   ├── controllers/              One function per use case
│   ├── routes/                   Paths, express-validator chains, middleware order
│   ├── middleware/               auth · validate · error
│   ├── app.js                    Express assembly (helmet, cors, session, routes)
│   ├── index.js                  Connects to Mongo, starts listening
│   ├── seed.js                   Demo data
│   └── api.test.js               End-to-end API tests
│
├── client/src/
│   ├── pages/                    One file per screen
│   ├── components/               Navbar · Footer · ProtectedRoute · Field
│   ├── context/AuthContext.jsx   Session state for the whole app
│   ├── api/client.js             One fetch wrapper
│   └── styles/aquawise.css       Bootstrap 5 theme from the design spec
│
└── docs/                         Requirements, UI design, SE deliverables, testing
```

**Why `shared/` exists.** The calculator has to run in the browser (so a guest gets an
instant result) and on the server (so a saved run cannot be forged). Two copies of the
formulas would drift apart the first time a constant changed. One module, imported by both,
cannot.

## Security

- Passwords hashed with bcrypt, cost 12, never returned by any endpoint
- Sessions in MongoDB via `connect-mongo`; cookie `httpOnly`, `sameSite`, `secure` in
  production, 2-hour expiry, session ID regenerated on login
- `requireAuth` / `requireRole` / `requireSociety` middleware on every protected route —
  hiding a button is not access control
- Login rate-limited to 5 failed attempts per 15 minutes per IP
- `helmet()`, CORS restricted to the client origin, `express-mongo-sanitize` against NoSQL
  injection
- Every input validated on the client **and again** on the server; the server is the authority
- Secrets only in environment variables; `.env` is git-ignored

## Deploying

The server needs `MONGODB_URI`, `SESSION_SECRET`, `CLIENT_ORIGIN` and `NODE_ENV=production`.
The client needs `VITE_API_BASE` set to the deployed API URL at build time. Because the
cookie is `sameSite=none; secure` in production, both must be served over HTTPS.

## Documentation

| Document | What is in it |
| --- | --- |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Problem statement, 41 functional requirements, formulas with sources, the 14 advisory rules, full data model, assumptions register |
| [docs/se-deliverables/](docs/se-deliverables/) | Use-case diagram and specs, ER diagram, DFD levels 0 and 1 |
| [docs/ui-design/](docs/ui-design/) | Colour palette, type scale, annotated wireframes for all 7 screens |
| [docs/testing.md](docs/testing.md) | Test-case table with results |

## References

Full list with links in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). The main ones:
WHO/UNICEF JMP 2025 · NITI Aayog CWMI 2018 · CPHEEO Manual and BIS IS 1172:1993 ·
Howard & Bartram (WHO, 2003) · Jal Jeevan Mission · US EPA WaterSense · Water Research
Foundation REU2016 · US CDC emergency water treatment · MHA ERSS-112.
