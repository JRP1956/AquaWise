# AquaWise — Test Plan and Results

Last run: 22 September 2026 · Node 22.23.1 · macOS (arm64)

Testing is in three layers, deliberately: the **unit layer** proves the two pieces of real
logic in isolation, the **API layer** proves the whole server behaves — including every
permission boundary — and the **manual layer** covers what only a human can judge, such as
layout and keyboard access.

| Layer | What it covers | How to run | Result |
| --- | --- | --- | --- |
| Unit (23 cases) | Calculator formulas, bands, validation; advisory rule resolution | `npm test` | **23 / 23 pass** |
| API end-to-end (29 cases) | Every endpoint, both success and failure, against a real MongoDB | `npm --prefix server test` | **29 / 29 pass** |
| Postman (28 assertions) | The same API, run by hand for the demo | Import `docs/AquaWise.postman_collection.json` | see §3 |
| Manual (18 cases) | Responsiveness, validation messages, accessibility, navigation | §4 | see §4 |

---

## 1. Unit tests — `shared/`

No React, no Express, no database (NFR-M2). Run with `node --test`; no test framework is
installed.

### 1.1 Calculator — `shared/calculator.test.js`

| ID | Test case | Input | Expected | Result |
| --- | --- | --- | --- | --- |
| TC-C01 | Worked example from requirements §7.4 | 2 adults + 2 children, metro, 1 standard 7.8-min shower/person, standard toilet, 5 standard loads/week, 2 tap-min/person, 1 dripping tap | bath 295.15, toilet 121.20, laundry 54.08, tap 66.64, drink+cook 30, utensils 80, leak 31.11; **total 678.18 L/day**, 169.55 lpcd, band `overuse` | ✅ Pass |
| TC-C02 | Efficient fixtures bring the household inside the norm | TC-C01 with efficient shower, toilet, machine and no leak | total 547.68 L/day, below 150 lpcd, no flags | ✅ Pass |
| TC-C03 | Breakdown sums to the total | TC-C01 | Σ byActivity = totalLitresPerDay ± 0.01 | ✅ Pass |
| TC-C04 | Minimal single-person household | 1 adult, half a bucket bath, efficient toilet, no machine, no taps | 61.75 L/day → band `basic`; with no bathing, 51.75 → `undersupply` | ✅ Pass |
| TC-C05 | Band boundaries, first match wins (§7.3) | lpcd = 19.99 / 20 / 54.99 / 55 / 99.99 / 100 / 150 / 150.01 / 200 / 200.01 | `critical_undersupply`, `undersupply`, `undersupply`, `basic`, `basic`, `within_norm`, `within_norm`, `overuse`, `overuse`, `severe_overuse` | ✅ Pass |
| TC-C06 | The norm changes with city type | 120 lpcd in a town (70) vs a sewered city (135) | `overuse` vs `within_norm` | ✅ Pass |
| TC-C07 | Supply check flags both shortfalls (FR-C8) | TC-C01 + 200 L/day received | supplied 50 lpcd, shortfall 478.18 L, flags `undersupply_norm` **and** `supply_below_need` | ✅ Pass |
| TC-C08 | Ample supply raises no shortfall flag | TC-C01 + 900 L/day received | shortfall 0, no `supply_below_need` | ✅ Pass |
| TC-C09 | Top-3 savings are ranked and real (FR-C9) | TC-C01 | `[bath, toilet, utensilsClean]`; bath saves 58.97 L, toilet 24.20 L | ✅ Pass |
| TC-C10 | Invalid input is rejected field by field (FR-C12) | adults 0, children "two", showerMinutes 999 | three field errors, `results` is `null` | ✅ Pass |
| TC-C11 | Optional fields fall back to documented defaults | Required fields only | showerMinutes 7.8, showers 1, supplied `null` | ✅ Pass |
| TC-C12 | A blank required field is an error, not a default | adults "", cityType "" | both reported as required | ✅ Pass |
| TC-C13 | Bathing mode zeroes the other term | mode `bucket` with showers 2; mode `shower` with buckets 2 | the irrelevant term is forced to 0 — no double counting | ✅ Pass |
| TC-C14 | Household size cap across fields | 20 adults + 20 children | "cannot exceed 30" on `children` | ✅ Pass |

### 1.2 Advisory — `shared/advisory.test.js`

