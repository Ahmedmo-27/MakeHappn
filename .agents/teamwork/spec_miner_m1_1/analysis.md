# Specification Mining Analysis: MakeHappen Operating Model & System Requirements

**Author**: `spec_miner_m1_1` (Teamwork Specification Miner)  
**Date**: 2026-11-08  
**Working Directory**: `d:\Work\MakeHappen\.agents\teamwork\spec_miner_m1_1\`  
**Primary Specification Sources**:
1. `MakeHappn [Dashboard].pdf` (9 pages) — Internal Dashboard Development Brief: Business Functions, Products, Project Workflow, Dashboard Requirements.
2. `Makehappn [Dashboard 2].pdf` (4 pages) — Internal Working Document: Business & Project Framework (Functions, Products & Project Stages · 2026).
3. `MH [WORKFLOW & OPERATING STRUCTURE].pdf` (2 pages) — Operating Structure & Project Workflow Deck (Studio Team, Lanes, Workflow, Cross-lane Interactions).

---

## 1. Executive Summary & Specification Hierarchy

MakeHappn operates as a **multidisciplinary creative studio** that connects ideas with the people who bring them to life. The studio does not operate as departmental silos handing work over in isolation; rather, all functions work collaboratively around a **client brief** and a designated **project owner**.

### Specification Authority Hierarchy
1. **Primary Authority (`MakeHappn [Dashboard].pdf`)**: The most comprehensive and detailed specification document (9 pages). It defines the canonical **11-stage project lifecycle**, the complete status state-machines, the tri-partite financial model (estimated vs. committed vs. actual), parallel workstream dependencies, change request governance, and the 9 core functional modules.
2. **Operational & Organizational Authority (`MH [WORKFLOW & OPERATING STRUCTURE].pdf`)**: Defines the organizational chart, lane boundaries, specific team members, reporting relationships, cross-lane bridges, and the high-level 4-phase delivery cadence.
3. **Supplementary Summary (`Makehappn [Dashboard 2].pdf`)**: A concise 4-page synthesis of business functions and product taxonomy. Where it truncates stages (listing 10 instead of 11) or omits sections, `MakeHappn [Dashboard].pdf` takes strict precedence as the complete development brief.

---

## 2. Operating Structure, Lanes & Governance

### 2.1 The Three Connected Lanes
MakeHappn organizes its talent and delivery around three connected operational lanes rather than rigid functional silos:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SARA DAWOUD (Founder & MD)                            │
│                  Business • Strategy • Clients • Final decisions            │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │ (Dotted line collaboration) │
        ┌───────────────┴──────────────┐              │
        ▼                              ▼              ▼
┌───────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
│     VISION & DESIGN       │ │ PROJECT & DELIVERY│ │     COMMUNICATION       │
│       (Dark Navy)         │ │      (Teal)       │ │     (Gold/Yellow)       │
├───────────────────────────┤ ├───────────────────┤ ├─────────────────────────┘
│ Sama (Creative Lead)      │ │ Sara M. (Lead)    │ │ Mariam (Social Media)   │
│ Art Director / Sohila     │ │ Mai (Executive)   │ │  * Reports to Nadine    │
│ Nadine (Sr Graphic Des.)  │ │ Production Intern │ │  * Operates in parallel │
│ Hamdy (3D Visualizer)     │ └───────────────────┘ └─────────────────────────┘
└───────────────────────────┘
```

#### Lane 1: Vision & Design (Dark Navy)
- **Scope**: Interprets client briefs, researches audience/context, ideates, shapes concepts, and produces visual, spatial, 2D, 3D, brand, and technical outputs.
- **Key Members & Roles**:
  - **Sama** — *Creative Lead*: Concept, Experience, Storytelling, Client Management. Owns creative direction and client relationship in early stages.
  - **Art Director / Senior 3D Designer** (Named as *Sohila* in workflow, *New Hire* in org chart): 3D, Spatial thinking, Art direction. Leads spatial development.
  - **Nadine** — *Senior Graphic Designer*: Branding, 2D, Visual identity, Visual direction. Directly supervises Mariam; collaborates with Sara Dawoud on initial art direction.
  - **Hamdy** — *Spatial / 3D Visualizer*: Spatial design, 3D, Renders, Technical development. Reports to/executes under Art Director / Sohila.

#### Lane 2: Project & Delivery (Cyan / Teal)
- **Scope**: Feasibility, costing, timelines, supplier coordination, procurement, fabrication, logistics, on-site execution, and quality control.
- **Key Members & Roles**:
  - **Sara M.** — *Project & Delivery Lead*: Vision development, Briefing, Timelines, Budgeting, Delivery ownership & Quality review. Acts as the **critical bridge between concept and delivery**.
  - **Mai** — *Design & Production Executive*: Production, Fabrication, Suppliers, Site management, Procurement.
  - **Production Intern** (*Open Role*): Site & supplier support, follow-up, production support.

#### Lane 3: Communication & Engagement (Ochre / Gold / Yellow)
- **Scope**: Documents studio work as it happens, creates storytelling assets, packages case studies, and drives public/social presence.
- **Key Members & Roles**:
  - **Mariam** — *Social Media Specialist*: Content, Social media, Project communication, Documentation.
  - **Supervisory & Parallel Nature**: Mariam reports administratively to **Nadine** (Senior Graphic Designer in Lane 1). Crucially, Mariam's work **runs in parallel across every single project stage** (documenting process, gathering footage/photos), and culminates in Stage 04 / Stage 10 packaging.

