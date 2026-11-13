# MakeHappn — UI / Flow / Roles checklist

**Audited:** 2026-11-13  
**Scope:** FLOW + UI + ROLES only (product docs vs implemented screens/navigation/role UX).  
**Out of scope:** backend APIs, databases, server enforcement, infra, deploy, CI/CD, env.

**Sources read:**
- `MH [WORKFLOW & OPERATING STRUCTURE].pdf` (2 pages)
- `MakeHappn [Dashboard].pdf` (9 pages) — primary dashboard brief
- `Makehappn [Dashboard 2].pdf` (4 pages)
- `MakeHappn_Brand Identity 2025_Presentation.pdf` (palette/type)
- `PDF-GAP-REPORT.md` / `.pdf` (prior; re-verified, not trusted blindly)
- `README.md`, `design-system/makehappen/MASTER.md`
- Prior notes under `.agents/teamwork/` (context only)

**Code inspected:** `src/app/**`, `src/components/**`, `src/lib/domain.ts`, `src/lib/permissions.ts`, `src/lib/session.ts`, `src/lib/test-roster.ts`, `src/app/globals.css`, models used by UI labels/statuses.

---

## Verdict

**The studio OS shell is largely built (modules, stage tracker, brand look), but critical operating rules—stage gates, proposal confirmation, and consistent role-scoped UI—are still incomplete.**

| Category | Score | % |
|---|---:|---:|
| **Overall (Flow + UI + Roles)** | **50.5 / 80** | **63%** |
| Roles | 12.5 / 20 | **63%** |
| Flows / workflows | 16.5 / 32 | **52%** |
| UI / screens (+ brand) | 21.5 / 28 | **77%** |

---

## Scoring method

- **Done** = 1 — requirement is reachable and usable in the UI as specified  
- **Partial** = 0.5 — screen/data/label exists but incomplete, inconsistent, or not fully usable  
- **Missing** = 0 — not present in the product UI  
- Category % = (sum of item scores ÷ item count) × 100, rounded to nearest integer  
- Overall % uses the combined item pool (80 items), not an average of category %s  

Backend-only gaps (e.g. server action auth holes) are **not** scored unless they also show up as missing/wrong UI gating.

---

## 1. Roles

| ID | Requirement (from docs) | Status | Evidence | Note |
|---|---|---|---|---|
| R01 | Org chart people with PDF-3 titles available | Done | `src/lib/test-roster.ts`, `/people` | Sara D., Sama, Sara M., Nadine, Sohila, Hamdy, Mai, Mariam, Intern (+ Finance Desk) |
| R02 | Three lanes: Vision & Design, Project & Delivery, Communication | Partial | `TEST_LANES` (3) vs `STUDIO_LANES` (4) in `domain.ts`; `/teams` | Duplicate `communication` / `communication_engagement` both labelled “Communication” |
| R03 | Reporting lines visible/editable | Done | `/people`, `PersonForm` `reportsToId` | Matches PDF-3 “reports to” need in UI |
| R04 | Functional roles assignable as first-class UI | Partial | `PersonForm` free-text `title`; roster has `functionalRoles` | No multi-select of `FUNCTIONAL_ROLES` enum in People form |
| R05 | Access roles Owner / Leader / Member | Done | `domain.ts` `ROLES`, People form, rail user meta | |
| R06 | People & Lanes admin owner-only in nav | Done | `rail.tsx` `ownerOnly`; `requireOwner()` | |
| R07 | Finance company page gated | Done | `/finance` `canSee` | Owner / executive / `finance_operations` |
| R08 | Dashboard Finance perspective exec-gated | Done | `/dashboard` `isExec` | Margin KPI + Finance tab hidden for members |
| R09 | Commercials access consistent (lead, exec, finance) | Partial | `project-tabs` / layout vs `/commercials` | Layout tab: owner \|\| lead only; page: owner \|\| exec \|\| lead; finance role excluded |
| R10 | Project pages gated by membership (`canViewProject`) | Missing | `permissions.ts` defines helper; **never called**; `projects/[id]/layout.tsx` | Any logged-in user can open any project URL |
| R11 | Stage advance / status / closeout UI limited to lead or owner | Done | `projects/[id]/page.tsx` `isLeadOrOwner` | Hint shown to others |
| R12 | Reports gated by role | Missing | `/reports` | Loads analytics for any logged-in user |
| R13 | Sales pipeline scoped or gated by role | Missing | `/sales`, `rail.tsx` | Full pipeline visible to all members |
| R14 | One project lead per project | Done | create/edit `projectLeadId`; layout header | |
| R15 | One creative direction / creative lead on project | Missing | Project model/forms | PDF-3: “ONE PROJECT LEAD · ONE CREATIVE DIRECTION” |
| R16 | Vacant open roles (Art Director NEW HIRE, Intern OPEN) | Partial | Roster seeds Sohila + Intern as logins | Open roles modelled as people, not vacant seats |
| R17 | Phase leads driven by live people data | Partial | `MACRO_PHASES.leads` hard-coded strings | Will go stale when staff change |
| R18 | `isExecutive` honored in project list visibility | Partial | `/projects` passes `isExecutive: user.role === "owner"` | Non-owner executives treated as non-exec for list filter |
| R19 | People / Teams pages require owner/exec | Done | `requireOwner()` | |
| R20 | Functional identity surfaced in chrome (not only access role) | Partial | Rail shows `roleLabel(user.role)` only | Title/functional role not in rail |