| ID | Test case | Input | Expected | Result |
| --- | --- | --- | --- | --- |
| TC-A01 | All 14 rules load and are internally consistent | the rules file | every rule has a known problem, ≥1 step, ≥1 known contact key | ✅ Pass |
| TC-A02 | Five problem types, each asking 1–3 questions (FR-A2) | catalogue | `leakage`, `no_supply`, `unsafe_drinking_water`, `low_pressure`, `contamination` | ✅ Pass |
| TC-A03 | Rules are ordered most-severe-first | leakage, no supply | `[LK-3, LK-2, LK-1]`, `[NS-3, NS-2, NS-1]` | ✅ Pass |
| TC-A04 | Leakage answers map to the documented rules | dripping / joint / burst | LK-1 / LK-2 / LK-3 | ✅ Pass |
| TC-A05 | A hazard answer escalates on its own | dripping tap **+ water near switches** | LK-3, not LK-1 | ✅ Pass |
| TC-A06 | No-supply escalates on duration *or* vulnerability | <24h / >24h / >72h / <24h + infant at home | NS-1 / NS-2 / NS-3 / NS-3 | ✅ Pass |
| TC-A07 | The other three problem types resolve correctly | UD, LP and CT answer sets | UD-1, UD-2, LP-1, LP-2, LP-3, CT-1, CT-2, CT-3 | ✅ Pass |
| TC-A08 | Only critical rules raise the 112 banner (FR-A5) | LK-3 vs LK-1 vs UD-1 (high) | `emergency` true / false / false | ✅ Pass |
| TC-A09 | Steps come back in stored order (FR-A3) | LK-3 | identical array to the rules file | ✅ Pass |
| TC-A10 | Unknown types and missing answers are rejected | `earthquake`; leakage with one answer; `scope: the_moon` | field errors, `rule` is `null` — never a guess | ✅ Pass |
| TC-A11 | The result carries the complaint category (FR-A8) | contamination / sewage | `complaintCategory: contamination` | ✅ Pass |
| TC-A12 | Society contacts replace the generic ones (FR-A4) | a society with its own admin, maintenance contact and helpline | society numbers substituted; **112 is never overridden** | ✅ Pass |

---

## 2. API end-to-end tests — `server/src/api.test.js`

Boots the real Express app against an in-process MongoDB. Each user is a separate
supertest agent, so session cookies behave exactly as they do in a browser.

| ID | Test case | Expected | Result |
| --- | --- | --- | --- |
| TC-API-00a | Health check | 200, `{ ok: true }` | ✅ Pass |
| TC-API-00b | Unknown route | 404 in the standard error shape | ✅ Pass |
| TC-API-01 | Signup with valid details | 201; **no password hash in the response**; role forced to `resident` | ✅ Pass |
| TC-API-02 | Signup with a duplicate email | 409 with a field message on `email` | ✅ Pass |
| TC-API-03 | Signup with a weak password and bad phone | 400 naming both fields | ✅ Pass |
| TC-API-04 | Login with a wrong password | 401, message reveals *neither* field — no account enumeration | ✅ Pass |
| TC-API-05 | Protected routes with no session | 401 on `/auth/me` and `/complaints` | ✅ Pass |
| TC-API-06 | Login → `/me` → logout → `/me` | 200, 200, 200, **401** — the session really ends | ✅ Pass |
| TC-API-07 | Create a society | 201; 6-char join code; creator becomes `society_admin` | ✅ Pass |
| TC-API-08 | Create with a bad pincode and no flat number | 400 naming `address.pincode` and `flatNo` | ✅ Pass |
| TC-API-09 | Join by code | 200; member appears in the member list; count updates | ✅ Pass |
| TC-API-10 | Join with an unknown code | 404 | ✅ Pass |
| TC-API-11 | Resident tries to add a routing contact | **403**; the same call by the admin returns 201 | ✅ Pass |
| TC-API-12 | Regenerate the join code | new code works, **old code returns 404** (FR-S7) | ✅ Pass |
| TC-API-13 | File a complaint | 201; number `AQW-2026-NNNN`; status `active`; routed to the maintenance contact | ✅ Pass |
| TC-API-14 | File under a category with no matching contact | falls back to the society admin (FR-S12) | ✅ Pass |
| TC-API-15 | File with a 4-character title and 3-character description | 400 naming both fields; nothing stored | ✅ Pass |
| TC-API-16 | List as resident vs as admin | resident sees own only (`scope: own`); admin sees all; **both see society-wide counts** | ✅ Pass |
| TC-API-17 | Filter by status and category | only matching rows returned | ✅ Pass |
| TC-API-18 | Status change: resident, then admin without a note, then with one | 403, 400 (`note` required), 200 with history appended | ✅ Pass |
| TC-API-19 | Illegal state moves | `in_progress → active` 400; `in_progress → in_progress` 400 | ✅ Pass |
| TC-API-20 | Resolve, then the filer reopens | 200; `resolvedAt` set then cleared; 4 history entries (FR-S15) | ✅ Pass |
| TC-API-21 | Member of another society opens this complaint | **403** — ownership checked on the server, not just hidden in the UI | ✅ Pass |
| TC-API-22 | Guest calculation | matches the shared module exactly (678.18 / 169.55 / `overuse`); `saved: false` | ✅ Pass |
| TC-API-23 | Calculation with `adults: 0` and `cityType: "moon"` | 400 naming both fields | ✅ Pass |
| TC-API-24 | Logged-in calculation with forged `results` in the body | saved; **the forged total is discarded** and the server's own figure stored | ✅ Pass |
| TC-API-25 | Advisory catalogue as a guest | 200, five problem types | ✅ Pass |
| TC-API-26 | Advisory evaluation, guest vs member | guest sees BMC 1916; the member sees their own maintenance number | ✅ Pass |
| TC-API-27 | Advisory with a question unanswered | 400 naming the question | ✅ Pass |

