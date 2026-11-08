# Deep Codebase Architectural Exploration & Gap Analysis

**Author**: `explorer_m1_1` (Teamwork Explorer & Codebase Analyst)  
**Date**: 2026-11-08  
**Working Directory**: `d:\Work\MakeHappen\.agents\teamwork\explorer_m1_1\`  
**Target Files Inspected**:
- `src/lib/domain.ts`
- `src/models/Event.ts`
- `src/models/Task.ts`
- `src/models/User.ts`
- `src/models/Team.ts`
- `src/models/EventType.ts`
- `src/models/Activity.ts`
- `src/models/Comment.ts`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/components/rail.tsx`
- `src/components/event-tabs.tsx`
- `src/components/event-form.tsx`
- `src/components/task-forms.tsx`
- `src/components/board.tsx`
- `src/lib/permissions.ts`
- `src/lib/format.ts`
- `src/lib/stats.ts`
- `src/services/events.ts`
- `src/services/tasks.ts`
- `src/services/org.ts`
- `src/services/performance.ts`
- `src/app/actions/events.ts`
- `src/app/actions/tasks.ts`
- `src/app/actions/org.ts`
- `scripts/seed.ts`

---

## Executive Summary

A forensic, read-only exploration of the MakeHappen codebase (`src/`) reveals that the current application was engineered around a simplistic, single-event calendar scheduler and software-style Kanban task runner rather than a multidisciplinary creative agency operating platform.

The codebase exhibits seven fundamental architectural disconnects when evaluated against the three authoritative operating briefs (`MakeHappn [Dashboard].pdf`, `Makehappn [Dashboard 2].pdf`, and `MH [WORKFLOW & OPERATING STRUCTURE].pdf`):

1. **Unit of Work**: The root aggregate is an `Event` tied to a single catalog category (`typeId`), completely lacking multi-product composition, project numbering/codes, client entities, and commercial scopes.
2. **Lifecycle & Stages**: The application dynamically computes project lifecycle states ("Live", "Upcoming", "Wrapped") purely from system wall-clock time compared against start/end timestamps, ignoring the canonical 11-stage workflow, stage gates, and discrete project statuses.
3. **Project Record**: The `Event` schema contains only 7 custom fields, lacking over 30 critical enterprise agency fields including client details, leads, cost tiers (estimated vs committed vs actual), billing milestones, deliverables, risk flags, and post-mortem metrics.
4. **Org Structure & Lanes**: The authorization model enforces a rigid 3-tier hierarchy (`owner`, `leader`, `member`) where non-owners are strictly bound to a single team. This contradicts the studio's 3 functional lanes (*Vision & Design*, *Project & Delivery*, *Communication*), multi-lane leadership bridges, and parallel documentation.
5. **Task Accountability**: Tasks are single-assignee cards with software development Kanban statuses, lacking RACI accountability, collaborators, deliverable approval lifecycles, change requests, or dependency graphs.
6. **Module Inventory**: The application exposes only 4 rail views (Dashboard, People, Teams, Experience Types) and 3 intra-event tabs (Backlog, Board, Performance). All 8 core operating modules (*Overview, Sales, Projects, Creative/Design, Production/Procurement, Collective, Finance, Reports*) are absent.
7. **Hardcoded Bottlenecks**: The system enforces an "Owner-Centric" bottleneck where only the owner can create projects, backlog tasks, and teams; promotes demoting previous leaders automatically; and siloes cross-team communication.

---

## 1. Unit of Work Architecture

### 1.1 Existing Code Implementation
In the codebase, work is modeled around the `Event` and `EventType` Mongoose models:

**`src/models/Event.ts:3-13, 15-25`**:
```typescript
export interface IEvent {
  _id: Types.ObjectId;
  name: string;
  typeId: Types.ObjectId;
  start: Date;
  end: Date;
  teamIds: Types.ObjectId[];
  notifiedTeamIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    typeId: { type: Schema.Types.ObjectId, ref: "EventType", required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team", required: true }],
    notifiedTeamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true },
);
```