---

### 2.2 Cross-Lane Dynamics, Leadership & Governance Rules

1. **One Project Lead (Owner)**:
   - Every project has a designated Project Owner/Lead who is the single connecting point across the entire workflow.
   - The owner does not perform all tasks personally, but is strictly accountable for ensuring the right person has the right information at the right time, tracking dependencies, and moving work across gates.
2. **One Creative Direction**:
   - Single creative vision maintained across 2D and 3D ("2D and 3D in lockstep").
3. **Sara M. as the Concept-to-Delivery Bridge**:
   - Although leading Lane 2, Sara M. participates actively in early stages (Client & Creative Brief, scoping, feasibility, and vision development) so delivery constraints are baked into the creative scope from day one.
4. **Sara Dawoud's Dual Function**:
   - Operates as Founder & Managing Director (final business and commercial authority), while maintaining active hands-on creative contribution to initial Art Direction alongside Nadine.
5. **No Step Moves Forward Without Alignment**:
   - Strict gate governance. Approvals are not informal chat messages; they are formal records with timestamps and accountability.
6. **Parallel Documentation**:
   - Communication is not an afterthought tacked on at project close. Mariam documents throughout every stage in parallel.

---

## 3. The 11-Stage Project Lifecycle Pipeline

The authoritative workflow (`MakeHappn [Dashboard].pdf` §4) defines an **11-stage pipeline**. The 4-stage diagram in `MH [WORKFLOW & OPERATING STRUCTURE].pdf` represents macro operational phases grouping these 11 stages.

### 3.1 Granular Stage Specification Matrix

| Stage # | Stage Name | Macro Phase | What Happens | Expected Output | Control Gate / Status Transition | Approval Authority |
|---|---|---|---|---|---|---|
| **01** | **Lead / Inquiry** | Pre-Project (Phase 1) | Client/referral presents opportunity. Sales records client info, needs, source, timing, follow-up. | Lead record created, lead owner assigned, next action & follow-up date logged. | `Lead: New → Contacted → Qualified / Not proceeding` | Sales / Sara Dawoud |
| **02** | **Qualification & Discovery** | Pre-Project (Phase 1) | Evaluate fit for MakeHappn. Call, meeting, site visit, or written brief. Clarify goals, audience, budget, timing, decision-makers. | Discovery notes, usable client brief, visible assumptions/gaps. | Lead moves to Proposal or marked Not proceeding / Inactive. | Creative Lead / Sara M. |
| **03** | **Scope, Proposal & Quotation** | Pre-Project (Phase 1) | Select MakeHappn products, define inclusions/exclusions. Creative/design/production estimate effort, costs, timing. Finance verifies margin. | Proposal document, scope of work, deliverables, timeline, quotation, payment terms. | `Proposal: Draft → Internal review → Sent → Under discussion → Won / Lost / On hold` | Finance & Sara Dawoud (Commercial), Sara M. (Feasibility) |
| **04** | **Project Confirmation & Handover** | Activation Gate | Client accepts proposal. Record approved scope, value, payment terms, key dates, project owner. Sales conducts internal handover to delivery. | Confirmed project record, contract/written approval, initial deposit milestone, handover notes. | **GATE RULE**: Do *not* treat unapproved proposals as active delivery projects. Record confirmation before opening delivery tasks. | Sara Dawoud / Client Signature |
| **05** | **Kick-off & Project Planning** | Delivery Planning (Phase 1) | Project owner translates scope into delivery plan: workstreams, owners, tasks, milestones, dependencies, review dates, risk list. | Delivery plan, task list with 1 accountable owner per task, milestone schedule, risk register. | `Project Status: Planning → In progress`. All initial tasks have owner and due date. | Project Owner (Sara M. / Designated Lead) |
| **06** | **Creative Development** | Concept / 2D/3D (Phase 2) | Creative team interprets brief, develops concepts, experience direction, creative rationale. Project owner coordinates feedback. | Concept presentation deck, experience narrative, creative rationale, client review records. | **APPROVAL GATE**: Concept is formally approved by client, or feedback captured and revision round assigned. | Sama (Creative Lead) & Client |
| **07** | **Design Development** | Design / Technical (Phase 2) | Translate approved concept into visual, spatial, brand, technical outputs (2D & 3D in lockstep). Feedback consolidated by owner. | Approved design files, layouts, 3D renders, artwork, specifications, production-ready drawings. | **APPROVAL GATE**: Designs approved for production. Material changes after approval require formal Change Request. | Art Director / Nadine / Client |
| **08** | **Planning & Pre-Production** | Production Prep (Phase 3) | Check feasibility, gather supplier quotes, compare options, lock cost sheet, schedule procurement, quality checklists. | Locked/approved cost sheet, supplier POs/confirmations, production schedule, procurement plan, QC checklist. | **GATE RULE**: Production proceeds *only* when designs, budget, and client approvals are locked and confirmed. | Sara M. / Mai / Finance |
| **09** | **Production & Execution** | Fabrication (Phase 3) | Sourcing, fabrication, printing, purchasing, logistics, installation coordination. Project owner tracks production plan and actual costs. | Completed physical items, progress updates, quality checks, installation readiness, updated actual costs. | Issues logged with owner, impact, decision, resolution. Scope/budget variations require change approval. | Mai / Project Owner |
| **10** | **Delivery / Live Operations** | Live Operations (Phase 3) | Final output installation or live event management: setup, event-day ops, client walkthrough, handover, live troubleshooting. | Delivered project / event completion, client walkthrough signoff, incident log, outstanding punch list. | Live operations concluded; client signoff obtained; pending punch list documented. | Project Owner / Sara M. / Client |
| **11** | **Financial & Project Close** | Project Close (Phase 4) | Reconcile final scope and actual costs, collect outstanding client invoices, settle supplier bills, archive files, post-mortem. | Final reconciled revenue & cost, actual profit/margin, all invoices paid, project review report, photo archive. | **CLOSE GATE**: Project marked `Closed` *only* when delivery, documentation, and financial close-out criteria are satisfied. | Finance & Sara Dawoud |