**Result: 29 / 29 pass.**

### Console output

```
▶ TC-API-00 — service
  ✔ health check responds
  ✔ an unknown route returns the standard error shape
▶ TC-API-01..06 — signup, login, session
  ✔ TC-API-01: signup creates an account and never returns the password hash
  ✔ TC-API-02: a duplicate email is rejected with 409 and a field message
  ✔ TC-API-03: weak passwords and bad phone numbers are rejected field by field
  ✔ TC-API-04: a wrong password is rejected without revealing which field was wrong
  ✔ TC-API-05: a protected route without a session returns 401
  ✔ TC-API-06: login starts a session that /me can read, and logout ends it
▶ TC-API-07..12 — societies
  ✔ TC-API-07: creating a society makes the creator its admin and issues a join code
  ✔ TC-API-08: an invalid pincode or missing flat number is rejected
  ✔ TC-API-09: a resident joins with the code and appears in the member list
  ✔ TC-API-10: a wrong join code is rejected
  ✔ TC-API-11: only the society admin can add routing contacts
  ✔ TC-API-12: regenerating the join code stops the old one working
▶ TC-API-13..20 — complaints
  ✔ TC-API-13: filing a complaint numbers it and routes it by category
  ✔ TC-API-14: a category with no matching contact falls back to the society admin
  ✔ TC-API-15: a short description is rejected before anything is stored
  ✔ TC-API-16: residents see only their own complaints, admins see the whole society
  ✔ TC-API-17: filtering by status and category narrows the list
  ✔ TC-API-18: a resident cannot change a complaint status; the admin must supply a note
  ✔ TC-API-19: the state machine refuses a move it does not allow
  ✔ TC-API-20: the filer can reopen within the 7-day window; nobody else can
  ✔ TC-API-21: a member of another society cannot read this one's complaints
▶ TC-API-22..26 — calculator and advisory
  ✔ TC-API-22: a guest calculation matches the shared module exactly
  ✔ TC-API-23: invalid calculator input returns field errors, not a result
  ✔ TC-API-24: a logged-in run is saved and appears in history; results sent by the client are ignored
  ✔ TC-API-25: the advisory rule catalogue is served to guests
  ✔ TC-API-26: evaluation picks the right rule, and a member sees their own contacts
  ✔ TC-API-27: an unanswered advisory question returns a field error
```

> Attach a screenshot of this run to the report.

---

## 3. Postman collection

`docs/AquaWise.postman_collection.json` — 28 assertions across six folders, mirroring the
API suite. Import it, set `baseUrl` to `http://localhost:4000`, seed the database, then use
**Run collection** so the folders execute in order (later requests reuse the join code and
complaint id stored by earlier ones).

| Folder | Requests | Covers |
| --- | --- | --- |
| 0. Health | 1 | Service is up |
| 1. Auth | 7 | Signup (valid, weak password, duplicate), login (wrong, right), `/me` (with and without a session) |
| 2. Societies | 4 | Society details, members, adding a contact, bad join code |
| 3. Complaints | 7 | File, reject short input, list, filter, status changes, illegal move, detail |
| 4. Calculator & Advisory | 7 | Worked example, forged results discarded, out-of-range input, history, rule catalogue, evaluation, incomplete answers |
| 5. Logout | 2 | Logout, and proof the session is gone |

> Run it once before the demo and screenshot the green test panel.

---

## 4. Manual test cases

Run in Chrome. Use DevTools device mode at **360 px** for the mobile column.

