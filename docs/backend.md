# MakeHappen backend data

Schema reference for the Express API. Models live in `api/src/models`. MongoDB is opened only by that process.

A line in the diagrams is an ObjectId with a Mongoose `ref`. An embedded block is stored inside its parent and has no collection of its own. Examples: client contacts, proposal lines, deliverable versions and reviews, project milestones, the closeout checklist, workstreams, asset links, the quality checklist, and cost-sheet lines.

`committedTotalCost` and `actualTotalCost` on a project are written by the API after it recalculates them. Committed cost is the unbilled remainder of purchase orders that are not cancelled. Actual cost is the sum of supplier bills and expenses. They are not typed in by hand.

## People and sales

```mermaid
erDiagram
  Team ||--o| User : leader
  Team ||--o{ User : primaryTeam
  Team }o--o{ User : lanes
  User ||--o{ User : reportsTo
  User ||--o{ Client : relationshipOwner
  User ||--o{ Lead : owner
  Lead ||--o{ Proposal : proposals
  Lead |o--o| Project : convertedProject
  Lead ||--o{ FollowUp : followUps
  Client ||--o{ FollowUp : followUps
  Client ||--o{ Project : client
```

| Collection | Model | Parent | What matters |
|---|---|---|---|
| Team | `Team.ts` | — | Unique `name`. Optional `leaderId`. |
| User | `User.ts` | Team | Unique `email`. `role` is `owner`, `leader`, or `member`. `functionalRoles` come from the studio role list. `teamId` is the primary lane. `laneIds` is every lane the person sits on. `reportsToId` is the manager. `isVacant` marks an open seat. Employees can update their phone, short bio, and optional JPG/PNG/WebP profile image (up to 256 KB) from `/profile`; images are stored with the user record and shown in people and project team lists. |
| Client | `Client.ts` | User, optional | Embedded `contacts` (name, email, phone, primary flag). `status` is `lead`, `active`, or `inactive`. `paymentTermsDays`. Optional `relationshipOwnerId`. |
| Lead | `Lead.ts` | User | `stage` is `inquiry`, `contacted`, `discovery`, `proposal`, `on_hold`, `won`, or `lost`. Products, currency, estimated value, source, next action, follow-up date, and discovery notes. `convertedProjectId` is set when an approved proposal is confirmed. |
| Proposal | `StudioOps.ts` | Lead | `status` is `draft`, `internal_review`, `sent`, `under_discussion`, `approved`, `declined`, or `expired`. Scope in and out, assumptions, timeline, payment terms, finance margin check, and quotation `lines` are embedded. |
| FollowUp | `StudioOps.ts` | Lead or Client | Title, date, notes, and `done`. Either link may be empty. |
| Inquiry | `Inquiry.ts` | User, Project | Intake brief: brand, project, client name and contact, one product, scope, delivery date, budget, location, notes. `status` is `pending`, `approved`, `declined`, or `converted`. Holds the reporter (`submittedById`), optional scheduled call, assigned `projectLeadIds`, `declineReason`, and `convertedProjectId`. |

An inquiry must be approved or declined within one working day (Friday and Saturday are the weekend); past that, a pending inquiry is flagged as needing attention. Declining requires a reason and emails the reporter when SMTP is configured. Approving requires at least one project lead. Converting an approved inquiry creates the client if needed and a project at the first stage, led by the first assigned lead with the rest as team members. Inquiries record where they came from (`source`: social media, referral, existing client, or website). The review page has one "Start Project Planning" button that approves the inquiry with its project leads and creates the project in one step, and one "Send apology to the client" button that declines it with a reason. Only owners and executives review inquiries. On approval, every assigned project lead and the submitter get an email with a "Start project Planning" button; on decline the submitter gets an email with the reason and a "Send apology to the client" button (when SMTP is configured).

Confirming a project requires a proposal whose status is `approved`. The lead then points at the new project and its stage becomes `won`. Client matching on conversion uses company name and contact email together.

## Project delivery

```mermaid
erDiagram
  Project ||--o{ Task : tasks
  Team ||--o{ Task : lane
  User ||--o{ Task : accountableOwner
  User }o--o{ Task : collaborators
  Task ||--o{ Task : dependsOn
  Task ||--o{ Task : mustBeReadyBefore
  Task ||--o{ Comment : comments
  User ||--o{ Comment : author
  Project ||--o{ Deliverable : deliverables
  Deliverable |o--o| ChangeRequest : revisionLimit
  Project ||--o{ ChangeRequest : changes
  User ||--o{ ChangeRequest : approver
  Project ||--o{ RiskIssue : risks
  User ||--o{ RiskIssue : owner
  Project ||--o{ Activity : decisions
  Task |o--o{ Activity : taskHistory
  User ||--o{ Activity : actor
  User ||--o{ Project : projectLead
  User |o--o{ Project : creativeLead
  User }o--o{ Project : team
```