**Roles subtotal: 12.5 / 20 → 63%** (9 Done + 7 Partial + 4 Missing)

---

## 2. Flows / workflows

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| F01 | Basic flow visible: find → shape → deliver → close | Done | Landing + `/dashboard` | |
| F02 | 11 stages with what-happens / expected output | Done | `STAGE_LABELS`; project overview gate card | Aligns with PDF-1 (preferred over PDF-2’s 10 names) |
| F03 | Four macro phases; Communication as parallel workstream | Partial | `MACRO_PHASES` | Phase 04 wraps stage 11 financial close — conflicts with PDF-3 (Communication parallel; not close) |
| F04 | Lead capture: contact, company, products, value | Done | `/sales` create form | |
| F05 | Lead source recorded | Missing | `Lead` model / sales form | PDF-1 stage 01 |
| F06 | Lead owner assignable in UI | Partial | Auto-set on create (`assignedLeadId`); no form field | |
| F07 | Lead statuses New→Contacted→Qualified… + move-stage UI | Partial | Stages: inquiry/discovery/proposal/won/lost | Missing Contacted / On hold; **no UI to move stage** (`updateLeadStage` unused by UI) |
| F08 | Next action + follow-up date | Done | `/sales` Follow-ups section | |
| F09 | Discovery: objectives, audience, budget, decision-makers… | Partial | Free-text `notes` only | |
| F10 | Proposal record with PDF statuses + margin check | Partial | `/sales` proposals create/list; `PROPOSAL_STATUSES` | No edit/transition UX; no Expired; no finance margin check UI |
| F11 | Convert only from approved proposal / confirmation | Partial | “Confirm & Start Project” on discovery **or** proposal | Does not require approved proposal |
| F12 | Do not treat unapproved opportunity as active delivery project | Partial | Convert path exists; `/projects/new` still creates projects | Bypass of sales confirmation |
| F13 | Kick-off: tasks with one accountable owner | Done | `/projects/[id]/board` | |
| F14 | Each task has a due date | Partial | Due date optional on create | PDF-1 stage 05 control |
| F15 | Collaborators on tasks | Missing | Board create form has no collaborators | Copy mentions collaborators; no control |
| F16 | Dependencies between tasks (and milestones) | Partial | `/tasks` can link deps; board has none; no milestone deps | |
| F17 | Concept/design approval gates via deliverables | Partial | `/deliverables` review approve/revision | Draft / Sent to client / Final paths incomplete in UI |
| F18 | Stage advance blocked until gate inputs met | Missing | Advance form = notes + button | Gate-prerequisite checkbox stored but not checked before advance in UI |
| F19 | Skip/bypass stages configurable in UI | Missing | `bypassedStages` shown in tracker only | No create/edit control |
| F20 | Project templates per product | Missing | — | PDF-1 §14 |
| F21 | Parallel Communication / continuous support | Partial | Task category `continuous_support` | No auto documentation workstream per stage |
| F22 | Change requests: what/why/who/impact + history | Partial | `/changes` create + approve | Approve only; reject/submit path thin |
| F23 | Risks: owner, impact, decision, resolution | Done | `/risks` | Matches stage 09 |
| F24 | Production progress / installation / handover | Partial | Overview production % form | Not a full schedule/procurement plan |
| F25 | Supplier quote comparison + quality checklist | Missing | No dedicated UI | PDF stage 08 outputs |
| F26 | Delivery closeout checklist | Done | Overview closeout form | |
| F27 | Close only when financial close-out satisfied | Partial | Unpaid invoices / open POs warned | Do not hard-block close in UI |
| F28 | Key decisions/approvals recorded on project | Partial | Dashboard decisions + deliverable reviews | No full project decision/activity log UI |
| F29 | Estimated vs committed vs actual distinct & enterable | Partial | Commercials show committed/actual; estimate not on project form | Estimate remains ~0 in practice from UI |
| F30 | Configurable workflow per project (adapt stages/tasks) | Missing | No post-create stage config | |
| F31 | Multiple products per project | Done | `ProjectFields` checkboxes | PDF-2 dashboard requirement |
| F32 | Collective linked to project with role + fee | Partial | Via POs on commercials | No engagement role field; makers without PO hard to attach |