**`src/models/EventType.ts:3-15`**:
```typescript
export interface IEventType {
  _id: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**`scripts/seed.ts:9-19`**:
```typescript
const EVENT_TYPES = [
  "Brand experience", "Pop-up", "Installation", "Space",
  "Corporate", "Wedding", "Conference", "Private", "Exhibition",
];
```

### 1.2 Operating Brief Requirements & Gaps
- **Project vs Event**: `MakeHappn [Dashboard].pdf` §1 and §3 explicitly state:
  > *"A product is the service or group of services the client is buying. A project is the specific piece of work being delivered for that client. One project can contain one product or a combination of products. The dashboard must therefore allow multiple products to be attached to a single project."*
- **Single `typeId` vs Multi-Select Products**: In `src/models/Event.ts:18`, `typeId` is a scalar `Schema.Types.ObjectId` referencing `EventType`. The UI (`src/components/event-form.tsx:25-30`) renders a single `<select>` dropdown. In reality, MakeHappn delivers 6 core products (*Curation, Design Development, Brand Design, Brand Communication, Production, Turnkey Experience*). A client project frequently bundles Brand Design + Production + Curation.
- **Absence of Project Identifiers**: There is no project code or reference numbering (e.g. `MH-2026-001`). All lookups rely solely on MongoDB hex ObjectIds.
- **Root Unit Misconception**: The application treats every deliverable as a physical event occurring on specific calendar dates (`start` to `end`). A brand identity, curation, or visual design project has no live physical event dates, yet cannot exist in the current system without start and end dates.

---

## 2. Lifecycle & Stage Progression (Stages vs Calendar)

### 2.1 Existing Code Implementation
The application contains no stage or lifecycle fields in its database schema. Instead, project states are derived dynamically at runtime from client/server clock comparisons:

**`src/app/(app)/dashboard/page.tsx:14-18, 109-111`**:
```typescript
const PHASES: { id: ExperiencePhase; title: string; hint: string }[] = [
  { id: "live", title: "Live", hint: "Today sits inside these dates." },
  { id: "upcoming", title: "Upcoming", hint: "These start later." },
  { id: "wrapped", title: "Wrapped", hint: "The end date has passed." },
];