| Collection | Model | Parent | What matters |
|---|---|---|---|
| Project | `Project.ts` | Client, User | Unique `code` (`MH-YYYY-NNN`). `stage` is one of the 11 studio stages. `bypassedStages` cannot include stages 01–05 or 11. `status` is `not_started`, `planning`, `in_progress`, `waiting_for_client`, `at_risk`, `on_hold`, `delivered`, or `closed`. `health` is `on_track`, `at_risk`, or `blocked`. Money fields: quoted value, approved contract value, estimated cost, contingency, internal hours, external cost estimate, revision fees, and `fxRateToBase`. `depositReceived`, `budgetApproved`, and `confirmationNotes` are the stage 04 gate. Milestones, closeout, workstreams, asset links, and the quality checklist are embedded. `teamUserIds` is the flat project member list. The Team setup tab provides one ungrouped employee picker with each person's title and availability; team assignment is not required. The Project Board has one shared project section, and only project members can be selected as task owners or collaborators. Legacy `teamIds` and `teamAssignments` remain for existing records. `scopeItems` holds the scope chosen on the inquiry and edited on the setup page, and `creativeLeadId` is the creative lead. After inquiry approval, the assigned project lead configures the numbered project in exactly four setup tabs: Overview & Scope, Team, Timeline & Phases, and Deliverables. `setupPhases` stores optional duration, owner and deliverables for the six fixed setup phases; unused phases use duration 0 and no owner. `startDate`, `deliveryDate`, and `kickoffAt` store the project timeline and kick-off. The timeline counts Sunday–Thursday workdays. Users carry `availability` (`available`, `busy`, `in_meeting`, `out_of_office`, `on_leave`) with a short note, and update it from their own `/profile` page. |
| Task | `Task.ts` | Project, optional Team | `teamId` is optional for project-level tasks on the shared project board; legacy and event tasks retain their team. `status` is `backlog`, `todo`, `in_progress`, `waiting`, `in_review`, `approved`, `blocked`, or `done`. Priority is `urgent`, `high`, `medium`, or `low`. Category is `deliverable_prerequisite`, `continuous_support`, or `operational_internal`. `isGatePrerequisite` blocks a stage advance while the task is open. `dependsOnTaskIds` and `mustBeReadyBefore` point at other tasks. `workstreamKey` is `delivery` or `communication` when the API creates the parallel documentation tasks. |
| Comment | `Comment.ts` | Task | Author and body. |
| Deliverable | `Deliverable.ts` | Project | `status` is `draft`, `internal_review`, `sent_to_client`, `revision_required`, `approved`, or `final`. Versions and reviews are embedded. Only a review whose role is `client` sets `approved`. Other approvals set `internallyApproved`. `editedAfterApproval` is set when a new version is submitted after approval. |
| ChangeRequest | `ChangeRequest.ts` | Project | Unique `(projectId, code)`, shaped `CR-001`. Reason is `client_scope_addition`, `revision_limit_exceeded`, `site_condition`, or `budget_adjustment`. Status is `draft`, `submitted`, `client_approved`, or `client_rejected`. Stores the client approver name and evidence URL. Approval updates the contract value, estimated cost, and delivery date. |
| RiskIssue | `RiskIssue.ts` | Project | Severity is `critical`, `high`, `medium`, or `low`. Category is `timeline`, `budget`, `client_scope`, `fabrication_supplier`, `site_operations`, or `quality_craft`. Status is `open`, `mitigated`, or `resolved`. |
| Activity | `Activity.ts` | Project and optionally Task | `type` is `status`, `assignment`, `comment`, `edit`, or `decision`. `taskId` may be empty. Stage advances, owner overrides, and change-request approvals are `decision` rows. |

From the Deliverables setup tab, project leads can email all active project members (including the lead) a dashboard overview link. Kick-off scheduling opens a prefilled Google Calendar event with those members as guests; the organizer adds Google Meet and saves/sends the invitation in Calendar. Team notification email uses the API SMTP configuration.

Stage advance moves only to the next stage that is not in `bypassedStages`. Open gate-prerequisite tasks block it. Leaving stage 04 needs a deposit or written confirmation. Leaving stages 06, 07, and 08 needs an approved deliverable. Leaving stage 08 also needs `budgetApproved`. Closeout sets `closed` only when the checklist is complete and there are no unpaid invoices, open purchase orders, or unpaid supplier bills.