**Flows subtotal: 16.5 / 32 → 52%**

---

## 3. UI / screens (+ brand consistency)

| ID | Requirement | Status | Evidence | Note |
|---|---|---|---|---|
| U01 | Login | Done | `/login` | |
| U02 | Public / marketing landing | Done | `/` + `landing.tsx` | Stages/lanes storytelling |
| U03 | Overview Command Center: KPIs, pipeline, exceptions | Done | `/dashboard` | At-risk, overdue tasks, pending deliverables, overdue invoices |
| U04 | Management perspectives: Business / Project / Team / Finance | Done | Dashboard `view=` tabs | Maps to PDF-1 §13 |
| U05 | Sales module (leads, proposals, conversion) | Done | `/sales` | Depth gaps scored under Flows |
| U06 | Clients history | Done | `/clients` | Read-only accounts + projects/leads |
| U07 | Projects list | Done | `/projects` | Stage/status/product filters |
| U08 | Project workspace: stage tracker + tabs | Done | `projects/[id]/layout.tsx`, `ProjectTabs` | Overview, Scope, Board, Deliverables, Changes, Risks, Commercials |
| U09 | Create/edit covers PDF §12 core fields | Partial | `ProjectFields`, `/projects/[id]/edit` | Missing type, main contact, lead source, in/out scope, estimated cost, payment terms, milestone dates, key requirements |
| U10 | Scope & Brief tab | Done | `/projects/[id]/scope` | Read-only; edit via Edit project |
| U11 | Tasks board with PDF task statuses | Partial | Board: backlog omitted; statuses lack Waiting / Approved | |
| U12 | Creative deliverables: versions, reviews, full status path | Partial | `/deliverables` | Strong review UI; Draft→Sent→Final incomplete |
| U13 | Changes screen | Partial | `/changes` | Approve-centric |
| U14 | Risks & Issues screen | Done | `/risks` | |
| U15 | Commercials: estimate / commit / actual, POs, invoices | Partial | `/commercials` | PO/bill/invoice UX present; estimate entry weak |
| U16 | Client invoice sheet | Done | `/projects/[id]/invoices/[invoiceId]` | Printable white stationery |
| U17 | Collective / Resources complete | Partial | `/collective` | Create + some edit; past projects / grouping Makers vs Partners incomplete |
| U18 | Finance module (budgets, invoices, expenses, profit) | Partial | `/finance` | Snapshot + expenses; depth limited |
| U19 | Reports: by product/client/period, margin, delivery perf, capacity | Partial | `/reports` | Product, clients, variance, lanes, funnel present; period + delivery performance thin/missing |
| U20 | Marketing & Communications company function | Done | `/marketing` | Calendar/content/campaign/etc. |
| U21 | People admin | Done | `/people` | |
| U22 | Lanes & Teams admin | Done | `/teams` | |
| U23 | Brand 2025: black / white / nude + General Sans | Done | `globals.css`, `layout.tsx` fonts | Matches brand PDF palette `#000` `#FFF` `#E1DCD8` |
| U24 | `design-system/makehappen/MASTER.md` matches brand | Missing | MASTER.md pink `#EC4899` + Inter/Playfair | Conflicts with shipped UI and brand PDF |
| U25 | Status vocabulary matches PDF-1 §11 across entities | Partial | Lead/Task/Proposal/Payment enums | Several PDF statuses missing or unused in UI |
| U26 | Management questions (§13) answerable in UI | Partial | Dashboard + reports | Delayed stages, within-budget, expected profit incomplete |
| U27 | Legacy Events surface removed from product | Partial | Not in rail; routes `/events/*`, `/event-types` remain | Reachable by URL — confusing second product |
| U28 | Brand wordmark / stickers in product chrome | Done | `Wordmark`, `Sticker` usage | |