---

### 3.2 State Machines and Status Logic

The specification mandates strict separation between **Pipeline Stage** (where the project sits along the 11 steps) and **Operational Statuses** across various entities:

```
Entity           Statuses
────────────────────────────────────────────────────────────────────────────────────
Lead             New · Contacted · Qualified · Proposal in progress · Won · Lost · On hold
Proposal         Draft · Internal review · Sent · Under discussion · Approved · Declined · Expired
Project          Not started · Planning · In progress · Waiting for client · At risk · On hold · Delivered · Closed
Task             To do · In progress · Waiting · In review · Approved · Done · Blocked
Deliverable      Draft · Internal review · Sent to client · Revision required · Approved · Final
Payment          Not invoiced · Invoiced · Partially paid · Paid · Overdue
```

#### Crucial Status Semantic Rules
- **Delivered vs. Closed**:
  - `Delivered`: The physical items are installed, the event has taken place, or outputs handed over to the client. Operational execution is complete.
  - `Closed`: Delivery is done, *plus* all final client payments collected, supplier invoices paid, actual profitability reconciled, files archived, and post-project review completed.
- **Proposal Won != Project In Progress**:
  - Winning a proposal transitions the lead/proposal, but project delivery tasks cannot be opened until Stage 04 confirmation criteria (contract/written approval, deposit, project record creation) are fulfilled.

---

## 4. Unit of Work & Products/Services Taxonomy

### 4.1 Project vs. Experience
In MakeHappn's operating model, the **Project** is the fundamental unit of work — **not** an "Event" or "Experience".
- An event or turnkey experience is only **one specific product** that MakeHappn sells.
- A project may consist of a single branding assignment, a spatial design package, or a full turnkey experience combining all services.
- Projects are identified by a **Unique Project Code** (e.g., `MH-2026-001`), Project Name, and Client.

### 4.2 Multi-Select Products & Services Taxonomy
Each project must support attaching **one or more** products from the 6 standard offerings:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MAKEHAPPN PRODUCTS & SERVICES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 01. Curation                                                                │
│     • Research and discovery       • Concept and experience curation        │
│     • Talent and partner sourcing  • Programming and activity curation      │
│     Typical Outputs: Concept note, experience narrative, programme, curated │
│                      talent or partner list.                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 02. Design / Design Development                                             │
│     • Creative direction           • Spatial and environmental design       │
│     • 2D and 3D design             • Technical design and layouts           │
│     Typical Outputs: Moodboards, design routes, layouts, 3D renders,        │
│                      artwork, technical drawings.                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 03. Brand Design                                                            │
│     • Brand strategy & positioning • Brand identity                         │
│     • Visual systems               • Brand applications                     │
│     Typical Outputs: Brand strategy inputs, logo system, typography, color  │
│                      palette, brand guidelines and applications.            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 04. Brand Communication                                                     │
│     • Brand messaging & story      • Content strategy                       │
│     • Campaign concepts            • Communication materials                │
│     Typical Outputs: Messaging framework, tone of voice, content direction, │
│                      campaign concepts, communication assets.               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 05. Production                                                              │
│     • Fabrication & manufacturing  • Printing and branding                  │
│     • Sourcing and procurement     • Installation and setup                 │
│     Typical Outputs: Supplier quotes, production schedule, material samples,│
│                      fabricated items, installed branding, completed setups.│
├─────────────────────────────────────────────────────────────────────────────┤
│ 06. Turnkey Experience                                                      │
│     • End-to-end experience dev    • Curation & creative direction          │
│     • Design and branding          • Production and execution               │
│     • On-ground management & delivery                                       │
│     Typical Outputs: Integrated scope, experience concept, design package,  │
│                      production plan, live delivery, final report.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Project Master Record Specification

The core project record connects all aspects of the studio's work (`MakeHappn [Dashboard].pdf` §12, `Makehappn [Dashboard 2].pdf` §5).

### 5.1 Comprehensive Field Inventory