## Money and the network

```mermaid
erDiagram
  Project ||--o{ PurchaseOrder : orders
  CollectiveMember ||--o{ PurchaseOrder : supplier
  PurchaseOrder ||--o{ SupplierBill : bills
  Project ||--o{ SupplierQuote : quotes
  CollectiveMember ||--o{ SupplierQuote : quotedBy
  SupplierQuote |o--o| PurchaseOrder : selectedAs
  Project ||--o{ Invoice : invoices
  Project ||--o{ Expense : expenses
  Project ||--|| CostSheet : costSheet
  Project ||--o{ Engagement : engagements
  CollectiveMember ||--o{ Engagement : member
  User ||--o{ CollectiveMember : relationshipOwner
```

| Collection | Model | Parent | What matters |
|---|---|---|---|
| CollectiveMember | `CollectiveMember.ts` | User, optional | `type` is `maker`, `partner`, `contractor`, `supplier`, `venue`, `freelancer`, `brand_talent`, or `service_provider`. `status` is `active`, `vetted`, or `on_hold`. |
| PurchaseOrder | `PurchaseOrder.ts` | Project, CollectiveMember | Unique `poNumber`. `status` is `draft`, `issued`, `partially_billed`, `fully_billed`, or `cancelled`. `billedAmount` is the sum of bills recorded against it. |
| SupplierBill | `SupplierBill.ts` | PurchaseOrder | `status` is `received`, `approved`, or `paid`. `paidAt` is set when the bill is marked paid. |
| SupplierQuote | `Planning.ts` | Project, CollectiveMember | Compared before a purchase order exists. `selected` and `purchaseOrderId` are set when the quote is chosen. |
| Invoice | `Invoice.ts` | Project | Unique `(projectId, invoiceNumber)`. `status` is `not_invoiced`, `invoiced`, `partially_paid`, `paid`, or `overdue`. `amountPaid` supports a partial payment. `isDeposit` marks the stage 04 deposit. A planned milestone is an invoice left at `not_invoiced`. |
| Expense | `StudioOps.ts` | Project, optional | Category, description, amount, and date. Included in actual cost. This is spend that has no purchase order. |
| CostSheet | `Planning.ts` | Project | One document per project (`projectId` is unique). Embedded lines with estimated, committed, and actual amounts. `locked` rejects later edits. |
| Engagement | `Planning.ts` | Project, CollectiveMember | Role, agreed fee, and `status` of `proposed`, `confirmed`, or `complete`. Past work for a member is a query on this collection. |
| ProjectTemplate | `Planning.ts` | — | Product, default skipped stages, and embedded task and deliverable presets. Applying a template copies those onto a project. The template is not linked afterward. |

Currencies are `USD`, `AED`, `SAR`, and `EGP`. Reports keep each currency in its own total. `fxRateToBase` on the project is the rate captured for a base-currency figure. Amounts in different currencies are not added together.

## Studio operations

These collections are not on the project spine. They live in `StudioOps.ts` except where noted.

| Collection | Hangs from | What matters |
|---|---|---|
| QuarterlyGoal | User, optional | Year, quarter, title, target, and progress. |
| SalesTarget | — | Label, year, quarter, and amount. |
| MarketingItem | — | `kind` is `calendar`, `content`, `campaign`, `case_study`, `asset`, `pr`, or `website`. |
| LeaveRequest | User | Start, end, reason. `status` is `requested`, `approved`, or `declined`. |
| PerformanceReview | User | Period, notes, and a rating from 1 to 5. |
| ProductionUpdate | Project | `area` is `fabrication`, `installation`, or `handover`, plus a percent complete. |
| FounderDecision | — | `status` is `open` or `decided`, with an outcome. |

## Retired collections

`Event` and `EventType` remain in `api/src/models/Event.ts` and `api/src/models/EventType.ts` so old documents still validate. The product no longer has event screens. Tasks and activity rows may still carry an `eventId` from that period. New work is stored on projects.

```mermaid
erDiagram
  EventType ||--o{ Event : type
  Team ||--o{ Event : assignedTeams
  Event ||--o{ Task : legacyTasks
  Event ||--o{ Activity : legacyActivity
```

| Collection | Model | What matters |
|---|---|---|
| EventType | `EventType.ts` | Unique `name`. |
| Event | `Event.ts` | Name, start, end, `typeId`, `teamIds`, and `notifiedTeamIds`. |
