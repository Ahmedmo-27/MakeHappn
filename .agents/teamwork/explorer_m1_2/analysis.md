# Comprehensive Gap Reconciliation, Document Inconsistencies, and Build Order Validation

**Author**: `explorer_m1_2` (Teamwork Explorer / Synthesizer)  
**Date**: November 8, 2026  
**Scope**: Reconciliation between MakeHappn Operating Briefs (`MakeHappn [Dashboard].pdf`, `Makehappn [Dashboard 2].pdf`, `MH [WORKFLOW & OPERATING STRUCTURE].pdf`) and the current codebase (`src/lib/domain.ts`, `src/models/Event.ts`, `src/models/Task.ts`, `src/app/(app)/dashboard/page.tsx`, `src/lib/permissions.ts`, and supporting components/services).

---

## 1. Executive Summary

A comprehensive architectural and domain investigation reveals a fundamental structural divergence between the MakeHappn codebase and the operational reality specified in the agency's operating briefs:

1. **Unit of Work**: The codebase implements a monolithic `Event` entity (referred to interchangeably as an "Experience"), constrained to a single foreign-key `typeId` and calendar dates. In contrast, MakeHappn is a multidisciplinary creative studio where the fundamental unit of work is a **Project** possessing a unique project code, client relationship, commercial scope, and a multi-select combination of **6 core products/services** (Curation, Design, Brand Design, Brand Communication, Production, Turnkey Experience).
2. **Lifecycle & Governance**: The codebase categorizes work into "Live", "Upcoming", and "Wrapped" through automated temporal math comparing today's date against `start` and `end` timestamps. The operating briefs mandate a rigorous **11-stage project pipeline** governed by formal stage gates, client/lead approvals, and distinct lifecycle statuses across Leads, Proposals, Projects, Tasks, Deliverables, and Payments.
3. **Information Density**: The codebase's `Event` schema contains only 6 fields, ignoring client identity, commercial terms, milestones, deliverables, external partners, change requests, and close-out data. Furthermore, the codebase has zero financial tracking, whereas the briefs mandate strict 3-tier cost tracking (Estimated vs Committed vs Actual costs).
4. **Organizational Lanes & Permissions**: The codebase enforces a rigid 3-tier hierarchy (`owner`, `leader`, `member`) where users are locked into a single team silo. The briefs define a collaborative **3-lane operating structure** (`Vision & Design`, `Project & Delivery`, `Communication & Engagement`) operating as a matrix organization with cross-lane project leads, multi-lane contributions, and parallel documentation.
5. **Accountability & Deliverables**: The codebase models tasks as flat Kanban cards with a single assignee and forced status-change comments. The briefs require a dual accountability model (single Accountable Owner + multiple Collaborators), first-class **Deliverable entities** with versioning and client review rounds, and formalized Change Requests.
6. **Platform Surface Area**: The existing application implements only 4 simple routes (`/dashboard`, `/people`, `/teams`, `/event-types`), whereas the operating briefs specify **8 full enterprise modules** (Overview, Sales, Projects, Tasks & Team, Creative & Design, Production & Procurement, Collective/Resources, Finance, and Reports).

---

## 2. Document Precedence Framework

### 2.1 Principle of Operating Truth vs Legacy Implementation Artifacts
The existing Next.js codebase represents an early-stage prototype built around a generic hackathon-style event board. It does not reflect the operational requirements, commercial rigor, or agency workflows of MakeHappn.

**Core Rule**: The operating briefs are the primary source of truth. Wherever the codebase conflicts with the PDF briefs, the codebase is considered deficient or legacy, and must yield. No technical constraint in the current schema or UI may override the business requirements set forth in the briefs.

### 2.2 Precedence Hierarchy
When resolving requirements or resolving potential ambiguities across sources, the following 4-tier hierarchy applies:

| Tier | Source Document | Authority & Scope |
| :--- | :--- | :--- |
| **Tier 1 (Canonical Operational Spec)** | `MakeHappn [Dashboard].pdf` (Dashboard 1) | **Primary authority** for end-to-end workflow, 11-stage pipeline, stage gates, 3-tier financial model, deliverable lifecycle, change requests, and the 8-module architecture. |
| **Tier 2 (Structural & Staffing Truth)** | `MH [WORKFLOW & OPERATING STRUCTURE].pdf` | **Primary authority** for studio organizational design: the 3 functional lanes, role titles, reporting lines, cross-lane matrix dynamics, and workflow handovers. |
| **Tier 3 (Executive & Supporting Context)** | `Makehappn [Dashboard 2].pdf` (Dashboard 2) | **Supporting authority**: High-level synthesis reinforcing multi-product selection and core dashboard questions. Yields to Tier 1 where Tier 1 provides greater operational granularity. |
| **Tier 4 (Implementation Artifact)** | Current Codebase (`src/`) | **Implementation scratchpad**: Subject to complete refactoring and realignment under the operating briefs. Holds zero authority on domain definitions or business logic. |

### 2.3 Operational Conflict Resolution Rules
1. **Granularity Rule**: When Tier 1 specifies 11 stages and Tier 3 summarizes 10 stages, Tier 1 governs the underlying data model and state machine, while Tier 3 and the 4-phase workflow in Tier 2 serve as executive visualization roll-ups.
2. **Role Decoupling Rule**: Named individuals in operating documents (e.g., Sohila, Hamdy, Nadine) represent functional *seats* in the organizational structure. The system must model generic functional roles rather than hardcoding personal identities.
3. **Zero-Assumption Stage Gate Rule**: Stage progression cannot occur automatically via clock time. Progress requires explicit human approvals and verified gate deliverables.
4. **Three-Tier Financial Separation Rule**: Estimated costs, committed costs, and actual costs must never be collapsed or averaged into a single number.