```
PROJECT MASTER RECORD
├── 1. Identification & Metadata
│   ├── Project Code (String, unique, e.g. "MH-2026-042")
│   ├── Project Name (String, required)
│   ├── Selected Products (Multi-select Enum: [Curation, Design, BrandDesign, BrandCommunication, Production, TurnkeyExperience])
│   ├── Current Stage (Enum: Stages 01 to 11)
│   ├── Project Status (Enum: Not started, Planning, In progress, Waiting for client, At risk, On hold, Delivered, Closed)
│   └── Overall Health (Enum / Indicator: On track, Needs attention, At risk, Delayed)
├── 2. Client & Opportunity Context
│   ├── Client Name / Organization (Ref to Client entity)
│   ├── Main Contact (Name, title, email, phone)
│   ├── Decision-Makers (Contact list)
│   ├── Lead Source (Enum: Inquiry, Referral, Existing Client, Outreach, Social)
│   ├── Brief & Scope Description (Text / rich text)
│   ├── Objectives & Audience (Text)
│   ├── Location / Venue (Text)
│   └── Key Requirements & Constraints (Text)
├── 3. Team & Lane Accountability
│   ├── Project Owner / Lead (Ref to User, e.g., Sara M. or assigned lead)
│   ├── Creative Lead (Ref to User, e.g., Sama)
│   ├── Assigned Internal Team (Array of User refs, categorized by Lane: Vision & Design, Delivery, Communication)
│   └── Relationship Owner (Ref to User)
├── 4. Schedule & Milestones
│   ├── Start Date (Date)
│   ├── Target Delivery / Event Date (Date)
│   ├── Financial Close Date (Date)
│   ├── Key Milestones (Array of { Name, TargetDate, Status, Owner, GateType })
│   └── Review Rounds & Deadlines (Array of { DeliverableRef, ReviewDate, FeedbackDue })
├── 5. Commercial & Financials (Strict Tri-Partite Cost Model)
│   ├── Quoted Client Value (Currency amount)
│   ├── Approved Project Value / Contract Value (Currency amount)
│   ├── Payment Terms (Text / structured payment milestones)
│   ├── Deposit Status (Enum: Pending, Received, Waived)
│   ├── Estimated Internal Effort (Hours / cost)
│   ├── Estimated External Costs (Supplier/maker quotes)
│   ├── Contingency (Currency amount)
│   ├── Expected Gross Profit & Margin % (Calculated)
│   ├── Committed Supplier Costs (POs / confirmed contracts)
│   ├── Actual Expenses / Costs (Logged expenditures)
│   ├── Actual Gross Profit & Actual Margin % (Calculated: Approved Value - Actual Costs)
│   ├── Invoices (Array of { InvoiceNumber, Amount, IssueDate, DueDate, Status: Not invoiced|Invoiced|Partially paid|Paid|Overdue })
│   └── Outstanding Balance (Calculated: Invoiced vs. Collected)
├── 6. Deliverables & Creative Files
│   ├── Deliverable Items (Array of Deliverables: { Title, ProductType, Owner, Status, CurrentVersion, Approvals })
│   ├── Review History (Array of { Version, FeedbackSummary, ClientDecision, Timestamp })
│   └── Asset Repository / Links (Concept decks, 3D renders, CAD files, specs, final artwork)
├── 7. External Network (Collective Engagements)
│   ├── Linked Makers (Array of { MakerRef, Discipline, AssignedDeliverable, AgreedFee, Status })
│   └── Linked Partners (Array of { PartnerRef, Category: Venue|F&B|AV|Fabrication, AgreedCost, PO#, Status })
├── 8. Governance, Issues & Change Requests
│   ├── Change Requests (Array of { Id, Date, RequestedBy, Description, ImpactCost, ImpactTime, ApprovedBy, Status })
│   ├── Issues & Risks Log (Array of { Id, Description, Severity, Owner, Impact, Decision, Resolution, Status })
│   └── Decision Log / Audit Trail (Array of { Timestamp, DecidedBy, DecisionText, StageRef })
└── 9. Close-Out & Archival
    ├── Client Handover Signoff (Confirmation / Date)
    ├── Outstanding Items Punch List (Array of { Item, Owner, ResolutionDate })
    ├── Post-Mortem / Performance Review (Lessons learned, actual vs. estimate notes)
    ├── Case Study & Social Assets (Links to packaged documentation by Mariam)
    └── Financial Reconciliation Signoff (Finance approval, Date)
```

---

### 5.2 Financial Flow: The Tri-Partite Cost Model

The specification explicitly prohibits combining cost types into a single number:
> *"The dashboard should clearly distinguish estimated, committed and actual costs. These are different figures and should not be combined into one number."* (`MakeHappn [Dashboard].pdf` §9)

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ PROPOSAL STAGE  │ ──► │  CONFIRMATION    │ ──► │ DURING DELIVERY  │ ──► │  PROJECT CLOSE  │
├─────────────────┤     ├──────────────────┤     ├──────────────────┤     ├─────────────────┤
│ • Quoted Value  │     │ • Approved Value │     │ • Committed Costs│     │ • Final Invoiced│
│ • Est. Internal │     │ • Payment Milest.│     │   (POs/contracts)│     │   Revenue       │
│ • Est. External │     │ • Deposit Status │     │ • Actual Expenses│     │ • Collected Cash│
│ • Contingency   │     │ • Approved Budget│     │ • Approved Scope │     │ • Final Costs   │
│ • Expected GP   │     │                  │     │   Variations     │     │ • Actual Profit │
└─────────────────┘     └──────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## 6. Task Accountability, Deliverables & Governance

### 6.1 The Single-Owner Task Model
Shared responsibility has led to unclear execution. The specification establishes two fundamental rules:
1. **Single Accountable Owner**: Each task must have exactly **one accountable owner** (`MakeHappn [Dashboard].pdf` §4 stage 05, §14).
2. **Collaborators / Contributors**: Multiple team members can be attached as contributors/collaborators, but accountability never divides.

```
TASK RECORD
├── Task Title & Description
├── Accountable Owner (Single User Ref — strictly 1 person)
├── Collaborators (Array of User Refs — supporting contributors)
├── Associated Project (Ref to Project)
├── Associated Stage / Deliverable (Ref to Stage 01–11 or Deliverable)
├── Priority (Enum: Urgent, High, Medium, Low)
├── Due Date (Date, required)
├── Status (Enum: To do · In progress · Waiting · In review · Approved · Done · Blocked)
├── Dependencies (Array of Preceding Task IDs)
├── Comments & Workload Hours
└── Blocked Reason (Text, required if status == Blocked)
```