**UI subtotal: 21.5 / 28 → 77%**

---

## Top gaps (in-scope, by impact)

1. **Stage gates are ceremonial** — Advance only collects notes; prerequisite tasks, approved deliverables, deposit/budget confirmation are not required in the UI. Breaks PDF-3 “no step moves forward without alignment” and PDF-1 control column.  
2. **Role-scoped visibility is inconsistent** — `canViewProject` unused; Reports & Sales open to all; Commercials tab vs page disagree; project list ignores non-owner executives. Undermines “ownership clear at every handover.”  
3. **Sales → confirmation path is leaky** — No lead stage-move UI; conversion allowed without approved proposal; `/projects/new` bypasses confirmation.  
4. **Task model incomplete in UI** — No collaborators, no Waiting/Approved statuses, dependencies only on `/tasks`, due dates optional.  
5. **Pre-production / estimate depth missing** — No quote comparison, quality checklist, or usable estimated-budget entry; “within budget?” and estimate-vs-actual stay weak.

---

## Module footprint (quick map)

| PDF module | Primary route(s) | Verdict |
|---|---|---|
| Overview | `/dashboard` | Present |
| Sales | `/sales`, `/clients` | Present, incomplete depth |
| Projects | `/projects`, `/projects/[id]/*` | Present, edit/fields incomplete |
| Tasks & Team | `/projects/[id]/board`, `/tasks`, `/people` | Present, status/collaborator gaps |
| Creative & Design | `/projects/[id]/deliverables` | Present, status path partial |
| Production & Procurement | overview production + commercials POs | Partial |
| Collective / Resources | `/collective` | Present, engagement depth partial |
| Finance | `/finance`, commercials, invoices | Present, gated; estimate/close gaps |
| Reports | `/reports` | Present, period/delivery gaps |
| Marketing | `/marketing` | Present |
| Org / lanes | `/people`, `/teams` | Present (owner) |

---

## Doc conflicts noted (not scored as code bugs)

- **Stage count:** PDF-1 = 11 stages; PDF-2 = 10 renamed stages. Code follows PDF-1.  
- **Phase 04:** PDF-3 Communication (parallel) vs code mapping financial close into Communication.  
- **Brand:** Brand PDF + shipped CSS (black/nude) vs `MASTER.md` pink dashboard tokens.

---

*Audit only — no product code changed in this pass.*