| ID | Screen | Steps | Expected | Result |
| --- | --- | --- | --- | --- |
| TC-M01 | All | Load every page at 360 px | No horizontal scroll anywhere (NFR-U1) | ✅ Pass — verified on all 9 routes after fixing D5 and D6 |
| TC-M02 | All | Collapse the navbar on mobile and open it | Hamburger toggles; all links reachable | ☐ |
| TC-M03 | Navbar | Logged out → logged in → joined a society | Links change: Report and Dashboard appear only for members (FR-G2) | ☐ |
| TC-M04 | Calculator | Submit with adults blank | Inline message on that field; nothing calculated | ☐ |
| TC-M05 | Calculator | Enter the §7.4 household and submit | 678.18 L/day, 169.55 lpcd, Over-use badge, gauge marker past the norm | ✅ Pass |
| TC-M06 | Calculator | Switch bathing mode to Bucket | Shower fields disappear; the result does not double-count | ☐ |
| TC-M07 | Calculator | Enter 200 L received | Under-supply and shortfall warnings both appear | ☐ |
| TC-M08 | Calculator | Logged in, submit twice | "Saved to your history"; history panel lists both runs | ☐ |
| TC-M09 | Calculator | Time from submit to result as a guest | Renders in well under 100 ms — no network round trip (NFR-P2) | ☐ |
| TC-M10 | Advisory | Pick Leakage, answer burst pipe | Red 112 banner, LK-3 steps in order, Call 112 button | ✅ Pass |
| TC-M11 | Advisory | Press "Get my steps" with a question unanswered | Inline message on that question | ☐ |
| TC-M12 | Advisory | Logged-in member resolves any rule | Society's own contacts shown instead of the generic ones | ☐ |
| TC-M13 | Advisory | Press "Report this to my society" | Report form opens with category, severity and rule pre-filled (FR-A8) | ☐ |
| TC-M14 | Report | File a complaint | Redirects to the detail page with the complaint number and who it was routed to | ✅ Pass — AQW-2026-0004 routed to the tank & water-quality contact, not the admin |
| TC-M15 | Dashboard | Click the Active count card | List filters to active only; click again to clear | ☐ |
| TC-M16 | Dashboard | Log in as a resident, then as the admin | Resident sees only their own complaints; admin sees all (FR-S17) | ✅ Pass |
| TC-M17 | Complaint | As admin, move active → in progress → resolved | Timeline grows with author, time and note each step | ✅ Pass — after fixing D4 |
| TC-M18 | All | Tab through Home, Calculator and Login with the keyboard only | Visible focus ring on every control; no keyboard trap (NFR-U3) | ☐ |

> Tick these off during your own run-through and screenshot TC-M05, TC-M10, TC-M14 and
> TC-M17 for the report — those four show all three functionalities working.

---

## 5. Defects found and fixed during testing

Kept deliberately — it shows the tests were doing real work rather than confirming what we
already believed.

| # | Found by | Defect | Fix |
| --- | --- | --- | --- |
| D1 | TC-C01 | The leak term read `CONSTANTS.drippingTaps` while the constant was named `drippingTap`, so it evaluated to `NaN` and poisoned every total, every band and every percentage | Corrected the reference. The test caught it immediately because the expected total came from the requirements doc, not from the code. |
| D2 | TC-C04 | The test called `computeUsage()` directly and so bypassed the bathing-mode rule in `validateInputs()`, making a bucket-only household still pay for a shower | Test corrected to call `calculate()`, the path the form and the API both use. Production code was right. |
| D3 | TC-API-19 | The test expected `in_progress → active` to be refused as an ownership violation (403); the server refuses it earlier, as an illegal state transition (400) | Test corrected. The server's order of checks is the right one — an impossible move should be rejected before asking *who* is asking. |
| D4 | TC-M17, manual run-through | After a status change, the newest timeline entry showed the author as "A member". `updateStatus` pushed the entry and returned the document without repopulating `statusHistory.by`, so the freshest entry held a raw ObjectId | Repopulated before returning. A regression assertion was added to TC-API-18 so it cannot come back. |
| D5 | TC-M01 | The calculator overflowed 12 px horizontally at 360 px. `row g-5` applies a −24 px negative margin, wider than the container's 12 px padding at that breakpoint | Changed to `row g-4 g-lg-5` — the tighter gutter matches the container padding exactly on small screens, and the roomier one still applies from `lg` up. Same fix applied to the home hero. |
| D6 | TC-M01 | The dashboard overflowed 2 px at 360 px: the two filter selects sat on one non-wrapping flex row | Added `flex-wrap` so they stack when there is no room. |

All six were found by tests or a scripted run-through, not by reading the code.
