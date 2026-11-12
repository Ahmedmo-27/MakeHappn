# MakeHappn: System vs. PDF Briefs, Gap Report

**Date:** 2026-11-11
**Compared against:**
- **PDF-1:** *MakeHappn [Dashboard].pdf*: "How We Work" (9 pages; the main spec)
- **PDF-2:** *Makehappn [Dashboard 2].pdf*: "Business & Project Framework" (4 pages)
- **PDF-3:** *MH [WORKFLOW & OPERATING STRUCTURE].pdf*: Project Workflow and Org Chart (2 slides)

**Method:** I read every model, service, server action and page in `src/` and checked each requirement in the PDFs against what the code actually does, not just what it names. No code was changed. File references are relative to `src/`.

**Legend:**
- ✅ Done (matches the PDF)
- 🟡 Partial (the data or a label exists, but there is no UI, it isn't enforced, or it's incomplete)
- ❌ Missing
- 🐞 Bug (exists but behaves incorrectly)

---

## 1. Executive summary

**Short answer:** the system matches the PDFs in **structure and vocabulary**, but not yet in **behaviour**.

The developer clearly built from these PDFs. These all match the PDFs:
- the 11 stages
- the 6 products
- the 8 project statuses
- the 6 deliverable statuses
- the 5 payment statuses
- the estimated / committed / actual cost split
- change requests
- the risk log
- the Collective
- the 4 macro phases
- the people from the org chart

Most of the **rules, workflows and inputs** behind them are missing, unenforced or unreachable from the UI. Roughly:

| Area | Coverage |
|---|---|
| Vocabulary / statuses / names | ~85% |
| Data model (fields exist) | ~65% |
| Usable in the UI (you can actually enter/edit it) | ~45% |
| Rules & gates enforced on the server | ~25% |
| Permissions enforced on the server | ~10% (see §3, critical) |

### Top 10 things to fix first
1. **🐞 Security:** almost every project, finance, sales and change action only checks that someone is logged in. Any member can advance stages, approve change requests, issue POs or mark invoices paid. Any member can also open any project by its URL. (§3.1)
2. **❌ Projects cannot be edited after creation.** Scope, dates, values, team members, estimated cost and revision limit have no edit form, and the Scope tab is read-only. Because the team list can't be filled in, members are never added to projects, so non-owners can't see any project they don't lead. (§5.3)
3. **❌ No Proposal / Quotation record** (PDF-1 stage 03 and §11). Leads jump straight to a confirmed project. (§5.1)
4. **🟡 Lead tracking is too thin.** There is no lead source, next action, follow-up date or "Contacted / On hold" status. The lead owner can't be set in the form, and there is no UI to move a lead between stages. (§5.1)
5. **❌ Stage gates aren't enforced.** "Advance stage" auto-approves the gate. Gate-prerequisite tasks, deliverable approvals, the deposit and budget approval are never checked. This goes against PDF-3's rule "No step moves forward without alignment". (§4)
6. **❌ The estimated cost / budget can never be entered**, so "estimate vs actual" and "within budget?" always compare against 0. (§6)
7. **🐞 The dashboard's committed-cost figure drifts** from the real PO balances: bills are subtracted wrongly, and cancelled POs are never reversed. The dashboard also adds together amounts in different currencies. (§6.2)
8. **❌ Configurable workflow:** you can't mark stages as skipped in the UI, and if a stage were skipped the "advance" button would fail. There are no project templates. (§4.3)
9. **❌ Task dependencies, task comments on project tasks, and collaborators** are missing from the UI. (§5.5)
10. **🟡 Status sets don't fully match** PDF-1 §11 (Lead, Task, Proposal), and several statuses that exist are never actually set (deliverable "Sent to client"/"Final", invoice "Partially paid"/"Overdue", change request "Submitted"/"Rejected"). (§7)

---

## 2. Conflicts *between* the PDFs (decide before building)