{PHASES.map((phase) => {
  const group = events.filter((event) => experiencePhase(event.start, event.end) === phase.id);
  if (group.length === 0) return null;
  ...
```

**`src/lib/format.ts:46-56`**:
```typescript
export function experiencePhase(
  start: Date | string,
  end: Date | string,
  today = utcToday(),
): ExperiencePhase {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  if (today.getTime() < startDate.getTime()) return "upcoming";
  if (today.getTime() > endDate.getTime()) return "wrapped";
  return "live";
}
```

### 2.2 Operating Brief Requirements & Gaps
- **Dynamic Date Bucketing Flaw**: If an event's `end` date passes, it is instantly labeled "Wrapped", even if fabrication is incomplete, invoices are unpaid, or closeout has not occurred. If an event start date arrives, it is labeled "Live", even if the concept was never approved by the client!
- **Missing 11-Stage Pipeline**: `MakeHappn [Dashboard].pdf` §4 details the mandatory 11-stage project workflow:
  1. `01 · Lead / Inquiry`
  2. `02 · Qualification & Discovery`
  3. `03 · Scope, Proposal & Quotation`
  4. `04 · Project Confirmation & Handover`
  5. `05 · Kick-off & Project Planning`
  6. `06 · Creative Development`
  7. `07 · Design Development`
  8. `08 · Planning & Pre-Production`
  9. `09 · Production & Execution`
  10. `10 · Delivery / Live Operations`
  11. `11 · Financial & Project Close`
- **Missing Stage Gates**:
  - *Stage 04 Gate*: Delivery tasks cannot be created before contract signing and deposit receipt.
  - *Stage 06 Gate*: Concept must be client-approved before design development begins.
  - *Stage 07 Gate*: Final designs must be approved before procurement/production.
  - *Stage 08 Gate*: Cost sheet lock and budget approval required before fabrication.
  - *Stage 11 Gate*: Project cannot be marked Closed until delivery signoff, documentation archival, and financial reconciliation are completed.
- **Stage vs Project Status Orthogonality**: `MakeHappn [Dashboard].pdf` §11 distinguishes Stage (where the project is in the process) from Project Status (operational health: `Not started`, `Planning`, `In progress`, `Waiting for client`, `At risk`, `On hold`, `Delivered`, `Closed`). In the codebase, neither exists.

---

## 3. Project Record & Entity Modeling

### 3.1 Existing Code Implementation
The `Event` model (`src/models/Event.ts`) is completely bare:
- Custom fields: `name`, `typeId`, `start`, `end`, `teamIds`, `notifiedTeamIds`.
- Edit form (`src/components/event-form.tsx:60-115`): Only allows modifying `name`, `typeId`, `start`, `end`, and adding teams.

### 3.2 Operating Brief Requirements & Field Audit
`MakeHappn [Dashboard].pdf` §12 establishes a comprehensive 16-point specification for the Core Project Record. The table below audits the codebase against this specification:

| Operating Brief Field Group | Required Fields / Capabilities | Codebase Implementation | Status |
|-----------------------------|--------------------------------|-------------------------|--------|
| **1. Identification** | Unique Project Code (`MH-YYYY-XXX`), Project Name | Only `name: string` (`Event.ts:17`) | **CRITICAL GAP** (No Project Code) |
| **2. Client Information** | Client Entity, Contact Name, Email, Phone, Brand | None | **MISSING** (Zero client data in DB) |
| **3. Scope & Products** | Multi-select Products (1–6), Brief summary, Deliverables list, Venue/Location | Single `typeId` (`Event.ts:18`), no scope or venue | **CRITICAL GAP** |
| **4. Internal Leadership** | Project Lead, Creative Direction Lead, Art Director, Production Lead | None (only teams `teamIds: ObjectId[]`) | **MISSING** (No project lead or role assignment) |
| **5. Stages & Statuses** | Current Stage (1–11), Project Status, Stage Gate Approvals | None (only derived date phase) | **MISSING** |
| **6. Milestones & Dates** | Inquiry date, Proposal due date, Kick-off date, Milestones, Event start/end, Closeout date | Only `start: Date` and `end: Date` | **PARTIAL/DEFECTIVE** |
| **7. Financial Tiers** | Tri-partite costs: Estimated Cost, Committed Cost (POs), Actual Cost | None | **MISSING** (Zero financial tracking) |
| **8. Revenue & Margins** | Contract Value, Budget, Gross Margin (%), Fee Breakdown | None | **MISSING** |
| **9. Invoices & Billing** | Payment terms, Invoicing milestones (Deposit, Progress, Final), Invoiced amounts, Paid status | None | **MISSING** |
| **10. Partners & Collective** | External Makers, Collective Partners, Freelancers, Vendor contacts, Purchase Orders | None | **MISSING** |
| **11. Deliverable Management** | Deliverable status, Versions, Creative asset links, Client approval timestamps | None | **MISSING** |
| **12. Change Requests** | Scope change log, Budget/timeline impacts, Client signoff | None | **MISSING** |
| **13. Issues & Risks** | Risk indicator, Issue owner, Impact, Resolution plan | Only `isOverdue` calculation | **MISSING** |
| **14. Close-out Data** | Client feedback/NPS, Event debrief notes, Archive/Portfolio assets, Final margin | None | **MISSING** |

---

## 4. Org Chart, Lanes, and Permissions

### 4.1 Existing Code Implementation
The codebase defines an authoritarian 3-tier hierarchy:

**`src/lib/domain.ts:1-2`**:
```typescript
export const ROLES = ["owner", "leader", "member"] as const;
export type Role = (typeof ROLES)[number];
```

**`src/models/User.ts:9-10, 20-21`**:
```typescript
export interface IUser {
  ...
  role: Role;
  teamId: Types.ObjectId | null;
}
role: { type: String, required: true, enum: ["owner", "leader", "member"] },
teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
```

**`src/models/Team.ts:3-9, 13-14`**:
```typescript
export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  leaderId: Types.ObjectId | null;
}
leaderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
```

**`src/services/org.ts:67-83, 185-202`**:
```typescript
// Enforces that every user (except owner) belongs to exactly 1 team
if (input.role !== "owner" && !nextTeamId) throw new Error("Choose a team");

// Enforces that a team has at most 1 leader; promoting a new leader demotes the old one:
if (team.leaderId && !sameId(team.leaderId, user._id)) {
  await User.updateOne({ _id: team.leaderId }, { $set: { role: "member" } });
}
```

**`src/lib/permissions.ts:11-52`**:
- `canViewEvent`: Non-owners can only view an event if their single `teamId` is in `event.teamIds`.
- `canAssignTask` / `canEditTask`: Only owner or team leader of that specific `taskTeamId`.
- `canChangeTaskStatus`: Member can only change status if `task.assigneeId === user.id`.
- `canCommentOnTask`: Non-owner must belong to the exact `taskTeamId`! A member of Team A on Event X cannot comment on a task belonging to Team B on Event X!
- `canViewPerformance`: Members are completely forbidden from viewing the Performance tab.

### 4.2 Operating Brief Requirements & Gaps
`MH [WORKFLOW & OPERATING STRUCTURE].pdf` defines the studio's true operating reality:
1. **The 3 Connected Lanes**:
   - **Vision & Design (Navy)**: Creative Lead (Sama), Art Director / Senior 3D Designer (Sohila / New Hire), Senior Graphic Designer (Nadine), 3D Visualizer (Hamdy), with Founder Sara Dawoud contributing to initial art direction.
   - **Project & Delivery (Teal)**: Project & Delivery Lead (Sara M.), Design & Production Executive (Mai), Production Intern (Open Role).
   - **Communication (Gold)**: Social Media Specialist (Mariam), reporting to Nadine while documenting across all stages.
   - **Leadership**: Founder & Managing Director (Sara Dawoud) leading business, strategy, clients, and final decisions.
2. **Multi-Lane Membership & Cross-Lane Coordination**:
   - Sara M. is explicitly defined as the *"bridge between concept and delivery"*, participating in Stage 01 brief and Stage 02 feasibility before leading Stage 03 delivery.
   - Mariam works in the Communication lane but documents in parallel across all stages and lanes.
   - Sara Dawoud acts as Managing Director while contributing directly to Art Direction.
   - Under current code, because `teamId` is a single scalar ObjectId (`User.ts:21`), cross-lane membership is physically impossible.
3. **Cross-Lane Project Leads**:
   - The operating structure mandates: *"ONE PROJECT LEAD · ONE CREATIVE DIRECTION · CLEAR HANDOVERS · NO STEP MOVES FORWARD WITHOUT ALIGNMENT"*.
   - A project lead manages tasks across all disciplines. Under current code, a team leader has zero visibility or authority over tasks belonging to any other team.

---

## 5. Task Model & Deliverable Accountability

### 5.1 Existing Code Implementation
Tasks are modeled as basic Kanban work items:

**`src/models/Task.ts:4-15, 17-28`**:
```typescript
export interface ITask {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  teamId: Types.ObjectId;
  assigneeId: Types.ObjectId | null;
  title: string;
  description: string;
  dueDate: Date | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

**`src/lib/domain.ts:4-12`**:
```typescript
export const TASK_STATUSES = [
  "backlog", "todo", "in_progress", "in_review", "blocked", "done",
] as const;
```

**`src/services/tasks.ts:134, 165`**:
```typescript
// Only the studio owner can create tasks!
if (input.actor.role !== "owner") throw new Error("Only the owner can add backlog tasks");

// Assigning a task from backlog automatically forces status to "todo":
const movingOut = task.status === "backlog";
if (movingOut) task.status = "todo";
```

### 5.2 Operating Brief Requirements & Gaps
- **Single Accountable Owner vs Collaborators**:
  - `MakeHappn [Dashboard].pdf` §14 states: *"Each project and task must have a clear owner; shared responsibility should not mean unclear accountability."*
  - Complex creative tasks require one **Accountable Owner** (e.g. Lead 3D Designer) and one or more **Collaborators / Contributors** (e.g. Graphic Designer, Production Executive). The codebase only supports `assigneeId: ObjectId | null`.
- **Deliverables vs Generic Tasks**:
  - Creative agency tasks produce specific deliverables (e.g., Concept Pitch Deck, Spatial 3D Renders, Technical Drawings, Bill of Quantities).
  - Deliverables have their own approval lifecycles (`Draft`, `Internal Review`, `Shared with Client`, `Client Approved`, `Revision Required`) distinct from simple task progress.
- **Approval Workflows & Stage Gates**:
  - The codebase has no concept of approval gates. When a user drags a card to `done`, it is done. In the operating briefs, deliverables require sign-off from the Creative Lead, Project Lead, or Client.
- **Task Dependencies**:
  - No predecessor or successor relationships (`blockedByTaskId`, `dependsOnTaskId`).
- **Absence of Stage Link**:
  - Tasks link only to `eventId` (`Task.ts:19`). A task cannot be associated with Stage 06 (Creative Dev) vs Stage 09 (Production & Execution).

---

## 6. Present vs Absent Modules

### 6.1 Existing Code Route Inventory
The application routes under `src/app/` are restricted to:

```
src/app/
├── (app)/
│   ├── dashboard/page.tsx             # List of open tasks & phase-bucketed events
│   ├── event-types/page.tsx           # Owner-only event type name catalog
│   ├── events/
│   │   ├── new/page.tsx               # Owner-only form to start an event
│   │   └── [id]/
│   │       ├── page.tsx               # Blind redirect to backlog
│   │       ├── layout.tsx             # Event header, edit disclosure, tabs
│   │       ├── backlog/page.tsx       # Unassigned task list & owner creation form
│   │       ├── board/page.tsx         # Drag-and-drop Kanban board (5 columns)
│   │       ├── performance/page.tsx   # Owner/leader task completion percentages
│   │       └── tasks/[taskId]/page.tsx# Single task detail (history & comments)
│   ├── people/page.tsx                # Owner-only user list & create/edit form
│   ├── teams/page.tsx                 # Owner-only team list & leader promotion
│   └── layout.tsx                     # Shell layout with Rail navigation
├── login/page.tsx                     # Credentials authentication
└── page.tsx                           # Redirects to /dashboard
```

The left navigation rail (`src/components/rail.tsx:9-14`) exposes only:
- `/dashboard` (All users)
- `/people` (Owner only)
- `/teams` (Owner only)
- `/event-types` (Owner only)

### 6.2 Operating Brief 8-Module Inventory Comparison
`MakeHappn [Dashboard].pdf` §10 mandates 9 core dashboard modules / rows (consolidated into 8 primary functional areas):

| # | Operating Brief Module | Scope & Functions in Operating Brief | Current Code Status |
|---|------------------------|---------------------------------------|---------------------|
| 1 | **Overview / Executive Dashboard** | Studio health, revenue pipeline, active projects at a glance, critical alerts, team utilization, upcoming deadlines across all projects. | **ABSENT** (`/dashboard` is only an event card list) |
| 2 | **Sales & Pipeline** | Lead intake, Qualification & Discovery, Proposals, Quotations, Conversion rates, Client CRM, Win/Loss tracking. | **COMPLETELY ABSENT** (0 routes, 0 models) |
| 3 | **Projects** | Central project registry, 11-stage pipeline view, filtering by stage/status/lead/product, project workspaces, stage gate controls. | **ABSENT** (No `/events` or `/projects` directory; only `/events/[id]/backlog`) |
| 4 | **Creative & Design** | Creative briefs, concept approvals, moodboards, 2D/3D deliverables, client feedback rounds, revision logs. | **COMPLETELY ABSENT** (0 routes, 0 models) |
| 5 | **Production & Procurement** | Bill of Materials (BOQ), vendor sourcing, Purchase Orders (POs), fabrication tracking, site installment, technical specs. | **COMPLETELY ABSENT** (0 routes, 0 models) |
| 6 | **Collective & Resources** | Directory of external Makers, Collective Partners, Freelancers, ratings, rates, contracts, engagement history. | **COMPLETELY ABSENT** (0 routes, 0 models) |
| 7 | **Finance** | Estimated vs Committed vs Actual costs, Profit margins, Client invoicing milestones, Deposit/Progress/Final payments, Cash flow. | **COMPLETELY ABSENT** (0 routes, 0 models) |
| 8 | **Reports & Analytics** | Post-mortems, margin analysis, turnaround times, team workload metrics, client profitability benchmarks. | **DEFECTIVE/MINIMAL** (`/events/[id]/performance` only counts task done %) |

---

## 7. Hardcoded Assumptions, Anti-Patterns & Technical Debt

1. **The "Owner Bottleneck" Anti-Pattern**:
   - `src/services/tasks.ts:134`: `if (input.actor.role !== "owner") throw new Error("Only the owner can add backlog tasks");`
   - In any agency beyond a sole proprietorship, Project Leads, Account Directors, and Creative Directors create tasks and define work packages. Requiring the studio owner to author every backlog task paralyzes operations.
2. **Destructive Leader Reassignment**:
   - `src/services/org.ts:194-196`: When promoting a team member to leader, the system automatically demotes the existing leader to `member`. It is impossible for a team or department to have co-leads or a lead + deputy lead.
3. **Siloed Team Communication**:
   - `src/lib/permissions.ts:42`: `if (user.role !== "owner") return user.teamId === taskTeamId;`
   - A team member on the Design team cannot comment on a task assigned to the Production team on the same project! This destroys interdisciplinary collaboration.
4. **Mandatory Reason on Board Drag**:
   - `src/components/board.tsx:183-186` & `src/services/tasks.ts:32`: Every single drag-and-drop movement requires a modal popup and mandatory non-empty text input. This introduces extreme UI friction for everyday task progression.
5. **Missing Route Index (`/events`)**:
   - Visiting `/events` results in a 404 because `src/app/(app)/events/` contains only `[id]/` and `new/`.
   - Visiting `/events/[id]` blindly triggers a Next.js server redirect to `/events/[id]/backlog` (`src/app/(app)/events/[id]/page.tsx:14`), preventing any project overview or summary dashboard.
6. **Seed Data Legacy Terminology**:
   - `scripts/seed.ts:8`: `const TEAMS = ["Planning", "Production", "Installment", "Finance"];`
   - These legacy teams do not reflect the operating structure's 3 lanes (*Vision & Design*, *Project & Delivery*, *Communication*).

---

## Summary Comparison Matrix

| Dimension | Current Codebase Implementation | Operating Brief Specification (`MakeHappn [Dashboard].pdf` & `MH [WORKFLOW]`) |
|-----------|----------------------------------|---------------------------------------------------------------------------------|
| **Primary Aggregate Root** | `Event` (`src/models/Event.ts`) | **`Project`** with Project Code (`MH-YYYY-XXX`) |
| **Product / Service Modeling** | Single `typeId` foreign key to `EventType` | **Multi-select Products** (Curation, Design, Brand Design, Brand Comm, Production, Turnkey) |
| **Lifecycle Model** | Wall-clock date comparison (`live`, `upcoming`, `wrapped`) | **11-Stage Workflow** with hard Stage Gates (01 Lead to 11 Financial Close) |
| **Project Statuses** | None (only task statuses) | **Discrete Statuses**: Not started, Planning, In progress, Waiting for client, At risk, On hold, Delivered, Closed |
| **Financial Tracking** | None | **Tri-Partite Cost Sheet**: Estimated vs Committed vs Actual costs, Profit margin, Payment milestones |
| **Org Structure** | `owner`, `leader`, `member` with 1 team per user | **3 Lanes**: Vision & Design, Project & Delivery, Communication; multi-lane membership; cross-lane Project Lead |
| **Task Ownership** | Single `assigneeId` | **1 Accountable Owner** + multiple **Collaborators** |
| **Deliverables & Assets** | Plain text title & description | **Deliverable Entities** with approval lifecycles (Draft, Internal Review, Client Approved) |
| **Application Modules** | 4 Rail links (Dashboard, People, Teams, Event Types) | **8 Core Modules**: Overview, Sales, Projects, Creative, Production, Collective, Finance, Reports |
| **Task Creation Permissions**| Owner only | Project Leads, Creative Leads, and Production Leads |