### 6.2 Deliverable vs. Task Distinction
A deliverable is not just a checkbox; it is a client- or production-facing artifact with its own lifecycle:

```
Draft ──► Internal Review ──► Sent to Client ──► Approved ──► Final
                                   │
                                   ▼
                           Revision Required
```

### 6.3 Change Requests vs. Feedback vs. Revisions
The dashboard must distinguish between normal creative iterations and scope/commercial modifications:
- **Feedback**: Comments or requested refinements to a deliverable that remain within the agreed scope.
- **Revision**: A defined, budgeted round of updates to a concept, design, or deliverable.
- **Scope Change**: A new requirement, additional deliverable, or significant direction change beyond the approved scope.
- **Approval**: A recorded client or internal decision allowing the next stage to proceed.
- **Change Request**: A formal record documenting:
  1. What changed
  2. Why it changed
  3. Who approved it
  4. Impact on financial cost
  5. Impact on timeline / delivery date
- **Core Governance Rule**: *"No material scope, cost or timeline change should be treated as approved until the decision and its impact are recorded."*

---

## 7. Studio Modules & Management Perspectives

### 7.1 The 9 Dashboard Modules (`MakeHappn [Dashboard].pdf` §10)

| Module | Core Purpose | Primary Entities & Connections | Key Screens / Views |
|---|---|---|---|
| **1. Overview** | Executive command center | Company KPIs, sales pipeline totals, active project cards, upcoming deadlines, overdue alerts, payment alerts, workload heatmaps. | Management Dashboard, KPI cards, Exception alerts. |
| **2. Sales** | Business development & CRM | Leads, clients, contacts, deal values, lead owners, follow-up dates, proposals, conversion win/loss rates. | Pipeline Kanban, Lead lists, Proposal tracker. |
| **3. Projects** | Central project operating hub | Project master records, product tags, stage progression (1-11), health indicators, milestone timelines, attached deliverables, linked financials. | Project Grid/List, Project Detail Hub, Stage Progress bar. |
| **4. Tasks & Team** | Operational execution & capacity | Internal tasks, single accountable owners, collaborators, due dates, statuses, dependencies, workload by person/lane. | Task Kanban, My Tasks, Team Workload Heatmap, Gantt/Timeline. |
| **5. Creative & Design** | Creative asset pipeline | Client briefs, concept decks, 2D/3D deliverables, version history, feedback rounds, client signoffs. | Deliverable gallery, Version review drawer, Approval log. |
| **6. Production & Procurement** | Fabrication & vendor control | Supplier quotes, POs, selected makers/partners, production tasks, fabrication schedules, quality control checklists, site delivery status. | Procurement board, Supplier cost sheets, QC checklist. |
| **7. Collective / Resources** | Central talent & partner directory | Internal staff roster (by lane), Collective Makers (artists, fabricators), Collective Partners (venues, F&B, AV), capabilities, rates, historical project ratings. | Collective Directory, Profile drawer, Engagement history. |
| **8. Finance** | Commercial controls & cashflow | Proposal values, approved budgets, tri-partite cost tracking (estimated vs committed vs actual), payment milestones, invoice tracking, margins. | Financial summary, Invoice schedule, Margin analyzer. |
| **9. Reports** | Studio analytics & intelligence | Revenue by product/client/period, estimate vs actual variances, delivery timeline performance, team capacity utilization, pipeline conversion health. | Profitability reports, Utilization charts, Sales metrics. |

### 7.2 The 4 Management Perspective Views (`MakeHappn [Dashboard].pdf` §13)

| View | Key Questions Answered | Target Audience |
|---|---|---|
| **Business View** | How much business is in the pipeline? What has been won? What revenue is expected? Which products and clients generate the most revenue? | Founder / MD (Sara Dawoud), Sales |
| **Project View** | What stage is each project in? What milestone is due next? Which projects are delayed, waiting for approval, or at risk? Are projects within budget? | Project & Delivery Lead (Sara M.), Project Owners |
| **Team View** | Who owns each project and task? What is overdue? Where is workload concentrated? Who is blocked or waiting for input? | Department Leads, Project Owners |
| **Financial View** | What has been quoted, approved, committed, spent, invoiced, and collected? What is the expected vs actual project profit? | Finance & Legal, Sara Dawoud |

---

## 8. Document Discrepancy Matrix & Reconciliation

A critical duty of the specification miner is uncovering tensions, contradictions, and naming evolutions between the documents so the development team does not build conflicting assumptions.