| # | Topic | PDF-1 | PDF-2 | PDF-3 | Code today | Decision needed |
|---|---|---|---|---|---|---|
| C1 | Number of stages | 11 (separate **05 Kick-off & Planning**) | 10 (no kick-off; "Discovery & **Briefing**", "Delivery / **Event Day**", "Closing & **Evaluation**") | 4 macro phases | 11 stages, using PDF-1 names | Pick PDF-1 (recommended, since it's more detailed) and keep the PDF-2 names as aliases if wanted |
| C2 | What phase 04 is | Basic flow step 4 = "**Close and learn**" (delivery, finance, review) | Stage 10 = Closing & Evaluation | Phase 04 = "**Communication**" (content, social, documentation, run by Mariam *in parallel through every stage*) | Stage 11 "Financial & Project Close" is filed under "04 · Communication" (`lib/domain.ts` MACRO_PHASES) | **This is a mismatch.** PDF-3's Communication is a *parallel workstream*, not the financial close. Recommended: put stage 11 under a "Close" phase and model Communication as a parallel lane or workstream across all stages |
| C3 | Stage 04 confirmation requirements | Contract or written approval, initial payment milestone, internal handover | Client approval, contract **and advance payment** | No step moves forward without alignment | None of these are checked | Decide whether a paid deposit is required before stage 05 |
| C4 | Art Director | — | — | Slide 1: **Sohila** handles art direction & spatial/3D. Slide 2: "Art Director / Senior 3D — **NEW HIRE**" (no name) | The seed data creates "Sohila" with the art-director role | Confirm whether Sohila is the new hire or the role is still open |
| C5 | Kick-off's phase | Kick-off is a stage | — | Phase 02 = Design Development (Nadine, Sohila, Hamdy) | Kick-off is put under "02 · Design Development" | Kick-off is run by the Project Lead (Sara M.), so it arguably belongs at the end of phase 01 |
| C6 | Finance function | "Finance & legal" is a business function | Same | **Not in the org chart** | A `finance_operations` role exists, plus `site_operations`, which isn't in any PDF | Who does finance? Sara D.? Sara M.? |

---

## 3. Critical: permissions & data integrity (not in the PDFs, but they block real use)

### 3.1 🐞 Server actions do not check permissions
PDF-1 §14 says *"each project and task must have a clear owner"*, and PDF-3 says *"ownership is clear at every handover"*. The UI hides some buttons, but the server actions **only call `getCurrentUser()`**, so any logged-in user can do the following by submitting the form directly:

| Action file | Unprotected actions |
|---|---|
| `app/actions/projects.ts` | create project, **advance stage**, **change status/health**, **submit closeout (close a project)** |
| `app/actions/commercial.ts` | create/convert leads, **issue POs**, record supplier bills, **create invoices**, **mark invoices paid** |
| `app/actions/changes.ts` | create and **approve change requests** (approval also changes the contract value, budget and delivery date) |
| `app/actions/deliverables.ts` | create a deliverable, **approve/reject a version**, submit versions; the reviewer can pick *any* role, including "client" or "executive" |
| `app/actions/risks.ts` | create/resolve risks |
| `app/actions/collective.ts` | add Collective members |
| `app/actions/tasks.ts` | `createProjectTaskAction`, `moveProjectTaskStatusAction` (any user can move any task) |

### 3.2 🐞 Permission helpers exist but are never used
`lib/permissions.ts` defines `canViewProject`, `canManageProject`, `canViewFinancials` and `canAssignAcrossLanes`. **None of them are called anywhere.** As a result:
- `projects/[id]/layout.tsx` never checks whether the user may view the project, so **any user can open any project by its URL**.
- The Commercials tab link uses `owner || isLead`, which ignores `isExecutive` and the finance role. The commercials page itself uses `owner || isExecutive || isLead`. Both ignore `finance_operations`, which `canViewFinancials` allows.
- The projects list passes `isExecutive: user.role === "owner"`, which ignores the real `isExecutive` flag.
- **Reports** (revenue, client value, margins) and **Sales** have no role check, so every member can see company revenue.
- The Dashboard loads **all** projects, leads and invoices for every user. Only some tiles are hidden.

### 3.3 🐞 Other integrity issues
- **Auto change-request code collision:** `services/deliverables.ts` names the code `CR-REV-{versionNumber}`. If two deliverables in the same project both exceed their revision limit at the same version number, the unique index `(projectId, code)` throws and the review fails.
- **Hard-coded change-request amounts:** revenue +1500, cost +500 and +3 days, regardless of currency or project size.
- **Lead conversion** finds an existing client **by company name only**. Two different companies with the same name would be merged.
- **Old "Events" module still present:** the `/events/*` and `/event-types` routes, the `Event`/`EventType` models, `services/events.ts`, `actions/events.ts`, `lib/mail.ts`, and the Task fields `eventId`/`assigneeId`/`backlog`. It's not linked from the sidebar, but it's still reachable by URL and makes the code harder to follow. It should be removed once the migration script has been run.

---

## 4. Workflow & stage gates (PDF-1 §4, §6; PDF-2 §4; PDF-3)

### 4.1 Stages
| Requirement | Status | Notes |
|---|---|---|
| 11 stages with numbers, titles, "what happens" and "expected output" | ✅ | `lib/domain.ts` STAGE_LABELS (text copied from PDF-1) |
| 4 macro phases with leads | 🟡 | Exists, but phase leads are **hard-coded strings** ("Sama & Sara M.") instead of being linked to user records, and the phase-04 mapping is wrong (see C2) |
| Every stage shows **status, owner, due date, required inputs, expected output** (PDF-1 §14) | 🟡 | Expected output ✅. Milestones have a `targetDate`, but **there's no UI to set it**. There's no per-stage owner and no "required inputs" list |
| A milestone record per stage with approver, date and notes | ✅ | `Project.milestones` (created automatically, 11 of them) |

### 4.2 Gate controls (the "Control / status" column in PDF-1)
| Stage | PDF control rule | Status | What the code does |
|---|---|---|---|
| 01 | Lead status New → Contacted → Qualified / Not proceeding | 🟡 | Lead stages are inquiry/discovery/proposal/won/lost. There's **no UI to change a lead's stage** (`updateLeadStage` exists in the service with no action or UI) |
| 02 | Qualified lead moves to proposal; unsuitable/inactive leads are marked | 🟡 | "Lost" exists. There's no "inactive" or "on hold" |
| 03 | Proposal: Draft → Internal review → Sent → Under discussion → Won/Lost/On hold | ❌ | There is no proposal entity |
| 04 | **Don't treat an unapproved proposal as an active project; record confirmation before opening delivery tasks** | ❌ | (a) `/projects/new` creates *projects* at stage 01, so unapproved leads become projects. (b) Converting a lead works from **any** lead stage and sets the approved value equal to the estimate. (c) Tasks can be added to a project at any stage |
| 05 | Each task has **one accountable owner and a due date** | 🟡 | The owner is required. The **due date is optional** |
| 06 | Approval gate: concept approved, or feedback captured and another revision round assigned | 🟡 | Deliverable reviews support this, but advancing the stage doesn't require an approved concept deliverable |
| 07 | Designs approved for production; changes after approval affect cost and time | 🟡 | Same as above. Nothing flags a change made to an *already approved* deliverable |
| 08 | **Production proceeds only when designs, budget and client approvals are confirmed** | ❌ | Not checked |
| 09 | Issues logged with owner, impact, decision, resolution; scope/budget changes need approval | ✅ | The risk log has exactly these fields, and change requests need approval (but see §3.1: anyone can approve) |
| 10 | Record completion, incidents, client feedback, remaining actions | 🟡 | There's a "punch list cleared" checkbox. There are no incident, client feedback or outstanding-items fields |
| 11 | Closed only when delivery, documentation **and financial close-out** are satisfied | 🟡 | Closeout needs 4 checkboxes. Unpaid invoices and open POs are **shown as warnings but don't block** closing. Supplier payment status is never tracked |

**🐞 Stage advance auto-approves the gate.** `advanceProjectStage` marks the current milestone `isGateApproved = true` with whatever notes were typed. It doesn't check:
- gate-prerequisite tasks: the field `Task.isGatePrerequisite` is stored but never read
- whether the stage's deliverables are approved
- open critical risks
- whether a deposit or an approved budget exists

It also accepts **any** target stage, so a crafted request can jump stages or go backwards. The UI only offers "next".

### 4.3 Configurable workflow (PDF-1 §4 "should be configurable"; §14 "Templates…")
| Requirement | Status | Notes |
|---|---|---|
| Skip stages (e.g. brand-only jobs skip production) | 🟡🐞 | `bypassedStages` exists, plus the rule that stages 01–05 and 11 can't be skipped. But **no UI sets it**, `createProjectAction` doesn't pass it, and if it were set, the "Advance" button targets `index+1` without skipping, which throws "Stage is marked as bypassed", so **the project would be stuck** |
| Project templates (preset stages/tasks per product) | ❌ | None |
| Project owner can adapt stages/tasks per project | ❌ | Not possible after creation |
| Parallel workstreams (PDF-1 §6 table) | 🟡 | Tasks carry a `stage` and a `taskCategory` (`continuous_support` fits Mariam's parallel work). There's no workstream entity and no "can run alongside / must be ready before" rules |
| Dependencies between tasks **and milestones** | ❌ | `Task.dependsOnTaskIds` exists, but it is always `[]`, has no UI and isn't enforced. Milestones have no dependencies |

---

## 5. Module-by-module (PDF-1 §10)

### 5.1 Sales
| Requirement | Status | Notes |
|---|---|---|
| Leads list / kanban by stage | ✅ | `/sales` |
| Client contact (name, email, phone, company) | ✅ | |
| **Lead source** | ❌ | No field |
| **Lead owner** | 🟡 | `Lead.assignedLeadId` exists, but there's no field in the form |
| **Next action + follow-up date** | ❌ | No fields, and no "overdue follow-ups" alert |
| Expected timing | ❌ | |
| Discovery: objectives, audience, deliverables, budget range, timing, location, **decision-makers**, missing info and assumptions | ❌ | Only free-text `notes` |
| Opportunity value | ✅ | `estimatedValue` |
| **Proposals** with status, scope included/excluded, assumptions, timeline, payment terms, finance margin check | ❌ | No model |
| Conversion status | ✅ | won / lost, plus `convertedProjectId` |
| **Client history** (all projects and leads per client) | ❌ | There's no Clients page. Clients can only be created inline from the new-project form or by converting a lead, and can't be edited |
| Edit or delete a lead | ❌ | |

### 5.2 Overview (Dashboard)
| Requirement | Status |
|---|---|
| Company KPIs: pipeline, contracted, cost, margin | ✅ (but see the cost bugs in §6) |
| Sales pipeline | ✅ |
| Active projects by phase | ✅ |
| Upcoming deadlines | 🟡 Tasks are sorted by due date. There are no milestone or delivery-date deadlines, because milestone dates can't be set |
| Overdue tasks | ✅ |
| Cash / payment alerts | ✅ Overdue invoices are computed on the fly |
| Team workload | 🟡 The roster is shown, but workload isn't weighted |
| "Show exceptions that need attention" (§14) | 🟡 There's an at-risk / overdue radar. It's missing overdue follow-ups, stale stages, waiting-for-client, over-budget projects and pending approvals older than X days |

### 5.3 Projects
| Requirement | Status | Notes |
|---|---|---|
| Central record linking everything (PDF-2 §7) | ✅ | Project model |
| Multiple products per project | ✅ | |
| **Edit project after creation** | ❌ | **No update action at all**, apart from stage, status/health and closeout. The Scope tab is read-only |
| **Assigned internal team** | ❌🐞 | `teamUserIds` exists, but neither the create form nor any edit form fills it, so it's always empty. This means team members never see projects (visibility uses `teamUserIds`) |
| Objectives field | 🐞 | The create action reads `objectives`, but the form has no such input |
| Key requirements, included/excluded scope, project type | ❌ | |
| Main client contact, lead source | ❌ | (The client has contacts, but none is chosen for the project) |
| Payment terms | 🟡 | Only `Client.paymentTermsDays`, not per project |
| Files, photographs, final documentation | 🟡 | Only URL text fields (`assetUrl`, `archivedAssetsUrl`). There's no upload and no file list per project |
| Client feedback, close-out report | 🟡 | `lessonsLearned` text only |
| Decisions log | ❌ | `Activity` requires a `taskId`, so there's no project-level history of stage approvals, status changes, budget edits or decisions (PDF-1 §5: "should not rely on informal messages") |
| Health and status | ✅ | |

### 5.4 Creative & Design (Deliverables)
| Requirement | Status | Notes |
|---|---|---|
| Deliverables per stage with versions | ✅ | |
| Review rounds and approval history | ✅ | Reviews are stored per version |
| Feedback recorded against the deliverable | ✅ | |
| Revision limit leads to an automatic change request | ✅🐞 | Works, with the collision bug and hard-coded values from §3.3 |
| Distinguish **internal** approval from **client** approval | 🐞 | Any "approved" decision, even from `craft_lead`, sets the status to "approved" (labelled "Client Approved") |
| Status flow Draft → Internal review → **Sent to client** → … → **Final** | 🟡 | Created straight into `internal_review`. **"Sent to client" and "Final" are never set** by any code path |
| Briefs and concepts as records | 🟡 | Only as generic deliverables |

### 5.5 Tasks & Team
| Requirement | Status | Notes |
|---|---|---|
| One accountable owner | ✅ | |
| Collaborators | 🟡 | The field exists, but there's no UI to set it |
| Priority, deadline, status | ✅ | The deadline is optional |
| **Dependencies** | ❌ | See §4.3 |
| **Comments on project tasks** | ❌ | Comments and task detail pages exist only for the old *event* tasks (`/events/[id]/tasks/[taskId]`). There's no project task detail page |
| Edit / reassign project task | ❌ | Only creating a task and moving its status |
| Workload per person / lane | ✅ | Reports, "3-Lane Delivery Workload" |
| "Who is blocked or waiting for input?" | 🟡 | Blocked ✅. There's no "Waiting" status |

### 5.6 Production & Procurement
| Requirement | Status |
|---|---|
| Supplier quotes and **comparison of options** | ❌ |
| Selected suppliers | 🟡 Implied by POs |
| Purchase commitments (POs) | ✅ |
| Cost sheet (line items) / "locked" cost sheet | ❌ |
| Production schedule / procurement plan | ❌ (only tasks) |
| Delivery status of items | ❌ |
| Quality checks / checklist | ❌ |
| Cancel or edit a PO | ❌ |

### 5.7 Collective / Resources (PDF-1 §8)
| Requirement | Status | Notes |
|---|---|---|
| Makers vs. Partners grouping | 🟡 | 5 types: maker, partner, contractor, supplier, venue. These map to the two groups, but the UI doesn't group them that way |
| Contact details | 🟡 | The form lacks **phone** |
| Category, specialism, location | ✅ | |
| Relationship owner | 🟡 | In the model, not in the form |
| Relationship status | 🟡 | In the model (active / vetted / on_hold), not in the form |
| Rating | 🟡 | In the model, not in the form |
| **Past projects** | ❌ | Not shown or computed |
| **Link to a project with role and agreed fee per engagement** | 🟡 | Only through a PO (scope + amount). There's no engagement record with a *role*, so a maker without a PO can't be linked |
| Internal team in Resources | ❌ | Internal people live separately under People |
| Edit a Collective member | ❌ | |

### 5.8 Finance: see §6.

### 5.9 Reports
| Requirement | Status | Notes |
|---|---|---|
| Sales by product | ✅ | |
| Sales by client | ✅ | Client lifetime value |
| Sales **by period** (month / quarter / year) | ❌ | |
| Project margin | ✅ | |
| Estimate vs. actual | 🐞 | Exists (`varianceProjects`), but the estimate is always 0 (§6) |
| **Delivery performance** (on time vs. late) | ❌ | |
| Team capacity | ✅ | Per lane |
| Pipeline health / conversion | ✅ | Funnel |

---

## 6. Financial flow (PDF-1 §9, §12; PDF-2 §5)

### 6.1 Coverage by moment
| Moment | PDF requires | Status |
|---|---|---|
| **Proposal** | Quoted value | ✅ |
| | Estimated internal effort (hours / people) | ❌ |
| | Estimated external costs | ❌ (`estimatedTotalCost` has **no input anywhere**; only change requests add to it) |
| | Contingency | ❌ |
| | Expected gross profit | ❌ (can't be calculated without an estimate) |
| | Payment terms | 🟡 (per client only) |
| **Confirmation** | Approved project value | ✅ |
| | Agreed payment milestones (schedule) | 🟡 Invoices can be added one by one, but they're created as "invoiced" right away, so there's no *planned* schedule (`not_invoiced` is never used) |
| | **Deposit status** | ❌ |
| | Approved budget | ❌ |
| **Delivery** | Committed supplier costs / POs | ✅ |
| | Actual expenses | 🟡 Only supplier bills against POs. There's **no general expense** record (taxis, petty cash, freelancers without a PO) |
| | Variations and extra client approvals | ✅ Change requests |
| **Close** | Invoiced revenue, collected, outstanding | ✅ |
| | Final supplier costs / **supplier payments closed** | 🟡 Bills are saved as "approved". "Paid" is never set and there's no action for it |
| | Actual project profit | 🟡 Shown as "projected margin" (contract − actual − open commitments). There's no locked "final actual profit" |
| Estimated / committed / actual kept as **separate numbers** | ✅ | Three distinct fields and figures |

### 6.2 🐞 Financial bugs
1. **Committed cost drifts.** `recordSupplierBill` subtracts `min(billAmount, po.amount)` from the project's `committedTotalCost`. It should be `min(billAmount, remainingUnbilled)`. Example: a PO for 1000, then a bill for 800 (committed −800), then a second bill for 800 (committed −800 again) leaves committed at **−600** for that PO, when it should be 0. The **Commercials tab** recalculates from the POs correctly, but the **Dashboard** reads the drifted stored field, so the two screens disagree.
2. **No cancel or edit for POs, bills or invoices**, so mistakes can't be corrected. Cancelled POs (the status exists) wouldn't reduce committed cost.
3. **Bills can exceed the PO amount** with no warning.
4. **Mixed currencies are added together** on the Dashboard and in Reports (USD, AED, SAR and EGP summed as if they were one currency). There's no FX rate or base currency.
5. **Partially paid:** there's no "amount paid" field, so partial payments can't be recorded. "Overdue" is computed on screen only and never stored or filterable.
6. **Dashboard "Invoiced" total** adds up *all* invoices, whatever their status. This would be wrong once `not_invoiced` schedule rows are used.

---

## 7. Status logic (PDF-1 §11)

| Record | PDF statuses | Code statuses | Gap |
|---|---|---|---|
| **Lead** | New · Contacted · Qualified · Proposal in progress · Won · Lost · On hold | inquiry · discovery · proposal · won · lost | ❌ missing **Contacted**, **On hold**. The rest map roughly (New≈inquiry, Qualified≈discovery). No UI to change the status |
| **Proposal** | Draft · Internal review · Sent · Under discussion · Approved · Declined · Expired | — | ❌ the entity doesn't exist |
| **Project** | Not started · Planning · In progress · Waiting for client · At risk · On hold · Delivered · Closed | identical | ✅. Note that "At risk" is both a status *and* a separate `health` value, which can contradict each other. Pick one |
| **Task** | To do · In progress · **Waiting** · In review · **Approved** · Done · Blocked | backlog · todo · in_progress · in_review · blocked · done | ❌ missing **Waiting** and **Approved**. "Backlog" is left over from the old system |
| **Deliverable** | Draft · Internal review · Sent to client · Revision required · Approved · Final | identical enum | 🟡 Draft, Sent to client and Final are never set |
| **Payment** | Not invoiced · Invoiced · Partially paid · Paid · Overdue | identical enum | 🟡 Only Invoiced → Paid is actually used |
| **Change request** | (PDF-1 §7: record what, why, who approved, impact) | draft · submitted · client_approved · client_rejected | 🟡 There's only an approve action. **No submit or reject**, and no client-side approver name or evidence |
| Definitions: "Delivered" ≠ "Closed" | | | ✅ Implemented (`isDelivered` vs. closeout) |

---

## 8. Core project record checklist (PDF-1 §12 + PDF-2 §5)

| Field | In the model | In the UI (enter/edit) |
|---|---|---|
| Project name | ✅ | create only |
| Unique project code | ✅ auto `MH-YYYY-…` | ✅ |
| **Project type** | ❌ | ❌ |
| Client | ✅ | create only |
| **Main contact** | ❌ (per project) | ❌ |
| **Lead source** | ❌ | ❌ |
| Project owner | ✅ | create only |
| **Assigned internal team** | ✅ | ❌ |
| Products | ✅ | create only |
| **Detailed scope** (in/out) | ❌ | ❌ |
| Brief / objectives / audience / location | ✅ | create only (objectives missing from the form) |
| **Key requirements** | ❌ | ❌ |
| Quoted value / approved value | ✅ | create only |
| **Payment terms** (project) | ❌ | ❌ |
| Estimated cost | ✅ | ❌ |
| Committed / actual cost | ✅ | ✅ via POs / bills |
| Expected profitability | ❌ | ❌ |
| Actual profitability | 🟡 calculated | ✅ shown |
| Start date / delivery date | ✅ | create only |
| **Key milestones (dates)** | ✅ `targetDate` | ❌ |
| Stage / status / health | ✅ | ✅ |
| Tasks, owners, deadlines | ✅ | ✅ |
| **Task dependencies** | ✅ | ❌ |
| Deliverables, versions, reviews, approvals | ✅ | ✅ |
| Linked Collective makers / partners / suppliers | 🟡 via POs | 🟡 |
| Invoices, payments, outstanding | ✅ | ✅ |
| **Expenses** | ❌ | ❌ |
| Risks / issues | ✅ | ✅ |
| Change requests | ✅ | ✅ |
| **Decisions** | ❌ | ❌ |
| **Final files / photographs** | 🟡 one URL | 🟡 |
| **Client feedback** | ❌ | ❌ |
| Close-out report | 🟡 checklist + lessons learned | ✅ |

---

## 9. Org structure (PDF-3)

| Requirement | Status | Notes |
|---|---|---|
| All 9 people with their titles | ✅ | Seeded in `scripts/seed.ts` |
| 3 lanes: Vision & Design, Project & Delivery, Communication | 🐞 | `STUDIO_LANES` has **4** entries: `communication` and `communication_engagement` both have the label "Communication" |
| Each person's lane | ✅ | `laneIds` |
| **Reporting lines** (Mariam → Nadine, Hamdy → Art Director, Mai → Sara M., Intern → Mai, all → Sara D.) | ❌ | No manager / `reportsTo` field |
| Dotted-line collaboration (Sara D. ↔ Nadine on art direction; Sama ↔ Art Director ↔ Sara M.) | ❌ | |
| Open roles / new hire shown as **vacant positions** | 🟡 | "Production Intern" is seeded as a real login account. A vacant position should be a role with no person in it |
| Mariam works **in parallel across every stage** | 🟡 | Supported through `continuous_support` tasks, but nothing automatically creates a documentation task for each stage |
| "One project lead · one creative direction" | 🟡 | There's one project lead. There's no "creative lead" field on the project |
| Functional roles | 🟡 | `site_operations` and `finance_operations` aren't in the org chart (see C6) |
| Phase leads displayed | 🟡 | Hard-coded strings in `domain.ts`. They'll go stale when staff change |

---

## 10. Management views (PDF-1 §13, PDF-2 §7)

| Question | Answerable today? |
|---|---|
| How much is in the pipeline? | ✅ |
| What has been won? | ✅ |
| What revenue is expected? | 🟡 (no probability weighting; mixed currencies) |
| Which products / clients generate business? | ✅ |
| What stage is each project in? | ✅ |
| What is due next? | 🟡 (no milestone dates) |
| Which projects are delayed? | ❌ (no planned-vs-actual dates per stage) |
| Which are waiting for approval? | 🟡 (pending deliverables only; no proposal or change-request ageing) |
| Which are at risk? | ✅ |
| Within budget? | ❌ (no budget is entered) |
| Who owns each project / task? | ✅ |
| What is overdue? | ✅ tasks / 🟡 invoices / ❌ follow-ups |
| Where is workload concentrated? | ✅ |
| Who is blocked / waiting for input? | 🟡 (no "Waiting" status) |
| Quoted → approved → committed → spent → invoiced → collected | 🟡 (all present except a usable "approved budget"; the committed total drifts) |
| Expected vs. actual profit | ❌ (no expected profit) |

---

## 11. What is already done well ✅
- One project record connects the client, products, lead, tasks, deliverables, risks, change requests, POs, bills and invoices (PDF-2 §7).
- Multiple products per project (PDF-1 §3, PDF-2 §3).
- The full 11-stage model with PDF-1's descriptions, plus milestone records for each stage.
- Stages 01–05 and 11 can't be skipped (database rule).
- "Delivered" is kept separate from "Closed", and closing uses a closeout checklist.
- Change requests with revenue, cost and time impact, which update the project when approved.
- The revision limit automatically creates a change request.
- The risk / issue log has owner, impact, decision and resolution, exactly as stage 09 asks.
- The Commercials tab correctly separates estimated, committed and actual costs.
- Tasks have one accountable owner.
- Lead → client → project conversion.
- Dashboard exception radar, the Reports page, and lane workload.
- Test scripts for the business rules (`scripts/test-*-invariants.ts`).

---

## 12. Recommended implementation plan

### Phase 0: Safety (do first)
1. Add authorization checks to **every** server action, using `canManageProject`, `canViewFinancials` and similar. Owners/executives can do anything. The project lead manages their own projects. Finance handles invoices, bills and POs. Members can only move their own tasks.
2. Call `canViewProject` in `projects/[id]/layout.tsx`. Gate Reports, Sales and Dashboard financial figures by role.
3. Make the "can view commercials" rule the same everywhere (include `isExecutive` and `finance_operations`).
4. Fix the committed-cost calculation, or stop storing it and always derive it from POs.
5. Fix the auto change-request code (use the next sequence number) and make the default fees configurable per project.

### Phase 1: Make existing data editable
6. Add an **Edit Project** form: scope, objectives, key requirements, in/out scope, dates, values, payment terms, **estimated cost / budget / contingency**, revision rounds, project type, main contact, **team members**, **skipped stages**.
7. Add a milestone date editor (target date per stage).
8. Add edit forms for leads, clients, Collective members (with all their model fields) and tasks (reassign, collaborators, dependencies, due date).
9. Add a **Clients** page with client history.
10. Add a project task detail page with comments and activity.

### Phase 2: Close the PDF gaps
11. Add a **Proposal** model and screen (versions, statuses, in/out scope, assumptions, payment terms, quotation lines, finance margin check). Allow conversion **only from an approved proposal**. Stop creating projects at stages 01–03, or decide that pre-confirmation projects are "opportunities".
12. Add lead fields: source, owner (in the form), next action, follow-up date, expected timing, discovery fields. Add statuses Contacted and On hold, plus a "move stage" UI and overdue follow-up alerts.
13. Align task statuses with PDF-1 by adding **Waiting** and **Approved** (and decide what happens to Backlog).
14. Deliverables: create as Draft, add a "Send to client" action, separate internal approval from client approval, add a "Mark final" action, and flag edits made after approval.
15. Change requests: add Submit and Reject, record the client approver and evidence, and add an audit trail.
16. Enforce **stage gates**: block advancing while gate-prerequisite tasks are open, required deliverables aren't approved, or the stage-specific conditions aren't met (04 needs confirmation/deposit, 08 needs approved designs and budget, 11 needs invoices paid, POs closed and supplier bills paid). Allow an owner override that is logged.
17. Fix advancing past skipped stages (jump to the next stage that isn't skipped).
18. Add a project **activity / decision log** (stage approvals, status, budget, scope and team changes).

### Phase 3: Finance & production depth
19. Proposal-stage estimate: internal effort, external costs, contingency, expected gross profit. Show **expected vs. actual profit**.
20. Payment schedule (planned `not_invoiced` milestones), deposit flag, partial payments (amount paid), stored overdue status.
21. General **expenses** (outside POs), supplier bill payment status, PO cancel/edit.
22. Supplier **quotes and comparison**, a cost sheet with line items and a "locked" state, a quality checklist, and delivery status per item.
23. Collective **engagements**: link a member to a project with role, agreed fee and status. Show past projects on each member.
24. Currency handling: a base currency plus an FX rate per project, or report per currency.

### Phase 4: Structure, templates & reporting
25. Decide C1–C6. Fix the lanes (3, not 4) and the phase-04 mapping. Add `reportsTo` / dotted lines and vacant positions. Drive phase leads from data instead of hard-coded strings.
26. **Project templates** per product (default skipped stages, deliverables and tasks), editable per project.
27. Workstreams with "must be ready before" dependencies (PDF-1 §6), plus automatic parallel documentation tasks for Communication.
28. Reports: sales by period, delivery performance (on time vs. late), estimate vs. actual with real estimates.
29. File uploads (or a proper link list) for deliverables, final files and photographs.
30. Remove the old Events module once the migration has been run.

---

*No code was modified while preparing this report.*