---

## 3. Comprehensive Evaluation Across the 7 Focus Areas

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MAKEHAPPN DOMAIN RECONCILIATION MATRIX                          │
├──────────────────────┬──────────────────────────────┬──────────────────────────────────┤
│ Focus Area           │ Current Codebase Reality     │ Operating Briefs Mandate         │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 1. Unit of Work      │ "Event" / "Experience"       │ "Project" with unique Code &     │
│                      │ Single `typeId` (EventType)  │ Multi-Select Products/Services   │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 2. Lifecycle &       │ Temporal math: Live /        │ 11-Stage Pipeline with Gate      │
│    Stages            │ Upcoming / Wrapped           │ Controls & 6 Entity Status Trees │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 3. Record Fields     │ 6 fields (name, dates, teams)│ Comprehensive Metadata, Clients, │
│                      │ No commercial/financial data │ Invoices & 3-Tier Financial Flow │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 4. Org & Permissions │ Owner / Leader / Member      │ 3 Functional Lanes, Cross-Lane   │
│                      │ Single-team user isolation   │ Project Lead & Matrix Delivery   │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 5. Tasks & Output    │ Flat cards, single assignee, │ Accountable Owner + Collaborators│
│                      │ no deliverables or approvals │ Deliverable Lifecycle & CR Log   │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 6. Platform Modules  │ 4 routes (Rail has 4 links)  │ 8 Fully Integrated Enterprise    │
│                      │ Zero commercial modules      │ Studio Operating Modules         │
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
│ 7. Doc Consistency   │ Incompatible with agency     │ Decoupled seats, 11-stage engine │
│    & Build Order     │ workflow                     │ validated across 7 build phases  │
└──────────────────────┴──────────────────────────────┴──────────────────────────────────┘
```

---

### Gap 1: Unit of Work (Experience vs Project, typeId vs Multi-Select Products)

#### 1. Codebase Observation
- **Entity**: `src/models/Event.ts:3-13, 15-25` defines `IEvent` with:
  ```typescript
  name: { type: String, required: true, trim: true },
  typeId: { type: Schema.Types.ObjectId, ref: "EventType", required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  teamIds: [{ type: Schema.Types.ObjectId, ref: "Team", required: true }],
  notifiedTeamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  ```
- **Taxonomy**: `EventType` (`src/models/EventType.ts`) is a standalone table of names.
- **UI Exposure**: `src/app/(app)/dashboard/page.tsx:65` has a button labeled `"Start an experience"`, referencing `/events/new`. `src/components/rail.tsx:13` calls `/event-types` `"Experience types"`.
- **Project Identifiers**: There is no `projectCode` field anywhere in the schema, controllers, or database.

#### 2. Operating Briefs Specification
- **Primary Definition**: `MakeHappn [Dashboard].pdf` Section 3 explicitly defines the business taxonomy:
  > *"A product is the service or group of services the client is buying. A project is the specific piece of work being delivered for that client. One project can contain one product or a combination of products. The dashboard must therefore allow multiple products to be attached to a single project."*
- **The 6 Products / Services**:
  1. `Curation`: Research & discovery, concept & experience curation, talent & partner sourcing, programming.
  2. `Design`: Creative direction, spatial & environmental design, 2D & 3D design, technical layouts.
  3. `Brand Design`: Brand strategy & positioning, brand identity, visual systems, brand applications.
  4. `Brand Communication`: Brand messaging & storytelling, content strategy, campaign concepts, communication materials.
  5. `Production`: Fabrication & manufacturing, printing & branding, sourcing & procurement, installation & setup.
  6. `Turnkey Experience`: End-to-end experience development, creative direction, design, production, on-ground delivery.
- **Project Code**: Section 12 mandates: *"Project name, unique project code and project type"*.

#### 3. Architectural Gap & Reconciliation
- **Fatal Modeling Flaw**: The codebase conflated the agency's broad service catalogue with a single product ("Experience") and treated all agency work as an event with calendar start/end dates. A client project may simply be a "Brand Design" package (e.g. Logo & Visual Identity) or a "Curation" engagement, involving no physical event days whatsoever.
- **Cardinality Violation**: In the codebase, an Event has exactly one `typeId` (`Event.ts:18`). In reality, projects frequently bundle multiple products (e.g., Brand Design + Production + Turnkey Experience).
- **Identifier Deficit**: The lack of a `projectCode` (e.g. `MH-2026-004`) breaks traceability across sales proposals, invoices, supplier purchase orders, and asset versioning.
- **Reconciliation Requirement**: Refactor `Event` into `Project`. Replace `typeId: ObjectId` with `productIds: ObjectId[]` (multi-select referencing the 6 core products). Implement an auto-generated, human-readable, unique `projectCode`.

---

### Gap 2: Stages and Lifecycle (Calendar Math vs 11-Stage Pipeline & Stage Gates)

#### 1. Codebase Observation
- **Phase Logic**: `src/lib/format.ts:22, 46-56` computes phase entirely via wall-clock math:
  ```typescript
  export type ExperiencePhase = "live" | "upcoming" | "wrapped";
  export function experiencePhase(start: Date | string, end: Date | string, today = utcToday()): ExperiencePhase {
    const startDate = typeof start === "string" ? new Date(start) : start;
    const endDate = typeof end === "string" ? new Date(end) : end;
    if (today.getTime() < startDate.getTime()) return "upcoming";
    if (today.getTime() > endDate.getTime()) return "wrapped";
    return "live";
  }
  ```
- **Dashboard Presentation**: `src/app/(app)/dashboard/page.tsx:14-18, 109-111` buckets events into 3 hardcoded sections:
  - `Live` ("Today sits inside these dates.")
  - `Upcoming` ("These start later.")
  - `Wrapped` ("The end date has passed.")
- **State Machine**: There is no `stage` or `status` property on `Event`. No gates, no checklist, no approval flags.

#### 2. Operating Briefs Specification
- **11-Stage Pipeline**: `MakeHappn [Dashboard].pdf` Section 4 details the end-to-end pipeline:
  1. `01 · Lead / Inquiry`: Lead record created, lead owner assigned.
  2. `02 · Qualification & Discovery`: Discovery notes and usable client brief created.
  3. `03 · Scope, Proposal & Quotation`: Scope, deliverables, commercial quote, margin check.
  4. `04 · Project Confirmation & Handover`: Contract/advance payment received. **Mandatory Gate**: *"Do not treat an unapproved proposal as an active delivery project. Record confirmation before opening delivery tasks."*
  5. `05 · Kick-off & Project Planning`: Delivery plan, workstream owners, milestones, dependencies, risks.
  6. `06 · Creative Development`: Concept presentation & creative direction. **Approval Gate**: Concept approved by client or revision round assigned.
  7. `07 · Design Development`: 2D/3D visual, spatial, brand, technical assets. **Approval Gate**: Designs approved for production/delivery.
  8. `08 · Planning & Pre-Production`: Cost sheet locked, supplier quotes. **Approval Gate**: *"Production should proceed only when the required designs, budget and client approvals are confirmed."*
  9. `09 · Production & Execution`: Fabrication, procurement, quality checks, actual costs logged.
  10. `10 · Delivery / Live Operations`: On-ground operations, client walkthrough, incident log, handover.
  11. `11 · Financial & Project Close`: Scope/cost reconciliation, supplier close-out, client collections. **Gate**: *"Project can be marked Closed when delivery, documentation and financial close-out requirements are satisfied."*
- **6 Discrete Entity Status Sets**: Section 11 defines standard statuses across 6 entity types:
  - `Lead`: `New` → `Contacted` → `Qualified` → `Proposal in progress` → `Won` / `Lost` / `On hold`
  - `Proposal`: `Draft` → `Internal review` → `Sent` → `Under discussion` → `Approved` → `Declined` → `Expired`
  - `Project`: `Not started` → `Planning` → `In progress` → `Waiting for client` → `At risk` → `On hold` → `Delivered` → `Closed`
  - `Task`: `To do` → `In progress` → `Waiting` → `In review` → `Approved` → `Done` → `Blocked`
  - `Deliverable`: `Draft` → `Internal review` → `Sent to client` → `Revision required` → `Approved` → `Final`
  - `Payment`: `Not invoiced` → `Invoiced` → `Partially paid` → `Paid` → `Overdue`

#### 3. Architectural Gap & Reconciliation
- **Temporal Fallacy**: In the codebase, if a project's calendar date passes, the system flags it as "Wrapped", even if fabrication is stalled, client approval was denied, or final invoices are unpaid. Conversely, an active project cannot be tracked before its calendar date.
- **Delivered vs Closed Distinction**: The brief explicitly establishes that `"Delivered"` (work handed over / event concluded) is distinct from `"Closed"` (financial reconciliation, supplier payments, post-mortem complete). The codebase has neither concept.
- **Reconciliation Requirement**: Eliminate `ExperiencePhase` ("live/upcoming/wrapped") as the primary project lifecycle engine. Implement the formal 11-stage pipeline state machine with gate enforcement, along with independent status fields on Projects, Proposals, Deliverables, and Payments.

---

### Gap 3: Project Record Fields (Commercial, Operational, and Financial Tracking)

#### 1. Codebase Observation
- `src/models/Event.ts` contains only: `name`, `typeId`, `start`, `end`, `teamIds`, `notifiedTeamIds`.
- The system contains zero models or fields for:
  - Client details (no client entity, contact person, or lead source).
  - Project management (no assigned Project Lead or Creative Lead).
  - Commercial terms (no quoted value, approved budget, or payment milestones).
  - Cost tracking (no supplier costs, expenses, or margin calculations).
  - Governance (no change requests, risks, or issue logs).
  - Deliverables & Assets (no asset links, file records, or close-out reports).

#### 2. Operating Briefs Specification
- `MakeHappn [Dashboard].pdf` Section 12 ("Core Project Record: Required Fields") mandates that every project record connects:
  - *Project Identity*: Name, unique project code, project type.
  - *Client Context*: Client company, main contact person, lead source, brief, objectives, audience, location, key requirements.
  - *Team Ownership*: Project owner/lead, assigned internal team with designated lane roles.
  - *Scope*: Products selected, detailed scope, inclusions, exclusions, assumptions.
  - *3-Tier Financial Model* (Section 9):
    1. Quoted client value, approved project value, payment terms.
    2. **Estimated costs** (internal effort + external supplier costs + contingency).
    3. **Committed costs** (purchase orders, signed supplier contracts, locked cost sheets).
    4. **Actual costs** (incurred expenses, contractor bills, reconciled costs).
    5. Expected vs actual gross profit and profitability margin.
  - *Schedule*: Start date, key milestones, review dates, delivery date, close-out date.
  - *Linked Operational Artifacts*: Deliverables with review history, linked Collective Makers and Partners, invoices and payment statuses, risk and issue logs, change requests with cost/time impact, close-out report and final files.
- **Non-Negotiable Financial Rule**: Section 9 states:
  > *"The dashboard should clearly distinguish estimated, committed and actual costs. These are different figures and should not be combined into one number."*

#### 3. Architectural Gap & Reconciliation
- **Enterprise Deficit**: The codebase's `Event` model represents less than 10% of the data required to operate a project.
- **Financial Blindness**: The codebase has zero financial tracking, creating total commercial blindness.
- **Reconciliation Requirement**: Expand the project domain entity into a rich relational aggregate root connecting Client, Project Lead, Multi-Products, 3-Tier Cost Sheets, Payment Milestones, Deliverable sets, and Collective engagements.

---

### Gap 4: Org Chart, Lanes, and Permissions (Generic Crews vs 3 Functional Lanes)

#### 1. Codebase Observation
- **Roles**: `src/lib/domain.ts:1-2` defines generic roles:
  ```typescript
  export const ROLES = ["owner", "leader", "member"] as const;
  ```
- **User Team Assignment**: `src/models/User.ts:9-10` restricts a user to exactly one team:
  ```typescript
  role: { type: String, required: true, enum: ["owner", "leader", "member"] },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  ```
- **Permission Silos**: `src/lib/permissions.ts:11-47`:
  - `canViewEvent`: Non-owners can only view an event if their single `teamId` is listed in `event.teamIds`.
  - `canAssignTask`: Only the `owner` or the `leader` of that specific `taskTeamId`.
  - `canChangeTaskStatus`: Members can only update tasks where `task.assigneeId === user.id`.
  - UI lede text (`src/app/(app)/dashboard/page.tsx:56-63`) enforces strict command-and-control: "You set up the studio... Team leaders assign that work to their crew... You cannot move someone else's card."

#### 2. Operating Briefs Specification
- `MH [WORKFLOW & OPERATING STRUCTURE].pdf` specifies the real studio structure:
  - **3 Connected Functional Lanes**:
    1. **Vision & Design** (Navy):
       - Sara Dawoud: Founder & Managing Director (Business · Strategy · Clients · Final decisions)
       - Sama: Creative Lead (Concept · Experience · Storytelling · Client Management)
       - Nadine: Senior Graphic Designer (Branding · 2D · Visual identity · Visual direction)
       - Art Director / Senior 3D Designer [Sohila / New Hire]: (3D · Spatial thinking · Art direction)
       - Hamdy: Spatial / 3D Visualizer (Spatial design · 3D · Renders · Technical development)
    2. **Project & Delivery** (Teal):
       - Sara M.: Project & Delivery Lead (Vision development · Briefing · Timelines · Budgeting)
       - Mai: Design & Production Executive (Production · Fabrication · Suppliers · Site · Procurement)
       - Production Intern: Production Support (Production · Site · Follow-up · open role)
    3. **Communication & Engagement** (Gold):
       - Mariam: Social Media Specialist (Content · Social media · Project communication)
  - **Operating Principles**:
    - *"EVERYONE HAS A LANE · PROJECTS MOVE ACROSS LANES · OWNERSHIP IS CLEAR AT EVERY HANDOVER"*
    - *"ONE PROJECT LEAD · ONE CREATIVE DIRECTION · CLEAR HANDOVERS · NO STEP MOVES FORWARD WITHOUT ALIGNMENT"*
  - **Cross-Lane Matrix Dynamics**:
    - Sara M. is Project & Delivery Lead, but actively bridges concept and delivery by participating in Stage 01 Vision Development alongside Sama.
    - Sara Dawoud contributes to initial Art Direction alongside Nadine.
    - Mariam works in parallel across *every* project stage for documentation and content capture.
    - A designated **Project Lead** (e.g. Sara M. or assigned lead) coordinates across all three lanes.

#### 3. Architectural Gap & Reconciliation
- **Silo Breakdown**: The codebase treats teams as isolated vertical islands with zero horizontal collaboration. In reality, a creative agency is a cross-functional matrix. Locking a user into a single `teamId` makes it impossible for someone like Sara M. to work across both Vision and Delivery, or for Mariam to document across all projects.
- **Role Meaninglessness**: The generic labels `owner`, `leader`, `member` obscure actual operational authority (e.g. Creative Lead sign-off on concepts vs Project Lead sign-off on budgets).
- **Reconciliation Requirement**: Replace the single `teamId` model with lane memberships (`lane: 'vision_design' | 'project_delivery' | 'communication'`) and functional titles. Support cross-lane project staffing (`project.teamMembers: [{ userId, role, lane }]`) and role-based gate approval permissions.

---

### Gap 5: Task Accountability and Deliverables (Single Assignee vs Accountable Owner & Deliverables)

#### 1. Codebase Observation
- `src/models/Task.ts:3-15` models tasks as:
  ```typescript
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  dueDate: { type: Date, default: null },
  status: { type: String, required: true, enum: TASK_STATUSES, default: "backlog" },
  ```
- Flat status list (`src/lib/domain.ts:4-12`): `backlog`, `todo`, `in_progress`, `in_review`, `blocked`, `done`.
- Every status update demands a mandatory text reason stored in `Activity` (`src/app/actions/tasks.ts:61-65`).
- No deliverable entities, file attachments, version histories, review rounds, task dependencies, or change requests exist.

#### 2. Operating Briefs Specification
- **Task Accountability Model**:
  - `MakeHappn [Dashboard].pdf` Section 4 (Stage 05) & Section 10: *"Each task has one accountable owner and a due date"*, but tasks connect to multiple collaborators across lanes.
  - Brief 1 Section 11 Task Statuses: `To do`, `In progress`, `Waiting`, `In review`, `Approved`, `Done`, `Blocked`.
- **First-Class Deliverable Entities**:
  - Deliverables are distinct from tasks! A task produces a deliverable (e.g., 3D Render, Brand Guidelines, Sourcing Cost Sheet).
  - Deliverable Lifecycle (Section 11): `Draft` → `Internal review` → `Sent to client` → `Revision required` → `Approved` → `Final`.
- **Dependencies & Parallel Workstreams**:
  - Section 6 outlines explicit dependencies (e.g., Design Development depends on Approved Creative Direction; Procurement depends on Locked Cost Sheet and Client Approval).
  - Brief mandates system support for dependencies between tasks and milestones.
- **Change Management**:
  - Section 7 rigorously separates:
    - *Feedback*: Comments within agreed scope.
    - *Revision*: Defined round of updates.
    - *Scope Change*: New requirement beyond scope.
    - *Change Request*: Formal documented change recording what changed, why, who approved, and cost/timeline impact.
  - Rule: *"No material scope, cost or timeline change should be treated as approved until the decision and its impact are recorded."*

#### 3. Architectural Gap & Reconciliation
- **Card-Centric vs Deliverable-Centric**: The codebase treats task movement as an end in itself. In creative agency operations, moving a card to "Done" without an approved deliverable is meaningless.
- **Missing Dependency Graph**: Tasks in the codebase cannot block or unblock each other.
- **Reconciliation Requirement**: Maintain tasks with an `accountableOwnerId` and `collaboratorIds[]`. Introduce a dedicated `Deliverable` entity with review round tracking and version history. Add a `ChangeRequest` entity linked to budget and schedule adjustments.

---

### Gap 6: Absent Modules (Overview, Sales, Projects, Collective, Finance, Reports)

#### 1. Codebase Observation
- The navigation rail (`src/components/rail.tsx:9-14`) provides only 4 links:
  - `/dashboard`
  - `/people`
  - `/teams`
  - `/event-types`
- Inside an event (`src/components/event-tabs.tsx:8-13`), there are only 3 sub-views:
  - `Backlog` (`/events/[id]/backlog`)
  - `Board` (`/events/[id]/board`)
  - `Performance` (`/events/[id]/performance`)

#### 2. Operating Briefs Specification
`MakeHappn [Dashboard].pdf` Section 10 explicitly defines the **8 Core Modules** required to run the studio:

| Module | Core Information & Connections Required | Codebase Status |
| :--- | :--- | :--- |
| **1. Overview** | Company-level KPIs, sales pipeline summary, active projects health, upcoming deadlines, overdue alerts, cash/payment alerts, team workload across lanes. | **Absent** (Current `/dashboard` only groups events by temporal math). |
| **2. Sales** | Leads management, contacts, client history, opportunity values, lead owner, follow-up dates, proposal tracking, conversion pipeline. | **100% Absent** (No leads, clients, or proposals). |
| **3. Projects** | Central project registry, client details, selected products, project owner, stage (01-11), status, scope, milestones, repository files, linked financials. | **Partially Present** (As rudimentary `Event` entity with 6 fields). |
| **4. Tasks & Team** | Task board/list, accountable owners, collaborators, priority, deadlines, statuses, dependencies, comments, team workload balance. | **Partially Present** (Basic Kanban board without accountability or dependencies). |
| **5. Creative & Design** | Creative briefs, concepts, design deliverables, versioned files, review rounds, client feedback logs, approval history. | **100% Absent** |
| **6. Production & Procurement** | Supplier quotes, supplier directory, purchase commitments, fabrication tracking, production schedules, quality control checklists. | **100% Absent** |
| **7. Collective / Resources** | Central directory of internal team, external Makers (artists, fabricators), Partners (venues, F&B, tech), capabilities, contacts, fee history. | **100% Absent** |
| **8. Finance** | Quoted values, approved budgets, 3-tier costs (estimated/committed/actual), client invoices, payment tracking, expenses, profitability margins. | **100% Absent** |
| **9. Reports** (Section 10 & 13) | Sales by product/client/period, project margins, estimate vs actual variance, delivery performance, team capacity, pipeline health. | **100% Absent** (Current `/performance` only counts completed tasks). |

#### 3. Architectural Gap & Reconciliation
- The current application represents less than 15% of the total functional footprint specified in the operating briefs. 6 out of 8 required modules do not exist in any form.

---

### Gap 7: Document Inconsistencies & Build Order Validation

#### 1. Inconsistency Analysis & Resolutions

##### Inconsistency A: Personnel / Seat Naming — Sohila vs Art Director / Senior 3D Designer
- **The Evidence**:
  - `MH [WORKFLOW & OPERATING STRUCTURE].pdf` Page 1 (Project Workflow) assigns Stage 02 Design Development to:
    - `"Nadine: Visual identity & 2D design"`
    - `"Sohila: Art direction & spatial/3D design"`
    - `"→ Hamdy: Spatial/3D execution"`
  - `MH [WORKFLOW & OPERATING STRUCTURE].pdf` Page 2 (Org Chart) places the exact same functional position under Vision & Design as:
    - `"Art Director / Senior 3D: ART DIRECTION / SENIOR 3D DESIGNER (3D · Spatial thinking · Art direction) [NEW HIRE]"` with Hamdy reporting directly beneath.
- **Reconciliation & System Architecture**:
  - This contradiction reflects organizational evolution: Sohila was either the acting Art Director during workflow drafting, or the studio transitioned the role into an open recruitment position ("NEW HIRE").
  - **Resolution**: Decouple **functional seats/roles** from **individual identity records**. The system schema must define the role as `Art Director / Senior 3D Designer` residing within the `Vision & Design` lane. Users (whether Sohila, a newly recruited staff member, or an external Collective maker) are assigned to that functional seat. Business logic, permissions, and gate sign-offs must bind to role definitions, never hardcoded person names.

##### Inconsistency B: Stage Count and Hierarchy — 11 Stages (Brief 1) vs 10 Stages (Brief 2) vs 4 Phases (Workflow PDF)
- **The Evidence**:
  - `MakeHappn [Dashboard].pdf` Page 3-4 details **11 discrete stages**:
    `01 Lead/Inquiry` → `02 Qualification & Discovery` → `03 Scope, Proposal & Quotation` → `04 Project Confirmation & Handover` → `05 Kick-off & Project Planning` → `06 Creative Development` → `07 Design Development` → `08 Planning & Pre-Production` → `09 Production & Execution` → `10 Delivery/Live Operations` → `11 Financial & Project Close`.
  - `Makehappn [Dashboard 2].pdf` Page 3 details **10 stages**:
    Combines Stage 04 & 05 into `"04 Project Confirmation"`, renames Stage 02 to `"Discovery & Briefing"`, Stage 10 to `"Delivery / Event Day"`, and Stage 11 to `"Closing & Evaluation"`.
  - `MH [WORKFLOW & OPERATING STRUCTURE].pdf` Page 1 details **4 high-level workflow phases**:
    `01 Client & Creative Brief` → `02 Design Development` → `03 Delivery & Production` → `04 Communication`.
  - `MakeHappn [Dashboard].pdf` Page 1 introduces **4 basic business flows**:
    `1. Find the opportunity` → `2. Shape the work` → `3. Deliver the work` → `4. Close and learn`.
- **Reconciliation & System Architecture**:
  - These documents do not contradict each other; they operate at different levels of organizational abstraction.
  - The **11-stage pipeline from Dashboard 1 is the canonical operational model**. In particular, keeping `04 Project Confirmation & Handover` distinct from `05 Kick-off & Project Planning` is vital for financial and contractual control: Stage 04 verifies contract signature and advance payment, whereas Stage 05 initiates operational resource allocation.
  - **Hierarchical Alignment**:
    ```
    Macro Phase (Executive View)   Operational Stage (Pipeline Engine)
    ───────────────────────────   ──────────────────────────────────────────────────
    Phase 1: Find Opportunity     Stage 01: Lead / Inquiry
                                  Stage 02: Qualification & Discovery
                                  Stage 03: Scope, Proposal & Quotation
    ───────────────────────────   ──────────────────────────────────────────────────
    Phase 2: Shape the Work       Stage 04: Project Confirmation & Handover (Commercial Gate)
                                  Stage 05: Kick-off & Project Planning
                                  Stage 06: Creative Development (Concept Gate)
                                  Stage 07: Design Development (Design Gate)
    ───────────────────────────   ──────────────────────────────────────────────────
    Phase 3: Deliver the Work     Stage 08: Planning & Pre-Production (Budget Lock Gate)
                                  Stage 09: Production & Execution
                                  Stage 10: Delivery / Live Operations
    ───────────────────────────   ──────────────────────────────────────────────────
    Phase 4: Close and Learn      Stage 11: Financial & Project Close (Close-out Gate)
    ```

##### Inconsistency C: Reporting Hierarchy vs Cross-Lane Parallel Engagement
- **The Evidence**:
  - Org Chart (Workflow PDF Page 2) displays Mariam under Communication, yet Page 1 explicitly notes: *"Mariam documents throughout every stage in parallel — Communication is where that work is packaged and shared externally, not the only point she's involved."*
  - Sara M. is the Project & Delivery Lead, but Page 1 notes: *"Sara M. contributes to vision development, She's bridge between concept and delivery."*
  - Sara Dawoud is Founder & MD, but Page 2 notes: *"Sara Dawoud contributes to initial Art direction alongside Nadine."*
- **Reconciliation**:
  - MakeHappn operates as a **matrix organization**. Hierarchical reporting lines handle administration, while projects assemble cross-functional teams that span all three lanes simultaneously. System permissions must support cross-lane staffing on projects rather than restricting users to a single lane.

---

## 4. Recommended Phased Build Order: Validation and Risk Analysis

The proposed build sequence is evaluated against domain dependencies, technical risk, and architectural integrity:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RECOMMENDED PHASED BUILD ROADMAP                                │
│                                                                                        │
│  Phase 0: Architecture & Schema Overhaul (Project, Lanes, Roles, Deliverables, Costs)  │
│                                    │                                                   │
│                                    ▼                                                   │
│  Phase 1: Project Hub & 11-Stage Pipeline Engine (Gates, Statuses, Multi-Products)    │
│                                    │                                                   │
│         ┌──────────────────────────┴──────────────────────────┐                        │
│         ▼                                                     ▼                        │
│  Phase 2: Task Accountability & Deliverables           Phase 3: Sales Pipeline &       │
│           (Owners, Collabs, Revisions, Reviews)                 Commercial Handover    │
│         │                                                     │                        │
│         └──────────────────────────┬──────────────────────────┘                        │
│                                    ▼                                                   │
│  Phase 4: Collective & External Partner Network (Makers, Venues, Suppliers, POs)       │
│                                    │                                                   │
│                                    ▼                                                   │
│  Phase 5: Financial Management & Commercial Controls (3-Tier Costs, Invoices, Margin)  │
│                                    │                                                   │
│                                    ▼                                                   │
│  Phase 6: Executive Overview, Reports & Analytics (Company KPIs, 4 Management Views)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Phase Review

#### Phase 0: Architecture & Data Schema Overhaul
- **Core Scope**:
  - Replace/refactor `Event` schema into `Project` schema (`projectCode`, `name`, `client`, `leadId`, `productIds` multi-select, `scope`, `stage` 01-11, `status`, `health`).
  - Refactor `User` and `Team` models to support the 3 Lanes (`Vision & Design`, `Project & Delivery`, `Communication & Engagement`), formal domain roles, and multi-lane/project assignments.
  - Define schemas for `Deliverable`, `ApprovalRecord`, `ChangeRequest`, and `CollectiveMember`.
  - Implement 3-tier financial schema structure (Estimated, Committed, Actual costs).
- **Sequencing Rationale**: Every subsequent module depends on this foundation. Attempting to build pipeline UI or Kanban features before the project and lane schema is established would result in immediate rework.
- **Dependencies**: None (Root foundation).
- **Risks & Mitigation**:
  - *Risk*: Data migration friction with legacy `Event` documents in MongoDB.
  - *Mitigation*: Provide automated migration scripts to map existing events to default projects with `Turnkey Experience` product type and Stage 10/11.

#### Phase 1: Project Hub & 11-Stage Pipeline Engine
- **Core Scope**:
  - Central Project Record ("One project = one central record connecting everything").
  - 11-Stage State Machine with Stage Gates and approval checks (commercial win at Stage 04, creative sign-off at Stage 06, design lock at Stage 07, budget lock at Stage 08, close-out at Stage 11).
  - Status management (`Not started`, `Planning`, `In progress`, `Waiting for client`, `At risk`, `On hold`, `Delivered`, `Closed`).
  - Multi-product selector (Curation, Design, Brand Design, Brand Communication, Production, Turnkey Experience).
- **Sequencing Rationale**: The project record is the central spine of the entire studio operating system.
- **Dependencies**: Phase 0.
- **Risks & Mitigation**:
  - *Risk*: Rigid stage gates could block fast-moving or irregular projects (e.g., small brand design jobs skipping fabrication).
  - *Mitigation*: Build configurable stage skipping per project type as explicitly permitted in Brief 1 Section 4 (*"a small brand design job may skip event production"*), while logging bypass rationale.

#### Phase 2: Task Accountability & Deliverables System
- **Core Scope**:
  - Dual accountability model: 1 Accountable Owner + multiple Collaborators.
  - First-class Deliverable tracker with versioning, review rounds, client feedback logs, and approval states (`Draft` → `Internal review` → `Sent to client` → `Revision required` → `Approved` → `Final`).
  - Formal Change Request module recording scope/cost/timeline impact.
  - Task dependency graph (blocking/pre-requisite relationships).
- **Sequencing Rationale**: Tasks and deliverables attach to project stages and workstreams established in Phase 1.
- **Dependencies**: Phase 1.
- **Risks & Mitigation**:
  - *Risk*: UI clutter from managing both tasks and deliverables.
  - *Mitigation*: Separate task execution (daily activities) from deliverable review (client-facing artifacts) in distinct sub-views within the project hub.

#### Phase 3: Sales Pipeline & Commercial Handover (Stages 01–04)
- **Core Scope**:
  - Sales & CRM module: Lead tracking (`New` → `Contacted` → `Qualified` → `Proposal in progress` → `Won` / `Lost`), contact directory, opportunity valuation.
  - Proposal generator: Scope definition, multi-product quoting, payment milestones.
  - Formal Handover Gate (Stage 04): Conversion of Won Proposal into an Active Delivery Project, unlocking delivery workstreams.
- **Sequencing Rationale**: Upstream sales feeding into project execution can be developed in parallel or directly after the Project Hub is stable.
- **Dependencies**: Phase 0, Phase 1.
- **Risks & Mitigation**:
  - *Risk*: Unapproved proposals creating premature operational tasks.
  - *Mitigation*: Hard system enforcement blocking delivery task creation until Stage 04 Handover is verified.

#### Phase 4: Collective & External Partner Network
- **Core Scope**:
  - Central Collective Directory: Makers (artists, designers, craftspeople) and Partners (venues, F&B, tech, suppliers).
  - Profile tracking: Capabilities, locations, relationship owners, past project history, agreed fee structures.
  - Linking Collective members and supplier purchase commitments directly to project stages.
- **Sequencing Rationale**: Required before finalizing full pre-production costing and supplier management.
- **Dependencies**: Phase 0, Phase 1.
- **Risks & Mitigation**:
  - *Risk*: Fragmented partner communications and privacy concerns.
  - *Mitigation*: Strict role-based permissions ensuring external contact details and commercial rates are visible only to authorized leads.

#### Phase 5: Financial Management & Commercial Controls
- **Core Scope**:
  - Quoted value vs approved budget tracking.
  - Strict 3-tier cost tracking: Estimated vs Committed vs Actual costs.
  - Invoice lifecycle tracking (`Not invoiced`, `Invoiced`, `Partially paid`, `Paid`, `Overdue`).
  - Gross profit margin calculation and variance tracking.
  - Financial close-out reconciliation (Stage 11 gate).
- **Sequencing Rationale**: Requires operational data from projects (Phase 1), tasks/deliverables (Phase 2), proposals (Phase 3), and supplier commitments (Phase 4).
- **Dependencies**: Phases 1, 2, 3, 4.
- **Risks & Mitigation**:
  - *Risk*: Inaccurate actual cost capture leading to distorted margins.
  - *Mitigation*: Enforce cost reconciliation checklist before a project can achieve Stage 11 "Closed" status.

#### Phase 6: Executive Overview, Reports & Analytics
- **Core Scope**:
  - Real-time Company Overview Dashboard: Pipeline health, active project status distribution, upcoming deadlines, overdue tasks, cash/payment alerts, lane capacity.
  - Comprehensive Reporting Suite: Sales by product/client, gross margins by project, estimate vs actual variance analysis, team workload concentration.
  - 4 Dedicated Management Views: Business View, Project View, Team View, Financial View (Brief 1 Section 13).
- **Sequencing Rationale**: Executive reporting requires live aggregate data from all upstream operational modules.
- **Dependencies**: Phases 1 through 5.
- **Risks & Mitigation**:
  - *Risk*: High aggregation latency over large MongoDB datasets.
  - *Mitigation*: Implement optimized MongoDB aggregation pipelines and indexed query paths.

---

## 5. Architectural Gap Synthesis Table

To provide an immediate technical reference for implementation teams, the following table maps each codebase file to its required transformation:

| File Path | Current Implementation | Flaw / Gap Identified | Required Target Implementation |
| :--- | :--- | :--- | :--- |
| `src/models/Event.ts` | Model `Event` with single `typeId`, dates, and `teamIds`. | Only models events; cannot handle multi-product creative projects; missing all commercial, client, and governance fields. | Replace with `Project.ts`: `projectCode`, `client`, `leadId`, `productIds[]`, `stage` (01-11), `status`, 3-tier financials, health, deliverables. |
| `src/models/EventType.ts` | Simple name table. | Misrepresents studio services as flat event categories. | Replace with `ProductService.ts` defining the 6 studio offerings with sub-service items and deliverables. |
| `src/models/Task.ts` | Flat Kanban card with single `assigneeId` and basic status. | No accountable owner vs collaborators; no deliverables; no dependencies; no approval state. | Add `accountableOwnerId`, `collaboratorIds[]`, `deliverableId`, `dependencies[]`, and status alignment (`waiting`, `approved`). |
| `src/models/User.ts` | Single `teamId` and generic role (`owner`, `leader`, `member`). | Prevents cross-lane matrix participation; hides true agency disciplines. | Add `lane` (`vision_design`, `project_delivery`, `communication`), functional title, and project assignment list. |
| `src/models/Team.ts` | Flat team with single leader. | Represents isolated crews rather than functional lanes and project teams. | Reorient to represent Studio Lanes and dynamic Project Workstreams. |
| `src/lib/domain.ts` | Generic roles (`owner`, `leader`, `member`) and flat task statuses. | Missing agency roles, stage definitions, deliverable statuses, payment statuses. | Define 11 Stages, 6 Status Trees, 3 Lanes, and functional agency seats. |
| `src/lib/permissions.ts` | Siloed permissions based on `teamId` and generic role. | Blocks cross-lane collaboration and project lead coordination. | Implement role- and lane-based permissions with gate sign-off authorities. |
| `src/lib/format.ts` | `experiencePhase` computes `live`, `upcoming`, `wrapped` from clock dates. | Erroneous assumption that lifecycle is purely calendar-based. | Deprecate `experiencePhase` as lifecycle driver; replace with stage pipeline helpers. |
| `src/app/(app)/dashboard/page.tsx` | Buckets events into Live / Upcoming / Wrapped with generic counts. | Missing Overview KPIs, sales pipeline, active project health, payment alerts, lane workloads. | Rebuild as Executive Overview answering the 4 Management Questions (Brief 1 Section 13). |
| `src/components/rail.tsx` | 4 links (Dashboard, People, Teams, Experience types). | 6 out of 8 required enterprise modules are completely absent. | Rebuild navigation to expose the 8 Studio Modules: Overview, Sales, Projects, Tasks, Creative, Production, Collective, Finance. |
| *(New Models Required)* | None exist. | Complete absence of critical agency business entities. | Create `Client.ts`, `Proposal.ts`, `Deliverable.ts`, `CollectiveMember.ts`, `ChangeRequest.ts`, `CostSheet.ts`, `Invoice.ts`. |

---

## 6. Conclusion & Recommendation

The MakeHappn codebase in its current form represents an exploratory prototype that diverges substantially from the operating reality documented in the agency briefs. Attempting to incrementally patch the existing `Event` model will create mounting architectural debt.

**Core Recommendation**:
1. Strictly maintain the code freeze on existing code until the target architecture is ratified.
2. Formally adopt the **Document Precedence Framework**, enshrining `MakeHappn [Dashboard].pdf` and `MH [WORKFLOW & OPERATING STRUCTURE].pdf` as the canonical architectural baseline.
3. Execute the implementation across the **7 Phased Build Milestones**, beginning with the Phase 0 Schema Overhaul to establish the `Project`, `Product`, `Lane`, and `Deliverable` foundation.