| # | Discrepancy Area | `MakeHappn [Dashboard].pdf` | `Makehappn [Dashboard 2].pdf` | `MH [WORKFLOW & OPERATING STRUCTURE].pdf` | Resolution & Authoritative Recommendation |
|---|---|---|---|---|---|
| **D1** | **Art Director Identity & Role** | Not named individually; refers to "Design" and "Creative" functions. | Not named individually; lists functions. | **Page 1 (Workflow)** names **"Sohila: Art direction & spatial/3D design"** with arrow to Hamdy.<br>**Page 2 (Org Structure)** labels the exact same box **"Art Director / Senior 3D Designer [NEW HIRE]"**. | **Reconciliation**: Sohila is the named individual occupying or defining the role, while the organization is recruiting or formalizing the `Art Director / Senior 3D Designer` position. The data model must support the formal role title `Art Director / Senior 3D Designer`, with initial incumbent `Sohila` or marked as an open/transitional seat. |
| **D2** | **Project Lifecycle: 11 Stages vs 10 Stages vs 4 Phases** | **11 Stages explicitly listed** with full expected inputs, outputs, gate rules, and statuses (01 Lead through 11 Financial & Project Close). Includes **Stage 05: Kick-off & Project Planning**. | **10 Stages listed**. Completely omits Kick-off & Planning (jumps from 04 Confirmation to 05 Creative Dev). Combines/renames close-out to "Closing & Evaluation". | **4 Macro Phases**: 01 Client & Creative Brief, 02 Design Development, 03 Delivery & Production, 04 Communication. | **Reconciliation**: `MakeHappn [Dashboard].pdf` is the master 9-page development brief and is **authoritative**. The 11-stage pipeline is mandatory for project tracking. The 4 phases in the workflow deck represent macro groupings for lane handoffs. Dashboard 2 is an abbreviated summary that mistakenly condensed planning into confirmation. |
| **D3** | **Stage Naming Nuances** | • 02: Qualification & Discovery<br>• 09: Production & Execution<br>• 10: Delivery / Live Operations<br>• 11: Financial & Project Close | • 02: Discovery & Briefing<br>• 08: Production & Execution<br>• 09: Delivery / Event Day<br>• 10: Closing & Evaluation | • 01: Client & Creative Brief<br>• 02: Design Development<br>• 03: Delivery & Production<br>• 04: Communication | **Reconciliation**: Adopt the full descriptive names from Dashboard 1 (`01 Lead / Inquiry`, `02 Qualification & Discovery`, `03 Scope, Proposal & Quotation`, `04 Project Confirmation & Handover`, `05 Kick-off & Project Planning`, `06 Creative Development`, `07 Design Development`, `08 Planning & Pre-Production`, `09 Production & Execution`, `10 Delivery / Live Operations`, `11 Financial & Project Close`). |
| **D4** | **Number of System Modules** | Table in §10 defines **9 module rows**: Overview, Sales, Projects, Tasks & Team, Creative & Design, Production & Procurement, Collective / Resources, Finance, Reports. | Mentions business functions, does not enumerate modules. | Emphasizes 3 lane functions + Founder/MD. | **Reconciliation**: The system requires **9 modules** (or 8 modules if Tasks & Team is integrated into Projects). Given that §13 defines a dedicated "Team View" and §10 gives Tasks & Team its own row, a dedicated Tasks/Team capability is required. |
| **D5** | **Missing Section 6 in Dashboard 2** | Section 6 is present: "Parallel Workstreams & Dependencies". Section 7 is "Project Changes, Feedback & Approvals". | Section numbering jumps directly from **Section 5 (Core Project Information)** to **Section 7 (Core Dashboard Principle)**; Section 6 is omitted entirely. | N/A | **Reconciliation**: Pure typographical/editing error in Dashboard 2 during document preparation. Dashboard 1 is complete and includes the missing dependency logic. |
| **D6** | **Product Name: "Design" vs "Design Development"** | Section 3 Product list calls it **"Design"**. | Section 3 Product list calls it **"02. Design Development"**. | Workflow calls Stage 02 **"Design Development"**. | **Reconciliation**: Both refer to the identical scope (Spatial, 2D, 3D, and technical layouts). "Design Development" is preferred for precision, or "Design" as a top-level category with Design Development as the service deliverable. |
| **D7** | **Communication: Standalone Stage vs Parallel Function** | §2: "May run as a standalone product or alongside brand design and experiences." §6: "Marketing / content can run alongside design and production." | Listed as Product 04 "Brand Communication". | Box 04 in workflow, but footnote states: *"Mariam documents throughout every stage in parallel — Communication is where that work is packaged and shared externally, not the only point she's involved"*. | **Reconciliation**: System must treat Communication as **both** a billable product (Brand Communication) **and** an ongoing cross-cutting internal operational workflow that runs across all stages 01 through 11. |
| **D8** | **Reporting Line: Mariam to Nadine** | Does not specify individual reporting lines. | Does not specify individual reporting lines. | Workflow Page 1 explicitly states: *"Mariam ... reports to Nadine"*. Org structure shows Mariam under Communication lane while Nadine is under Vision & Design. | **Reconciliation**: Administrative / creative supervision of social content flows from Nadine (Senior Graphic Designer), while Mariam's operational work spans all projects and lanes. |

---

## 9. Features Discovered Table

