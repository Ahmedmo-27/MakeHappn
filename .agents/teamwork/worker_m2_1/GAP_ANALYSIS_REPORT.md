# Master Gap Analysis & Reconciliation Report: MakeHappen Studio Platform

**Document Version**: 1.0.0 (Master Synthesis)  
**Author**: `worker_m2_1` (Teamwork Lead Synthesizer & Architect)  
**Parent Conversation ID**: `34593234-ea43-4bf6-a9d9-84b1e8a9a80c`  
**Working Directory**: `d:\Work\MakeHappen\.agents\teamwork\worker_m2_1\`  
**Date**: November 8, 2026  
**Status**: Authoritative Architectural Baseline  
**Synthesized Inputs**:
- `spec_miner_m1_1`: Analysis & Handoff (`.agents/teamwork/spec_miner_m1_1/`)
- `explorer_m1_1`: Analysis & Handoff (`.agents/teamwork/explorer_m1_1/`)
- `explorer_m1_2`: Analysis & Handoff (`.agents/teamwork/explorer_m1_2/`)
- Authoritative Briefs: `MakeHappn [Dashboard].pdf`, `Makehappn [Dashboard 2].pdf`, `MH [WORKFLOW & OPERATING STRUCTURE].pdf`
- Codebase Files: `src/models/*`, `src/lib/*`, `src/app/*`, `src/services/*`, `src/components/*`, `scripts/*`

---

## 1. Executive Summary & Core Verdict

A rigorous, comparative synthesis of MakeHappen's authoritative operating briefs against the current Next.js codebase reveals an absolute architectural divergence. The existing codebase is not merely incomplete; it is built on a fundamentally incompatible conceptual model:

1. **Root Aggregate Misconception**: The codebase models work as an `Event` (or "Experience"), a single-calendar-date booking referencing a single catalog category (`typeId`). In contrast, MakeHappen is a **multidisciplinary creative studio** whose core aggregate root is a **Project** identified by a unique alphanumeric project code (e.g., `MH-2026-001`), an enterprise client relationship, commercial scope, and a multi-select bundle of **6 distinct studio products/services** (*Curation, Design Development, Brand Design, Brand Communication, Production, Turnkey Experience*). A project may be a pure branding engagement with zero physical event days.
2. **Lifecycle Determinism Failure**: The codebase dynamically calculates project phases (`Live`, `Upcoming`, `Wrapped`) via client/server wall-clock temporal math comparing today's date against start and end timestamps. In the studio briefs, project lifecycle is an **11-stage operational pipeline** governed by human approval gates, deposit receipts, budget locks, and discrete status state machines. Under the current code, stalled work whose calendar date passes is prematurely classified as "Wrapped" despite unpaid invoices or unapproved concepts.
3. **Information Density Deficit**: The current `Event` model contains only 7 fields. It is missing more than 30 essential enterprise attributes, including client contact structures, internal project leadership, deliverables, revision rounds, risk registers, external partner bookings, change orders, and post-mortem archives.
4. **Complete Financial Blindness**: The codebase contains zero financial schema. The operating briefs mandate a strict **Tri-Partite Financial Engine** separating **Estimated Costs**, **Committed Costs (POs)**, and **Actual Costs (Incurred Expenses)**. The briefs explicitly forbid combining or averaging these three cost figures.
5. **Organizational Structure Mismatch**: The codebase enforces a rigid 3-tier hierarchy (`owner`, `leader`, `member`) where non-owners are quarantined to a single team silo. The studio's actual structure is a collaborative **3-lane matrix** (*Vision & Design*, *Project & Delivery*, *Communication & Engagement*) with multi-lane contributors (Sara M. bridging concept and delivery; Sara Dawoud bridging executive direction and art direction; Mariam documenting across all stages in parallel) and cross-lane Project Leads.
6. **Task & Deliverable Conflation**: The codebase implements single-assignee Kanban cards with software engineering statuses (`backlog`, `todo`, `in_progress`, `in_review`, `blocked`, `done`) and forces mandatory text input on every drag-and-drop movement. The briefs require a **Single Accountable Owner** backed by **Collaborators**, linked to first-class **Deliverable entities** with client review cycles (`Draft` → `Internal review` → `Sent to client` → `Revision required` → `Approved` → `Final`) and formal **Change Requests**.
7. **Platform Footprint Absence**: The current web application provides only 4 simple navigation routes. Over 80% of the agency's required operational footprint is unbuilt. All 8 core operating modules (*Overview, Sales, Projects, Creative/Design, Production/Procurement, Collective, Finance, Reports*) are absent or reduced to trivial stubs.

**Core Verdict**: The current codebase represents an early prototype designed for generic event scheduling. It cannot be salvaged through minor incremental tweaks. The platform requires a disciplined, domain-driven refactoring following the **Document Precedence Framework** and implemented through the validated **7-Phase Build Order Roadmap**.

---

## 2. Document Precedence Framework

To eliminate architectural ambiguity across team agents and future development milestones, this report establishes a formal, non-negotiable hierarchy of specification truth.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DOCUMENT PRECEDENCE HIERARCHY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 1: CANONICAL SPECIFICATION                                            │
│  MakeHappn [Dashboard].pdf (9 Pages)                                        │
│  • Master authority on 11-stage workflow, stage gates, tri-partite costs,   │
│    8 studio modules, deliverables, change requests, and status logic.       │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 2: ORGANIZATIONAL & WORKFLOW AUTHORITY                                │
│  MH [WORKFLOW & OPERATING STRUCTURE].pdf (2 Pages)                          │
│  • Primary authority on 3 functional lanes, matrix staffing, cross-lane     │
│    leadership bridges, reporting lines, and macro 4-phase delivery cadence. │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 3: EXECUTIVE & SUPPLEMENTARY CONTEXT                                  │
│  Makehappn [Dashboard 2].pdf (4 Pages)                                      │
│  • Supporting synthesis of business functions and product taxonomy. Yields  │
│    to Tier 1 wherever Tier 1 provides higher operational granularity.       │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 4: LEGACY IMPLEMENTATION ARTIFACTS                                    │
│  Current Codebase (src/, scripts/)                                          │
│  • Prototype scratchpad holding zero domain authority. All code conflicts   │
│    are treated as defects in the code, never in the specification.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Operational Conflict Resolution Rules

1. **Precedence Over Code**: The operating briefs supersede the codebase without exception. No constraint in `src/` (such as single `typeId`, single `teamId`, or date-based phases) may justify diverging from the PDF briefs.
2. **Granularity Rule**: Where `MakeHappn [Dashboard].pdf` specifies 11 discrete stages and `Makehappn [Dashboard 2].pdf` summarizes 10 stages (or the Workflow deck summarizes 4 phases), the 11-stage specification governs the underlying data schemas, validation engines, and state machines. Higher-level summaries serve exclusively as executive visual roll-ups.
3. **Seat vs Incumbent Decoupling**: Where `MH [WORKFLOW]` cites specific individuals (e.g., Sohila, Hamdy, Nadine, Sara M.), these names represent **functional seats** in the studio org chart. System schemas and permissions must bind to formal domain roles and lane designations, never hardcoded personal identities.
4. **Strict Cost Segregation**: The Tri-Partite Cost Rule is inviolable: Estimated, Committed, and Actual costs must occupy distinct schema paths and UI columns. They may never be blended into a single aggregated "Cost" field.
5. **Human Gate Verification**: System lifecycle transitions cannot trigger automatically via calendar elapsed time. Stage advancement demands recorded human verification and sign-off artifacts.

---

## 3. Detailed Analysis of the 7 Focus Areas

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                MAKEHAPPN MASTER GAP MATRIX                                      │
├──────────────────────┬───────────────────────────────┬──────────────────────────────────────────┤
│ Focus Area           │ Current Codebase Reality      │ Operating Briefs Mandate                 │
├──────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 1. Unit of Work      │ Event / Experience            │ Project with unique Project Code and     │
│                      │ Single `typeId` foreign key   │ Multi-Select Product/Service Bundling    │
├──────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 2. Lifecycle &       │ Derived clock comparison:     │ 11-Stage Workflow Pipeline with Hard     │
│    Stages            │ Live / Upcoming / Wrapped     │ Approval Gates & 6 Entity Status Trees   │
├──────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 3. Project Record    │ 7 basic scalar fields;        │ >30 Enterprise Fields across 9 Groups;   │
│    Fields            │ zero financial/client data    │ 3-Tier Cost Engine (Est vs Comm vs Act)  │
├──────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 4. Org Chart &       │ owner / leader / member;      │ 3 Connected Lanes; Cross-Lane Project    │
│    Permissions       │ single team isolation         │ Lead Bridge; Multi-Lane Matrix Staffing  │
├──────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 5. Task & Output     │ Single assignee Kanban card;  │ Single Accountable Owner + Collaborators;│
│    Model             │ mandatory modal comment       │ Deliverable Review Lifecycles & CR Logs  │
├──────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 6. Absent Platform   │ 4 rail links; 3 event tabs;   │ 8 Core Enterprise Operating Modules;     │
│    Modules           │ 6 of 8 modules missing        │ 4 Tailored Management Perspectives       │
├──────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 7. Inconsistencies   │ Architectural divergence from │ Reconciled Seats, 11-Stage Canonical     │
│    & Build Order     │ creative studio workflows     │ Pipeline, Validated 7-Phase Build Plan   │
└──────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

---

### Gap 1: Unit of Work (Project vs Event, Multi-Select Products & Project Codes)

#### 1. Codebase Reality & Verbatim Citations
In the existing implementation, work is encapsulated in the `Event` and `EventType` models:

- **`src/models/Event.ts:3-13, 17-23`**:
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
  ```
- **`src/models/EventType.ts:3-15`**:
  ```typescript
  export interface IEventType {
    _id: Types.ObjectId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- **`scripts/seed.ts:9-19`**:
  ```typescript
  const EVENT_TYPES = [
    "Brand experience", "Pop-up", "Installation", "Space",
    "Corporate", "Wedding", "Conference", "Private", "Exhibition",
  ];
  ```
- **`src/components/event-form.tsx:25-30`**:
  Renders a rigid `<select name="typeId">` allowing only a single type selection.
- **`src/components/rail.tsx:13`**:
  Exposes the link `/event-types` labeled `"Experience types"`.
- **`src/app/(app)/dashboard/page.tsx:65`**:
  Header CTA button is labeled `"Start an experience"`, directing to `/events/new`.

#### 2. Operating Briefs Specification
- **`MakeHappn [Dashboard].pdf` §1 & §3**:
  > *"MakeHappn is a multidisciplinary creative studio that connects ideas with the people who bring them to life... A project may involve only one service, such as brand identity, or combine several services into a complete turnkey experience."*
  > 
  > *"A product is the service or group of services the client is buying. A project is the specific piece of work being delivered for that client. One project can contain one product or a combination of products. The dashboard must therefore allow multiple products to be attached to a single project."*
- **The 6 Canonical Products / Services**:
  1. `Curation`: Research & discovery, concept curation, talent sourcing, programming.
  2. `Design / Design Development`: Creative direction, spatial & environmental design, 2D & 3D design, technical drawings.
  3. `Brand Design`: Brand strategy & positioning, brand identity, visual systems, brand applications.
  4. `Brand Communication`: Brand messaging & storytelling, content strategy, campaign concepts, communication materials.
  5. `Production`: Fabrication & manufacturing, printing & branding, sourcing & procurement, installation & setup.
  6. `Turnkey Experience`: End-to-end experience development, creative direction, design, production, on-ground delivery.
- **Unique Project Code**: §12 mandates: *"Project name, unique project code and project type"*.

#### 3. Side-by-Side Schema Comparison

| Dimension | Codebase Implementation (`Event.ts`) | Target Operating Specification (`Project.ts`) |
| :--- | :--- | :--- |
| **Entity Root** | `Event` (Calendar booking) | `Project` (Client engagement & commercial delivery) |
| **Identification** | MongoDB `_id` only | Human-readable unique code: `MH-YYYY-XXX` (e.g., `MH-2026-042`) |
| **Product Association** | Scalar `typeId: ObjectId` (Single selection) | Multi-select array: `productIds: ObjectId[]` or enum set |
| **Product Catalog** | Flat venue categories: "Wedding", "Pop-up" | 6 Studio Offerings: Curation, Design, Brand Design, Brand Comm, Production, Turnkey |
| **Temporal Dependency** | Mandatory `start` and `end` calendar dates | Phase-based target milestones; physical dates optional for digital/design projects |
| **Client Association** | None (Orphan entity) | Relational reference to `Client` and `ClientContact` |

#### 4. Operational Impact of the Gap
1. **Commercial Paralyzation**: If a client purchases a combined package of "Brand Design" + "Production" + "Curation", the current system forces the studio to either create three separate artificial events or falsely categorize the work under a single bucket.
2. **Non-Event Projects Excluded**: Pure design assignments (e.g. Identity design or 3D spatial concept development) have no "event start/end dates". Under current code, they cannot be created without entering fabricated event dates.
3. **Traceability Breakdown**: Without a standard Project Code, purchase orders, invoices, asset directories, and client contracts cannot be cross-referenced across lanes or external partners.

---

### Gap 2: Stages and Lifecycle (11-Stage Pipeline vs Calendar Date Bucketing)

#### 1. Codebase Reality & Verbatim Citations
The application tracks lifecycle state entirely via dynamic clock comparisons without any persistent stage or status fields:

- **`src/lib/format.ts:22, 46-56`**:
  ```typescript
  export type ExperiencePhase = "live" | "upcoming" | "wrapped";

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
- **`src/app/(app)/dashboard/page.tsx:14-18, 109-111`**:
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

#### 2. Operating Briefs Specification
- **`MakeHappn [Dashboard].pdf` §4**: Mandates an **11-stage project pipeline** governed by rigorous operational gates:
  1. `01 · Lead / Inquiry`: Lead record created, lead owner assigned, follow-up date set.
  2. `02 · Qualification & Discovery`: Fit evaluated, client discovery notes recorded, brief formulated.
  3. `03 · Scope, Proposal & Quotation`: Scope defined, product components estimated, commercial quote reviewed by Finance.
  4. `04 · Project Confirmation & Handover`: Client confirms proposal. **Mandatory Hard Gate**: *"Do not treat an unapproved proposal as an active delivery project. Record confirmation before opening delivery tasks."*
  5. `05 · Kick-off & Project Planning`: Delivery plan created, single accountable owner assigned per task, milestones locked.
  6. `06 · Creative Development`: Concept deck and narrative formulated. **Approval Gate**: Client approves concept or formal revision round assigned.
  7. `07 · Design Development`: 2D/3D visual, spatial, and technical specifications developed. **Approval Gate**: Designs approved for production.
  8. `08 · Planning & Pre-Production`: Cost sheet locked, quotes gathered, procurement schedule established. **Gate**: Production proceeds only when designs, budget, and approvals are locked.
  9. `09 · Production & Execution`: Sourcing, fabrication, printing, site build. Issues logged with owner/resolution.
  10. `10 · Delivery / Live Operations`: Final installation, event-day ops, client walkthrough, incident log.
  11. `11 · Financial & Project Close`: Scope/cost reconciliation, client invoices collected, supplier bills settled. **Close Gate**: Project marked Closed only when delivery, documentation, and financial criteria are satisfied.

- **`MakeHappn [Dashboard].pdf` §11 (Discrete Multi-Entity Status Sets)**:
  ```
  Lead:        New · Contacted · Qualified · Proposal in progress · Won · Lost · On hold
  Proposal:    Draft · Internal review · Sent · Under discussion · Approved · Declined · Expired
  Project:     Not started · Planning · In progress · Waiting for client · At risk · On hold · Delivered · Closed
  Task:        To do · In progress · Waiting · In review · Approved · Done · Blocked
  Deliverable: Draft · Internal review · Sent to client · Revision required · Approved · Final
  Payment:     Not invoiced · Invoiced · Partially paid · Paid · Overdue
  ```
- **Semantic Separation: `Delivered` vs `Closed`**:
  - `Delivered`: Physical installation finished or live event concluded; operational handover complete.
  - `Closed`: Commercial and administrative settlement complete: all client invoices paid, all supplier invoices settled, actual margins reconciled, project debrief completed, assets archived.

#### 3. Side-by-Side Pipeline Comparison Matrix

| Stage # & Canonical Name | Macro Phase | Codebase Representation | Required Gate Validation Artifact | Approval Role Authority |
| :--- | :--- | :--- | :--- | :--- |
| **01 Lead / Inquiry** | Pre-Project | None (Unrepresentable) | Qualified Lead Record | Sales / Sara Dawoud |
| **02 Qualification & Discovery** | Pre-Project | None (Unrepresentable) | Usable Client Brief | Creative Lead / Sara M. |
| **03 Scope, Proposal & Quotation** | Pre-Project | None (Unrepresentable) | Approved Quotation & SOW | Finance & Sara Dawoud |
| **04 Project Confirmation & Handover** | Commercial Gate | None (Auto-starts on date) | Signed Contract + Deposit Received | Sara Dawoud / Client |
| **05 Kick-off & Project Planning** | Delivery Planning | `Upcoming` (if date > today) | Locked Delivery Plan & RACI | Project Owner / Sara M. |
| **06 Creative Development** | Concept / 2D/3D | `Upcoming` or `Live` | Client Concept Approval Record | Sama (Creative Lead) & Client |
| **07 Design Development** | Technical Design | `Live` | Production-Ready Design Sign-off | Art Director / Nadine / Client |
| **08 Planning & Pre-Production** | Production Prep | `Live` | Locked Cost Sheet + Supplier POs | Sara M. / Mai / Finance |
| **09 Production & Execution** | Fabrication | `Live` | Quality Control Checklist Passed | Mai / Project Owner |
| **10 Delivery / Live Operations** | Live Operations | `Live` | Client Walkthrough Sign-off | Project Owner / Sara M. / Client |
| **11 Financial & Project Close** | Project Close | `Wrapped` (Auto if date passed) | Financial Settlement Audit Sign-off | Finance & Sara Dawoud |

#### 4. Operational Impact of the Gap
- **Premature Project Wrap**: In the codebase, if a project's `end` date passes, the UI labels it "Wrapped", hiding it from active delivery views even if fabrication is behind schedule, client punch-lists remain unaddressed, and final invoices are unpaid.
- **Premature Project Activation**: If a calendar start date arrives, the system treats the event as "Live", even if the client has not paid the deposit, signed the scope, or approved the creative concept!
- **Zero Governance Control**: Without stage gates, team members can fabricate items before budgets are locked or designs are signed off, exposing the studio to massive financial and operational liability.

---

### Gap 3: Project Record Fields (Commercial, Operational, and Financial Tracking)

#### 1. Codebase Reality & Verbatim Citations
The `Event` model in `src/models/Event.ts:15-25` is an empty shell containing only 7 fields:
`name`, `typeId`, `start`, `end`, `teamIds`, `notifiedTeamIds`, `createdAt/updatedAt`.
There are no fields for clients, commercial value, cost breakdown, payment terms, deliverables, external partners, change requests, or post-mortem reviews.

#### 2. Operating Briefs Specification
`MakeHappn [Dashboard].pdf` §12 establishes a comprehensive enterprise specification for the Core Project Record. It explicitly dictates that the record must connect 9 distinct categories containing over 30 essential fields.

#### 3. Comprehensive Field Inventory & Gap Audit Table

| Category | Required Specification Field (`MakeHappn [Dashboard].pdf` §9, §12) | Codebase Status | Architectural Impact / Defect |
| :--- | :--- | :--- | :--- |
| **1. Identification** | Unique Project Code (`MH-YYYY-XXX`) | **MISSING** | No human-readable identifier for invoices or contracts |
| | Project Name | Present (`name: string`) | Only name is captured |
| | Multi-Selected Products (1 to 6 products) | **CRITICAL GAP** | Single scalar `typeId` foreign key |
| | Current Pipeline Stage (01 to 11) | **MISSING** | No stage tracking; relies on clock math |
| | Project Status (8 discrete states) | **MISSING** | No project-level operational status |
| | Overall Project Health (On track / At risk / Delayed) | **MISSING** | No exception alerts or risk flags |
| **2. Client Context** | Client Organization Ref | **MISSING** | Zero client entity in database |
| | Primary Contact (Name, Title, Email, Phone) | **MISSING** | Client contacts not recorded |
| | Decision-Makers List | **MISSING** | Sign-off authority undefined |
| | Lead Source (Inquiry, Referral, Existing, Social) | **MISSING** | Marketing channel attribution impossible |
| | Client Brief & Scope Narrative | **MISSING** | Scope not stored with project |
| | Location / Venue | **MISSING** | Site information absent |
| **3. Leadership** | Project Owner / Lead (Ref to User) | **MISSING** | No single accountable project owner |
| | Creative Lead (Ref to User) | **MISSING** | Creative accountability untracked |
| | Assigned Team Members by Lane | Defective | Flat `teamIds: ObjectId[]` without lane roles |
| **4. Schedule** | Kick-off Date & Target Milestone Schedule | **MISSING** | No milestone schedules |
| | Review Rounds & Feedback Due Dates | **MISSING** | Client review deadlines untracked |
| | Financial Close Date | **MISSING** | Commercial close-out unmonitored |
| **5. Financials** | Quoted Client Value | **MISSING** | Zero commercial proposal tracking |
| | Approved Contract Value | **MISSING** | Contract value absent |
| | Payment Milestones & Terms | **MISSING** | Invoicing milestones absent |
| | Deposit Payment Status | **MISSING** | Gate 04 deposit verification impossible |
| | **Estimated Costs** (Internal Effort + External) | **CRITICAL GAP** | Zero cost budgeting |
| | **Committed Costs** (Supplier POs & Contracts) | **CRITICAL GAP** | Zero purchase order tracking |
| | **Actual Costs** (Logged Incurred Expenses) | **CRITICAL GAP** | Zero expense tracking |
| | Expected vs Actual Gross Margin (%) | **MISSING** | Studio profitability uncalculated |
| | Invoices List (Number, Amount, DueDate, Status) | **MISSING** | Cash collections untracked |
| **6. Deliverables** | Deliverable Artifacts Array | **MISSING** | Artifacts treated as generic task text |
| | Version History & Revision Counters | **MISSING** | Creative iterations unversioned |
| | Repository Links (Figma, CAD, 3D Renders, Assets) | **MISSING** | Central project files unlinked |
| **7. Collective** | Linked External Makers (Artists, Fabricators) | **MISSING** | Freelance talent untracked |
| | Linked Business Partners (Venues, F&B, AV, Tech) | **MISSING** | Commercial suppliers untracked |
| | Agreed Fees, Scopes & PO Numbers | **MISSING** | Vendor cost commitments unrecorded |
| **8. Governance** | Change Requests (What, Why, Approver, Cost/Time Delta) | **MISSING** | Out-of-scope work untracked |
| | Risk & Issue Register (Severity, Owner, Resolution) | **MISSING** | Operational risks unmanaged |
| **9. Close-Out** | Client Handover Walkthrough Signoff | **MISSING** | Delivery completion unrecorded |
| | Outstanding Punch List | **MISSING** | Operational handover checklist missing |
| | Post-Mortem & Performance Notes | **MISSING** | Lessons learned uncaptured |
| | Case Study & Portfolio Asset Links | **MISSING** | Marketing packaging unlinked |

#### 4. The Tri-Partite Financial Engine Rule
`MakeHappn [Dashboard].pdf` §9 dictates:
> *"The dashboard should clearly distinguish estimated, committed and actual costs. These are different figures and should not be combined into one number."*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TRI-PARTITE FINANCIAL ENGINE                          │
├───────────────────────┬─────────────────────────────┬───────────────────────┤
│ 1. ESTIMATED COSTS    │ 2. COMMITTED COSTS          │ 3. ACTUAL COSTS       │
│ • Calculated during   │ • Contracted during         │ • Incurred during     │
│   Proposal (Stage 03) │   Pre-Production (Stage 08) │   Execution (Stage 09)│
│ • Internal Hours Est. │ • Signed Supplier Contracts │ • Invoiced Supplier   │
│ • External Quotes Est.│ • Issued Purchase Orders    │   Bills Received      │
│ • Contingency Reserve │ • Agreed Maker/Artist Fees  │ • Expense Receipts    │
├───────────────────────┴─────────────────────────────┴───────────────────────┤
│ GOVERNANCE RULE:                                                            │
│ Estimated vs Committed vs Actual costs represent three distinct temporal    │
│ states of commercial reality. Blending them into a single aggregate "Cost"  │
│ field corrupts gross margin forecasting and financial auditability.         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Gap 4: Org Chart, Lanes, and Permissions (Generic Crews vs 3 Functional Lanes)

#### 1. Codebase Reality & Verbatim Citations
The codebase enforces an authoritarian, single-team hierarchy that fragments agency collaboration:

- **`src/lib/domain.ts:1-2`**:
  ```typescript
  export const ROLES = ["owner", "leader", "member"] as const;
  export type Role = (typeof ROLES)[number];
  ```
- **`src/models/User.ts:9-10, 20-21`**:
  ```typescript
  export interface IUser {
    ...
    role: Role;
    teamId: Types.ObjectId | null;
  }
  role: { type: String, required: true, enum: ["owner", "leader", "member"] },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  ```
- **`src/models/Team.ts:3-9, 14`**:
  ```typescript
  export interface ITeam {
    _id: Types.ObjectId;
    name: string;
    leaderId: Types.ObjectId | null;
  }
  ```
- **`src/services/org.ts:67-83, 194-196`**:
  Enforces that every non-owner user belongs to exactly one `teamId`. When promoting a new team leader, the system automatically demotes the existing leader to `member`.
- **`src/lib/permissions.ts:11-47`**:
  - `canViewEvent`: Non-owners can only view an event if their single `teamId` is in `event.teamIds`.
  - `canAssignTask`: Only the `owner` or the `leader` of that specific `taskTeamId`.
  - `canCommentOnTask`: Non-owners cannot comment on a task unless `user.teamId === taskTeamId`! If Nadine (Design) and Mai (Production) are staffed on the same event, Nadine cannot leave a comment on Mai's production task!

#### 2. Operating Briefs Specification
`MH [WORKFLOW & OPERATING STRUCTURE].pdf` details the studio's true organizational architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SARA DAWOUD (Founder & MD)                            │
│                  Business • Strategy • Clients • Final Decisions            │
│                  * Contributes to initial Art Direction with Nadine         │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │ (Matrix Dotted Lines)       │
        ┌───────────────┴──────────────┐              │
        ▼                              ▼              ▼
┌───────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
│     VISION & DESIGN       │ │ PROJECT & DELIVERY│ │     COMMUNICATION       │
│       (Dark Navy)         │ │      (Teal)       │ │     (Gold/Yellow)       │
├───────────────────────────┤ ├───────────────────┤ ├─────────────────────────┤
│ Sama (Creative Lead)      │ │ Sara M. (Lead)    │ │ Mariam (Social Media)   │
│ Art Director / Sohila     │ │ Mai (Executive)   │ │  * Reports to Nadine    │
│ Nadine (Sr Graphic Des.)  │ │ Production Intern │ │  * Runs in parallel     │
│ Hamdy (3D Visualizer)     │ └───────────────────┘ │    across all stages    │
└───────────────────────────┘                       └─────────────────────────┘
```

- **Cross-Lane Matrix Bridges**:
  1. **Sara M. as Concept-to-Delivery Bridge**: While leading Lane 2, Sara M. participates in Stage 01/02 briefing and feasibility alongside Sama, ensuring delivery constraints are baked into creative concepts.
  2. **Sara Dawoud's Dual Function**: Operates as MD while actively shaping creative direction alongside Nadine.
  3. **Mariam's Continuous Parallel Work**: Operates in Communication but documents work across all lanes from Stage 01 to Stage 11, reporting creatively to Nadine.
  4. **The Cross-Lane Project Lead**: Every project has a designated **Project Owner/Lead** who exercises delivery authority across all three lanes.

#### 3. Organizational Model Comparison Matrix

| Dimension | Codebase Implementation | Operating Structure Specification |
| :--- | :--- | :--- |
| **Structural Unit** | Arbitrary Teams ("Planning", "Installment") | 3 Connected Lanes: Vision & Design, Project & Delivery, Communication |
| **Membership Model** | Strictly 1 `teamId` per user | Matrix: Primary lane membership + cross-lane project staffing |
| **Leadership Roles** | Generic `owner`, `leader`, `member` | Functional Seats: MD, Creative Lead, Art Director, Delivery Lead, Production Exec |
| **Project Coordination** | Disconnected team leaders in silos | Single designated Project Lead managing cross-lane delivery |
| **Cross-Team Comments** | Hard blocked (`user.teamId === taskTeamId`) | Open cross-lane collaboration across all project participants |
| **Task Creation** | Hardcoded to Owner only (`tasks.ts:134`) | Authorized Project Leads, Creative Leads, and Production Executives |

---

### Gap 5: Task Accountability and Deliverables (Single Assignee vs Accountable Owner & Deliverables)

#### 1. Codebase Reality & Verbatim Citations
- **`src/models/Task.ts:4-15, 19-26`**:
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
- **`src/services/tasks.ts:134`**:
  ```typescript
  if (input.actor.role !== "owner") throw new Error("Only the owner can add backlog tasks");
  ```
- **`src/components/board.tsx:183-186` & `src/services/tasks.ts:32`**:
  Moving any card across columns triggers a modal dialog requiring a mandatory non-empty text reason.
- **Absence of Deliverable Model**: No deliverable entities, review rounds, client approval states, or file attachment versions exist in the application.

#### 2. Operating Briefs Specification
- **`MakeHappn [Dashboard].pdf` §4 (Stage 05) & §14**:
  > *"Each project and task must have a clear owner; shared responsibility should not mean unclear accountability."*
  Tasks require exactly **one Accountable Owner** (the single throat to choke for delivery) and can support multiple **Collaborators / Contributors** across lanes.
- **First-Class Deliverable Lifecycle (§11)**:
  A deliverable is a formal agency output (e.g., Concept Pitch Deck, Spatial 3D Renders, Technical CAD drawings, BOQ). It possesses its own approval lifecycle:
  ```
  Draft ──► Internal Review ──► Sent to Client ──► Approved ──► Final
                                     │
                                     ▼
                             Revision Required
  ```
- **Change Request Governance (§7)**:
  Distinguishes normal creative iteration from formal scope/budget modifications:
  - *Feedback*: Comments within agreed scope.
  - *Revision*: Defined, budgeted round of updates.
  - *Scope Change*: New requirement beyond scope.
  - *Change Request*: Formal recorded document capturing: (1) What changed, (2) Why it changed, (3) Who approved it, (4) Financial cost impact, (5) Timeline impact.
  - *Core Governance Rule*: *"No material scope, cost or timeline change should be treated as approved until the decision and its impact are recorded."*

#### 3. Task & Deliverable Comparison

| Dimension | Codebase Implementation | Operating Brief Specification |
| :--- | :--- | :--- |
| **Accountability** | Single `assigneeId: ObjectId \| null` | Single `accountableOwnerId: ObjectId` + `collaboratorIds: ObjectId[]` |
| **Task Creation** | Owner only (`tasks.ts:134`) | Project Lead, Creative Lead, Production Lead |
| **Deliverable Entity** | None (Treated as plain text tasks) | First-class `Deliverable` entity linked to Products, Stages, and Files |
| **Approval Lifecycle** | Flat statuses (`in_review` -> `done`) | Formal lifecycle: `Draft` -> `Internal Review` -> `Client Review` -> `Approved` |
| **Version Tracking** | None | Version number, revision round counter, feedback audit trail |
| **Change Management** | None | Formal `ChangeRequest` entity with cost and schedule delta tracking |
| **Dependencies** | None | Directed acyclic graph (`predecessorTaskIds[]`, `blockingTaskIds[]`) |

---

### Gap 6: Absent Platform Modules & Management Perspectives

#### 1. Codebase Reality & Verbatim Citations
- **Navigation Surface Area (`src/components/rail.tsx:9-14`)**:
  ```typescript
  const links = [
    { href: "/dashboard", label: "Dashboard", ownerOnly: false },
    { href: "/people", label: "People", ownerOnly: true },
    { href: "/teams", label: "Teams", ownerOnly: true },
    { href: "/event-types", label: "Experience types", ownerOnly: true },
  ];
  ```
- **Event Internal Sub-routes (`src/components/event-tabs.tsx:8-12`)**:
  Exposes only `Backlog`, `Board`, and `Performance`.
- **404 Routing Defect**: Visiting `/events` throws a 404 because `src/app/(app)/events/` contains no `page.tsx`. Visiting `/events/[id]` unconditionally executes `redirect('/events/${id}/backlog')` (`src/app/(app)/events/[id]/page.tsx:14`).

#### 2. Operating Briefs Specification
`MakeHappn [Dashboard].pdf` §10 defines the **8 Core Modules** required to operate the studio, along with the **4 Tailored Management Perspectives** (§13):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE 8 CORE STUDIO MODULES                           │
├──────────────────────┬──────────────────────────────────────────────────────┤
│ 1. Overview          │ Studio command center: KPIs, pipeline totals, active │
│                      │ project health, upcoming deadlines, payment alerts.  │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 2. Sales             │ CRM: Leads, discovery briefs, client directory, deal │
│                      │ valuation, proposal generator, conversion pipeline.  │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 3. Projects          │ Central project registry, 11-stage pipeline tracker, │
│                      │ product tagging, milestone schedule, health alerts.  │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 4. Tasks & Team      │ Multi-lane task execution, accountable owners, cross-│
│                      │ lane workloads, Gantt dependencies, capacity maps.   │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 5. Creative & Design │ Creative asset registry, concept decks, 2D/3D visual │
│                      │ reviews, feedback rounds, client sign-off audit log. │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 6. Production &      │ Supplier directory, quotes, locked cost sheets, POs, │
│    Procurement       │ fabrication schedules, on-site QC checklists.        │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 7. Collective &      │ External talent network: Collective Makers (artists),│
│    Resources         │ Collective Partners (venues, F&B, AV), fee contracts.│
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 8. Finance & Reports │ Tri-partite costs (est/comm/act), invoice tracker,   │
│                      │ gross margins, sales reporting, post-mortem reviews. │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

#### 3. The 4 Management Perspectives (`MakeHappn [Dashboard].pdf` §13)

| Management View | Target Audience | Key Operational Questions Answered |
| :--- | :--- | :--- |
| **Business View** | Founder & MD (Sara Dawoud), Sales | What is our total pipeline value? What has been won vs lost? What revenue is expected this quarter? Which products/clients generate peak margins? |
| **Project View** | Project & Delivery Lead (Sara M.), Project Leads | What stage is each project in? What milestone is due next? Which projects are waiting for client approval, delayed, or over budget? |
| **Team View** | Lane Leads, Project Owners | Who owns each task? Where is workload concentrated? Who is over-capacity? Who is blocked waiting for client or team input? |
| **Financial View** | Founder & MD, Finance & Legal | What has been quoted, approved, committed, spent, invoiced, and collected? What is the expected vs actual gross profit per project? |

---

### Gap 7: Document Inconsistencies & Build Order Validation

#### 1. Detailed Document Discrepancy Reconciliation

##### Discrepancy 1: Art Director Identity — Sohila vs Art Director / Senior 3D Designer [NEW HIRE]
- **The Evidence**:
  - `MH [WORKFLOW & OPERATING STRUCTURE].pdf` Page 1 (Project Workflow) assigns Stage 02 Design Development to:
    `"Nadine: Visual identity & 2D design"`, `"Sohila: Art direction & spatial/3D design"`, `"→ Hamdy: Spatial/3D execution"`.
  - `MH [WORKFLOW & OPERATING STRUCTURE].pdf` Page 2 (Operating Structure Org Chart) labels the exact same position under Vision & Design as:
    `"Art Director / Senior 3D: ART DIRECTION / SENIOR 3D DESIGNER (3D · Spatial thinking · Art direction) [NEW HIRE]"`, with Hamdy reporting directly beneath.
- **Root Cause & Operational Reality**:
  This reflects natural organizational growth: Sohila served as the initial acting Art Director during workflow drafting, while the studio concurrently opened recruitment to formalize a permanent `Art Director / Senior 3D Designer` position.
- **Architectural Reconciliation**:
  Decouple **Functional Seats** from **Individual Incumbents**. The platform data model must define the formal functional seat `Art Director / Senior 3D Designer` within the `Vision & Design` lane. Users (whether Sohila, a newly recruited designer, or a temporary freelancer) are assigned to that functional seat. All permissions, approval authorities, and notifications bind to the functional role, never to personal names.

##### Discrepancy 2: Pipeline Stage Granularity — 11 Stages vs 10 Stages vs 4 Phases vs 4 Business Flows
- **The Evidence**:
  - `MakeHappn [Dashboard].pdf` Page 3-4 details **11 discrete operational stages** (`01 Lead/Inquiry` to `11 Financial & Project Close`).
  - `Makehappn [Dashboard 2].pdf` Page 3 lists **10 stages**, collapsing Stage 04 & 05 into `"04 Project Confirmation"`, and renaming stages (`02 Discovery & Briefing`, `09 Delivery / Event Day`, `10 Closing & Evaluation`).
  - `MH [WORKFLOW & OPERATING STRUCTURE].pdf` Page 1 illustrates **4 macroscopic phases** (`01 Client & Creative Brief`, `02 Design Development`, `03 Delivery & Production`, `04 Communication`).
  - `MakeHappn [Dashboard].pdf` Page 1 lists **4 core business flows** (`1. Find the opportunity`, `2. Shape the work`, `3. Deliver the work`, `4. Close and learn`).
- **Architectural Reconciliation**:
  These representations represent a hierarchical pyramid of abstraction. The **11-stage pipeline from Dashboard 1 is canonical and mandatory** for operational and financial control. Separating Stage 04 (Commercial Confirmation & Deposit) from Stage 05 (Delivery Planning & Task Activation) is essential: delivery tasks must be blocked until deposit and contract are signed.
  The 4 macroscopic phases serve as executive rollup views:
  ```
  Macro Phase (Executive View)   Canonical Operational Stage (Pipeline Engine)
  ────────────────────────────   ─────────────────────────────────────────────
  Phase 1: Find Opportunity      Stage 01: Lead / Inquiry
                                 Stage 02: Qualification & Discovery
                                 Stage 03: Scope, Proposal & Quotation
  ────────────────────────────   ─────────────────────────────────────────────
  Phase 2: Shape the Work        Stage 04: Project Confirmation & Handover (Gate 04)
                                 Stage 05: Kick-off & Project Planning
                                 Stage 06: Creative Development (Gate 06)
                                 Stage 07: Design Development (Gate 07)
  ────────────────────────────   ─────────────────────────────────────────────
  Phase 3: Deliver the Work      Stage 08: Planning & Pre-Production (Gate 08)
                                 Stage 09: Production & Execution
                                 Stage 10: Delivery / Live Operations
  ────────────────────────────   ─────────────────────────────────────────────
  Phase 4: Close and Learn       Stage 11: Financial & Project Close (Gate 11)
  ```

##### Discrepancy 3: Communication — Billable Product vs Continuous Parallel Function
- **The Evidence**:
  - `MakeHappn [Dashboard].pdf` §3 lists Product 04 as `"Brand Communication"`.
  - `MH [WORKFLOW & OPERATING STRUCTURE].pdf` Page 1 places Communication as macro box 04, but footnote explicitly notes:
    > *"Mariam documents throughout every stage in parallel — Communication is where that work is packaged and shared externally, not the only point she's involved."*
  - Page 2 notes Mariam reports to Nadine (Senior Graphic Designer in Vision & Design).
- **Architectural Reconciliation**:
  The system must model Communication across two distinct planes:
  1. *Commercial Plane*: A billable client service (`Brand Communication`) that can be bundled into a project.
  2. *Operational Plane*: A continuous, cross-cutting activity running across all 11 stages where Mariam gathers photos, footage, and documentation in parallel with creative and production workflows.

##### Discrepancy 4: Product Naming — "Design" vs "Design Development"
- **The Evidence**:
  `MakeHappn [Dashboard].pdf` §3 lists Product 02 as `"Design"`. `Makehappn [Dashboard 2].pdf` §3 and the Workflow deck label it `"02. Design Development"`.
- **Architectural Reconciliation**:
  Both refer to the exact same scope: spatial design, 2D/3D development, renders, and technical drawings. The target taxonomy adopts `Design Development` as the formal product name (or `Design / Design Development`) to distinguish it clearly from `Brand Design`.

---

## 4. Target Architectural Schemas

To provide an authoritative, production-ready specification for implementation teams in Milestone 3, the target domain schemas are defined below in TypeScript and Mongoose syntax.

### 4.1 Target Project Schema (`src/models/Project.ts`)

```typescript
import { Schema, model, models, Types, Document } from "mongoose";

export const PROJECT_STAGES = [
  "01_lead_inquiry",
  "02_qualification_discovery",
  "03_scope_proposal_quotation",
  "04_project_confirmation_handover",
  "05_kickoff_project_planning",
  "06_creative_development",
  "07_design_development",
  "08_planning_pre_production",
  "09_production_execution",
  "10_delivery_live_operations",
  "11_financial_project_close",
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const PROJECT_STATUSES = [
  "not_started",
  "planning",
  "in_progress",
  "waiting_for_client",
  "at_risk",
  "on_hold",
  "delivered",
  "closed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_HEALTHS = ["on_track", "needs_attention", "at_risk", "delayed"] as const;
export type ProjectHealth = (typeof PROJECT_HEALTHS)[number];

export interface IProjectTeamAssignment {
  userId: Types.ObjectId;
  lane: "vision_design" | "project_delivery" | "communication";
  roleTitle: string; // e.g. "Project Lead", "Creative Lead", "3D Visualizer"
  isLead: boolean;
}

export interface IMilestone {
  title: string;
  targetDate: Date;
  completedDate?: Date;
  gateType?: "confirmation" | "concept_approval" | "design_signoff" | "budget_lock" | "close_out";
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
}

export interface IProjectFinancialSummary {
  quotedValue: number;
  approvedContractValue: number;
  estimatedCosts: {
    internalHoursCost: number;
    externalSuppliersCost: number;
    contingency: number;
    total: number;
  };
  committedCosts: {
    totalPurchaseOrders: number;
    totalMakerFees: number;
    total: number;
  };
  actualCosts: {
    incurredSupplierBills: number;
    reconciledExpenses: number;
    total: number;
  };
  expectedGrossMargin: number; // approvedContractValue - estimatedCosts.total
  actualGrossMargin: number;   // approvedContractValue - actualCosts.total
  depositReceived: boolean;
  depositReceivedAt?: Date;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  projectCode: string; // e.g., "MH-2026-001" (unique, indexed)
  name: string;
  clientId: Types.ObjectId; // ref: Client
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  productIds: Types.ObjectId[]; // ref: Product (multi-select)
  currentStage: ProjectStage;
  status: ProjectStatus;
  health: ProjectHealth;
  projectLeadId: Types.ObjectId; // ref: User (Single designated Project Lead)
  creativeLeadId?: Types.ObjectId; // ref: User (e.g. Sama)
  teamAssignments: IProjectTeamAssignment[];
  scopeDescription: string;
  venueLocation?: string;
  startDate?: Date;
  targetDeliveryDate?: Date;
  financialCloseDate?: Date;
  milestones: IMilestone[];
  financials: IProjectFinancialSummary;
  bypassedStages: ProjectStage[]; // Configurable for small brand design jobs
  isDelivered: boolean;
  deliveredAt?: Date;
  isClosed: boolean;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    projectCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    primaryContact: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      role: { type: String },
    },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
    currentStage: { type: String, required: true, enum: PROJECT_STAGES, default: "01_lead_inquiry", index: true },
    status: { type: String, required: true, enum: PROJECT_STATUSES, default: "not_started", index: true },
    health: { type: String, required: true, enum: PROJECT_HEALTHS, default: "on_track" },
    projectLeadId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creativeLeadId: { type: Schema.Types.ObjectId, ref: "User" },
    teamAssignments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        lane: { type: String, enum: ["vision_design", "project_delivery", "communication"], required: true },
        roleTitle: { type: String, required: true },
        isLead: { type: Boolean, default: false },
      },
    ],
    scopeDescription: { type: String, default: "" },
    venueLocation: { type: String, default: "" },
    startDate: { type: Date },
    targetDeliveryDate: { type: Date },
    financialCloseDate: { type: Date },
    milestones: [
      {
        title: { type: String, required: true },
        targetDate: { type: Date, required: true },
        completedDate: { type: Date },
        gateType: { type: String, enum: ["confirmation", "concept_approval", "design_signoff", "budget_lock", "close_out"] },
        isApproved: { type: Boolean, default: false },
        approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
        approvedAt: { type: Date },
      },
    ],
    financials: {
      quotedValue: { type: Number, default: 0 },
      approvedContractValue: { type: Number, default: 0 },
      estimatedCosts: {
        internalHoursCost: { type: Number, default: 0 },
        externalSuppliersCost: { type: Number, default: 0 },
        contingency: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      committedCosts: {
        totalPurchaseOrders: { type: Number, default: 0 },
        totalMakerFees: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      actualCosts: {
        incurredSupplierBills: { type: Number, default: 0 },
        reconciledExpenses: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      expectedGrossMargin: { type: Number, default: 0 },
      actualGrossMargin: { type: Number, default: 0 },
      depositReceived: { type: Boolean, default: false },
      depositReceivedAt: { type: Date },
    },
    bypassedStages: [{ type: String, enum: PROJECT_STAGES }],
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export const Project = models.Project || model<IProject>("Project", projectSchema);
```

---

### 4.2 Target Product Schema (`src/models/Product.ts`)

```typescript
import { Schema, model, models, Types, Document } from "mongoose";

export const PRODUCT_CODES = [
  "CURATION",
  "DESIGN_DEVELOPMENT",
  "BRAND_DESIGN",
  "BRAND_COMMUNICATION",
  "PRODUCTION",
  "TURNKEY_EXPERIENCE",
] as const;
export type ProductCode = (typeof PRODUCT_CODES)[number];

export interface IProduct extends Document {
  _id: Types.ObjectId;
  code: ProductCode;
  name: string;
  leadLane: "vision_design" | "project_delivery" | "communication";
  description: string;
  standardDeliverables: string[];
  isActive: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    code: { type: String, required: true, unique: true, enum: PRODUCT_CODES },
    name: { type: String, required: true },
    leadLane: { type: String, required: true, enum: ["vision_design", "project_delivery", "communication"] },
    description: { type: String, required: true },
    standardDeliverables: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = models.Product || model<IProduct>("Product", productSchema);
```

---

### 4.3 Target User & Lane Schema (`src/models/User.ts`)

```typescript
import { Schema, model, models, Types, Document } from "mongoose";

export const STUDIO_LANES = ["vision_design", "project_delivery", "communication", "management"] as const;
export type StudioLane = (typeof STUDIO_LANES)[number];

export const STUDIO_ROLES = [
  "founder_md",
  "creative_lead",
  "art_director",
  "senior_graphic_designer",
  "spatial_3d_visualizer",
  "project_delivery_lead",
  "design_production_executive",
  "production_intern",
  "social_media_specialist",
  "finance_operations",
] as const;
export type StudioRole = (typeof STUDIO_ROLES)[number];

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  primaryLane: StudioLane;
  functionalRole: StudioRole;
  isOwner: boolean; // Sara Dawoud
  isExecutive: boolean;
  supervisorId?: Types.ObjectId; // e.g. Mariam reports to Nadine
  active: boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    primaryLane: { type: String, required: true, enum: STUDIO_LANES },
    functionalRole: { type: String, required: true, enum: STUDIO_ROLES },
    isOwner: { type: Boolean, default: false },
    isExecutive: { type: Boolean, default: false },
    supervisorId: { type: Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", userSchema);
```

---

### 4.4 Target Task & Deliverable Schemas (`src/models/Task.ts`, `src/models/Deliverable.ts`)

```typescript
import { Schema, model, models, Types, Document } from "mongoose";

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "waiting",
  "in_review",
  "approved",
  "done",
  "blocked",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface ITask extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId; // ref: Project
  stage: string; // Associated stage e.g. "06_creative_development"
  title: string;
  description: string;
  accountableOwnerId: Types.ObjectId; // ref: User (STRICTLY ONE ACCOUNTABLE OWNER)
  collaboratorIds: Types.ObjectId[]; // ref: User (Multiple contributors)
  deliverableId?: Types.ObjectId; // ref: Deliverable
  priority: "low" | "medium" | "high" | "urgent";
  status: TaskStatus;
  dueDate: Date;
  predecessorTaskIds: Types.ObjectId[]; // Dependency DAG
  blockedReason?: string;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    stage: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    accountableOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    collaboratorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deliverableId: { type: Schema.Types.ObjectId, ref: "Deliverable" },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: { type: String, enum: TASK_STATUSES, default: "todo", index: true },
    dueDate: { type: Date, required: true },
    predecessorTaskIds: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    blockedReason: { type: String },
  },
  { timestamps: true }
);

export const Task = models.Task || model<ITask>("Task", taskSchema);
```

```typescript
export const DELIVERABLE_STATUSES = [
  "draft",
  "internal_review",
  "sent_to_client",
  "revision_required",
  "approved",
  "final",
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export interface IDeliverable extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  productId: Types.ObjectId;
  title: string;
  version: number;
  status: DeliverableStatus;
  leadOwnerId: Types.ObjectId;
  assetUrl?: string;
  reviewHistory: {
    version: number;
    reviewedBy: Types.ObjectId;
    clientFeedback?: string;
    decision: "approved" | "revision_requested";
    decidedAt: Date;
  }[];
}

const deliverableSchema = new Schema<IDeliverable>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    version: { type: Number, default: 1 },
    status: { type: String, enum: DELIVERABLE_STATUSES, default: "draft" },
    leadOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assetUrl: { type: String },
    reviewHistory: [
      {
        version: { type: Number, required: true },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        clientFeedback: { type: String },
        decision: { type: String, enum: ["approved", "revision_requested"], required: true },
        decidedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Deliverable = models.Deliverable || model<IDeliverable>("Deliverable", deliverableSchema);
```

---

### 4.5 Target Financial & Governance Schemas (`ChangeRequest.ts`, `Invoice.ts`, `CollectiveMember.ts`)

```typescript
export interface IChangeRequest extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  changeNumber: number; // e.g., CR-01
  requestedBy: "client" | "internal";
  description: string;
  reason: string;
  costImpact: number; // delta in currency
  timelineImpactDays: number; // delta in calendar days
  approvedBy?: Types.ObjectId;
  clientSignoffDate?: Date;
  status: "draft" | "submitted" | "approved" | "rejected";
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  invoiceNumber: string;
  milestoneTitle: string; // e.g. "50% Advance Deposit"
  amount: number;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  status: "not_invoiced" | "invoiced" | "partially_paid" | "paid" | "overdue";
}

export interface ICollectiveMember extends Document {
  _id: Types.ObjectId;
  name: string;
  type: "maker" | "partner"; // Maker: Artist/Freelancer; Partner: Venue/F&B/Fabrication company
  discipline: string; // e.g. "Ceramics", "AV Production", "Spatial Fabrication"
  contactPerson: string;
  email: string;
  phone: string;
  ratesDescription: string;
  relationshipOwnerId: Types.ObjectId; // User ref (e.g. Mai or Sama)
  historicalRating: number;
  isActive: boolean;
}
```

---

## 5. Phased Implementation Roadmap (Phases 0–6)

To execute this architecture with zero regressions and absolute risk control, implementation must proceed through 7 sequential phases. Each phase builds strictly on verified artifacts from preceding phases.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE 7-PHASE FOUNDATION ROADMAP                                  │
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

### Detailed Phase Specifications

#### Phase 0: Architecture & Data Schema Overhaul
- **Objective**: Establish the core domain foundation and TypeScript/Mongoose models.
- **Key Deliverables**:
  1. Author `Project.ts`, `Product.ts`, `User.ts`, `Lane.ts`, `Deliverable.ts`, `ChangeRequest.ts`, `CollectiveMember.ts`.
  2. Implement database migration script (`scripts/migrate-events-to-projects.ts`) mapping legacy events to project records.
  3. Update `domain.ts` with 11 stages, 6 status state-machines, 3 lanes, and functional studio roles.
- **Input Dependencies**: Master Gap Analysis Report baseline.
- **Risk Mitigation**: Backward compatibility shim allowing existing `Event` queries to read from `Project` during transition.

#### Phase 1: Project Hub & 11-Stage Pipeline Engine
- **Objective**: Implement the central Project Master Record and the 11-stage pipeline state-machine.
- **Key Deliverables**:
  1. Project Registry UI (`/projects`) with filtering by stage (01–11), status, health, and multi-selected products.
  2. Project Workspace Hub (`/projects/[id]`) replacing the blind `/backlog` redirect.
  3. Stage Gate validation engine blocking stage advancement unless gate prerequisites are satisfied.
  4. Configurable stage bypass toggles for small brand design engagements.
- **Input Dependencies**: Phase 0 Schemas.
- **Risk Mitigation**: Allow project leads to log explicit bypass rationale for non-applicable stages.

#### Phase 2: Task Accountability & Deliverables System
- **Objective**: Replace the single-assignee Kanban card with the Single Accountable Owner + Collaborator model and Deliverables tracking.
- **Key Deliverables**:
  1. Upgraded Task model with 1 Accountable Owner, Collaborators array, and stage associations.
  2. Deliverable review drawer supporting versioning, review rounds, and approval timestamps.
  3. Remove mandatory drag modal comments; replace with deliverable status changes.
  4. Task dependency graph (DAG) preventing blocked tasks from premature closure.
- **Input Dependencies**: Phase 1 Project Workspace.
- **Risk Mitigation**: Separate day-to-day task execution from client-facing deliverable review in distinct sub-views.

#### Phase 3: Sales Pipeline & Commercial Handover (Stages 01–04)
- **Objective**: Build CRM and Proposal management to enforce Stage 04 Project Confirmation Gate.
- **Key Deliverables**:
  1. Sales Pipeline Kanban (`/sales`) tracking Leads across stages (`New` → `Qualified` → `Proposal`).
  2. Scope & Proposal builder attaching 1–6 products with commercial estimates.
  3. Gate 04 Conversion Engine: Won proposals convert into active projects; blocks task activation without contract signature and deposit receipt.
- **Input Dependencies**: Phase 0 & Phase 1.
- **Risk Mitigation**: Implement strict API validation rejecting delivery task creation for projects in Stages 01–03.

#### Phase 4: Collective & External Partner Network
- **Objective**: Establish the central talent and supplier registry.
- **Key Deliverables**:
  1. Collective Directory (`/collective`) categorized into Makers (creative talent) and Partners (venues, F&B, AV, fabrication).
  2. Maker/Partner engagement drawer on projects: linking external members with agreed fees and POs.
- **Input Dependencies**: Phase 0 & Phase 1.
- **Risk Mitigation**: Role-based masking of commercial rates and private contact information.

#### Phase 5: Financial Management & Commercial Controls
- **Objective**: Implement the Tri-Partite Cost Engine, invoice tracking, and gross margin reporting.
- **Key Deliverables**:
  1. Tri-partite cost sheet component: Estimated Costs vs Committed POs vs Actual Expenses.
  2. Client invoice milestone tracker with payment collection statuses.
  3. Formal Change Request workflow updating project budget and delivery date.
  4. Stage 11 Financial Closeout audit checklist.
- **Input Dependencies**: Phases 1, 2, 3, 4.
- **Risk Mitigation**: Mandatory reconciliation check before allowing project status transition from `Delivered` to `Closed`.

#### Phase 6: Executive Overview, Reports & Analytics
- **Objective**: Build the studio executive command center and the 4 Management Perspectives.
- **Key Deliverables**:
  1. Studio Overview Dashboard (`/dashboard`) with real-time KPI cards, pipeline revenue, active project health, and cashflow alerts.
  2. 4 Tailored Perspectives: Business View (MD/Sales), Project View (Delivery/PM), Team View (Lane Leads), Financial View (Finance/MD).
  3. Analytics engine: Gross margin by product/client, estimate vs actual variance, turnaround times.
- **Input Dependencies**: Phases 1 through 5.
- **Risk Mitigation**: Aggregated MongoDB pipeline indexes to guarantee sub-100ms dashboard load times.

---

## 6. Conclusion & Handoff Attestation

This Master Gap Analysis and Reconciliation Report establishes the canonical, unambiguous blueprint for transforming the MakeHappen codebase into an enterprise-grade multidisciplinary creative studio management system. 

All 7 gap areas have been systematically analyzed with verbatim code citations, operating brief mandates, side-by-side comparison matrices, and fully reconciled domain models. The Strict Code Freeze on `src/` has been 100% maintained throughout this investigation. The project is now ready for Milestone 3 execution following the validated 7-phase build order roadmap.