Per the Specification Miner instructions, all features identified through probing the authoritative specification sources are cataloged below:

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| **F01** | Architecture / Domain | Project as Primary Entity | Fundamental unit of work is a Project with unique code, representing client engagement across 1 or more products. | Project Name, Unique Code, Client, Selected Products | Initialized Project Record | Reject creation without unique code or at least 1 product | Dashboard 1 §3, §12; Dashboard 2 §3, §5 |
| **F02** | Products / Catalog | Multi-Select Products | Capability to attach any combination of the 6 studio products (Curation, Design, Brand Design, Brand Communication, Production, Turnkey Experience) to a project. | Product selection checkboxes / multi-select | Attached product scopes & templates | Cannot save project with empty product selection | Dashboard 1 §3; Dashboard 2 §3 |
| **F03** | Org / Permissions | 3 Connected Lanes | Organizational structure divided into Vision & Design, Project & Delivery, and Communication lanes, plus Executive. | User profile, primary lane assignment, supervisory role | Lane-based views, badge display, routing | Prevent invalid lane assignment | Workflow PDF p.1-2 |
| **F04** | Org / Leadership | Dynamic Project Owner | Assigning a single internal team member as Project Owner who coordinates work across all lanes. | Project Owner User ID | Project lead permissions, notification routing | Warning if Project Owner is unassigned | Dashboard 1 §2, §4, §5; Workflow PDF p.1 |
| **F05** | Org / Roles | Cross-Lane Supervision & Dotted Lines | Support for cross-lane reporting (Mariam in Communication reporting to Nadine in Vision & Design; Sara Dawoud art direction contribution; Sara M. concept bridge). | Supervisor ID, dotted-line collaborators | Multi-lane notifications, signoff routing | N/A (informational / routing) | Workflow PDF p.1-2 |
| **F06** | Lifecycle | 11-Stage Pipeline Progression | Linear or adaptable progression through 11 stages from 01 Lead/Inquiry to 11 Financial & Project Close. | Stage transition command, gate prerequisites | Updated stage, stage timestamp, audit log | Block transition if mandatory gate criteria are unsatisfied | Dashboard 1 §4 |
| **F07** | Lifecycle Gates | Gate 04: Project Confirmation | Hard gate blocking delivery tasks from opening until contract/written approval and deposit milestone are recorded. | Proposal approval record, contract upload, deposit status | Project activated, delivery workstreams unlocked | Throw error/alert if user attempts to create delivery tasks on unconfirmed project | Dashboard 1 §4 (Stage 04) |
| **F08** | Lifecycle Gates | Gate 06: Creative Concept Approval | Client approval of creative concept deck before design development proceeds. | Concept presentation asset, client approval decision | Stage 06 marked approved, Stage 07 unlocked | Assign revision round if client requests changes | Dashboard 1 §4 (Stage 06) |
| **F09** | Lifecycle Gates | Gate 07: Design Signoff | Approval of production-ready 2D/3D designs before pre-production and purchasing lock. | Design asset package, client signoff | Stage 07 approved, Stage 08 procurement unlocked | Changes after signoff require formal Change Request | Dashboard 1 §4 (Stage 07) |
| **F10** | Lifecycle Gates | Gate 08: Pre-Production Cost Lock | Budget, supplier quotations, and cost sheet locked before physical fabrication commences. | Locked cost sheet, confirmed supplier quotes | Production authorization | Block production execution if cost sheet is unlocked or quotes missing | Dashboard 1 §4 (Stage 08) |
| **F11** | Lifecycle Gates | Gate 11: Financial & Project Close | Verification that delivery is complete, all invoices collected, all supplier bills paid, files archived. | Signoffs for delivery, finance, and archival | Project Status set to `Closed` | Prevent `Closed` status if invoices/bills pending | Dashboard 1 §4 (Stage 11), §11 |
| **F12** | State Machines | Multi-Entity Status Logic | Discrete status lifecycles for Lead, Proposal, Project, Task, Deliverable, and Payment. | Status update trigger per entity | State transition, status history | Prevent illegal state jumps (e.g. Draft -> Final without review) | Dashboard 1 §11 |
| **F13** | Task Model | Single Accountable Owner | Every internal task has strictly one accountable owner responsible for deadline and completion. | Task title, 1 Accountable User ID, Due Date | Task record with clear owner | Validation error if task has 0 or >1 accountable owner | Dashboard 1 §4 (Stage 05), §14 |
| **F14** | Task Model | Task Collaborators / Contributors | Multiple supporting team members attached to a task without diluting the primary owner's accountability. | Array of Collaborator User IDs | Collaborator list, assigned to task feed | N/A | Dashboard 1 §10 |
| **F15** | Task Model | Task Dependencies & Workstreams | Explicit dependency links between tasks/milestones allowing parallel workstreams with blocking gates. | Predecessor Task IDs | Dependency DAG, blocked status flags | Prevent completing dependent task if predecessor is incomplete | Dashboard 1 §6 |
| **F16** | Deliverables | Deliverable Lifecycle & Versioning | Tracking creative artifacts through Draft, Internal Review, Client Review, Revision, Approved, Final. | File upload, version notes, status change | Versioned asset, approval history | Prevent marking Final without required approval | Dashboard 1 §7, §10, §11 |
| **F17** | Governance | Change Request Management | Formal record for out-of-scope changes documenting what, why, who approved, cost impact, and timeline impact. | Description, reason, approver ID, delta cost, delta days | Logged Change Request, revised project financials | Flag material changes executed without change record | Dashboard 1 §7 |
| **F18** | Governance | Issue & Risk Tracking | Logging issues with owner, severity, impact, decision, and resolution. | Issue title, owner, severity, impact | Issue ticket attached to project | Alert if open high-severity issue on live delivery | Dashboard 1 §4 (Stage 09), §12 |
| **F19** | Financials | Tri-Partite Cost Architecture | Separate, unmerged tracking of Estimated Costs, Committed Costs (POs), and Actual Costs (Invoices/Receipts). | Budget estimates, supplier POs, actual expense receipts | Independent cost columns, variance calculation | Block combining these three into a single mashed figure | Dashboard 1 §9, §14 |
| **F20** | Financials | Payment Milestone & Invoice Tracker | Tracking payment milestones, invoice generation, partial payments, and overdue alerts. | Milestone trigger, invoice number, payment date | Invoicing schedule, cashflow alert | Trigger alert if payment is overdue | Dashboard 1 §9, §10, §11 |
| **F21** | Collective | Makers & Partners Directory | Central database of external creative talent (Makers) and business suppliers (Partners) linked to projects. | Contact details, specialism, category, location, rates | Collective profile, historical engagement records | Warn if engaging partner with inactive status | Dashboard 1 §8; Dashboard 2 §5 |
| **F22** | Collective | Engagement Fee Tracking | Recording the exact role, agreed fee, and PO status for each external maker/partner on a project. | Project ID, Collective ID, role, agreed fee | Linked project commitment in financial model | Warn if committed fee exceeds allocated budget line | Dashboard 1 §8, §9 |
| **F23** | Views | 4 Management Perspectives | Dedicated role-based perspectives: Business View, Project View, Team View, Financial View. | User session / perspective selector | Customized dashboards answering specific management questions | Filter unauthorized financial data from unauthorized roles | Dashboard 1 §13 |
| **F24** | Overview | Studio Health & Exception Alerts | Top-level summary highlighting overdue tasks, projects at risk, unapproved changes, cashflow alerts. | Studio dataset aggregation | Exception warning feed, KPI summaries | Visual red/amber indicators on threshold breaches | Dashboard 1 §10, §14 |

---

## 10. Edge Cases & Boundary Behaviors

| # | Feature | Input Condition / Scenario | Documented / Specified Behavior | Source Citation |
|---|---|---|---|---|
| **E01** | Stage Skipping | Small brand design job that does not require event production or on-site delivery. | System must be **configurable**; project owners must be able to adapt stages and tasks to project scope rather than forcing every project through an identical rigid checklist. Non-applicable stages (e.g. Stage 09/10) can be bypassed. | Dashboard 1 §4, §14 |
| **E02** | Unconfirmed Project Execution | Team member attempts to create production or delivery tasks for a client whose proposal is still under discussion. | Strict restriction: *"Do not treat an unapproved proposal as an active delivery project. Record confirmation before opening delivery tasks."* Stage 04 must be completed first. | Dashboard 1 §4 (Stage 04) |
| **E03** | Cost Data Merging | Developer attempts to store a single "total cost" field aggregating estimates and actuals. | Strict violation: *"The dashboard should clearly distinguish estimated, committed and actual costs. These are different figures and should not be combined into one number."* | Dashboard 1 §9, §14 |
| **E04** | Client Rejection of Concept | Client rejects creative concept during Stage 06 review. | System captures feedback and automatically schedules another revision round (`Revision required`). Project does not proceed to Stage 07 until concept approval is secured. | Dashboard 1 §4 (Stage 06), §7 |
| **E05** | Material Scope Change Mid-Production | Client requests an extra spatial installation during Stage 09 fabrication. | Must NOT be treated as a simple task comment. Requires formal Change Request documenting what changed, why, who approved it, cost impact, and timeline impact before proceeding. | Dashboard 1 §7 |
| **E06** | Project Delivery vs Project Close | Event has concluded successfully, but supplier invoices and final client payment are pending. | Project status is set to `Delivered`, NOT `Closed`. Project can only transition to `Closed` when delivery, documentation, and all financial close-out requirements are satisfied. | Dashboard 1 §4 (Stage 11), §11 |
| **E07** | Shared Responsibility on Tasks | Task created with 3 assignees and no clear lead. | System policy violation: *"Each project and task must have a clear owner; shared responsibility should not mean unclear accountability."* Exactly one person must be designated as Accountable Owner; others are Collaborators. | Dashboard 1 §4 (Stage 05), §14 |
| **E08** | Parallel Workstream Sourcing | Sourcing long-lead materials while creative concept is still being finalized. | Supported: Long-lead sourcing and preliminary feasibility can run alongside creative development, but costs cannot be locked until design specs are confirmed. | Dashboard 1 §6 |
| **E09** | Mariam's Cross-Stage Documentation | Creating communication tasks during Stage 01 or Stage 06. | Valid and expected: Mariam documents throughout every stage in parallel. Communication is where content is packaged externally, but documentation is gathered continuously. | Workflow PDF p.1-2 |
| **E10** | Sole Trader / Freelancer vs Business Partner | Adding an individual photographer vs adding a catering company to a project. | Categorized into Collective Makers (individual artists/freelancers) vs Collective Partners (businesses/venues/suppliers). Both link with agreed fee, role, and PO. | Dashboard 1 §8 |

---

## 11. Recommendations for Codebase Reconciliation

1. **Retire or Re-architect the `Event` Model**:
   - `src/models/Event.ts` represents a calendar booking, not MakeHappn's unit of work. It must be replaced or superseded by a comprehensive `Project` model containing the fields detailed in Section 5.1.
2. **Implement Multi-Select Products**:
   - Replace the single `typeId` relation with a multi-select array of the 6 canonical studio products (`Curation`, `Design`, `Brand Design`, `Brand Communication`, `Production`, `Turnkey Experience`).
3. **Replace Calendar Categories with the 11-Stage Pipeline**:
   - Replace simplistic `Live / Upcoming / Wrapped` calendar filters with the 11-stage pipeline and the 8 operational project statuses.
4. **Restructure Permissions & Roles by Lane**:
   - Upgrade generic `owner / leader / member` roles in `src/lib/domain.ts` and `src/lib/permissions.ts` to recognize the 3 operational lanes (`Vision & Design`, `Project & Delivery`, `Communication`), executive leadership, and project-level owner/collaborator roles.
5. **Establish the Tri-Partite Financial Engine**:
   - Build explicit schemas for Estimated Costs, Committed Costs, and Actual Expenses, with support for Invoices and Change Requests.
