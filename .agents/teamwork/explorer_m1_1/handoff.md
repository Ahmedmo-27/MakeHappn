# Handoff Report — Current Codebase Architectural Exploration

**Agent**: `explorer_m1_1` (Teamwork Explorer & Codebase Analyst)  
**Parent Conversation ID**: `34593234-ea43-4bf6-a9d9-84b1e8a9a80c`  
**Working Directory**: `d:\Work\MakeHappen\.agents\teamwork\explorer_m1_1\`  
**Target Milestone**: M1 (Survey & Mining)  
**Status**: Hard Handoff (Investigation Complete)  
**Detailed Analysis**: `d:\Work\MakeHappen\.agents\teamwork\explorer_m1_1\analysis.md`

---

## 1. Observation

Direct, read-only inspection of the codebase in `d:\Work\MakeHappen\src\` and `scripts/` yielded the following concrete, verbatim observations:

### 1.1 Unit of Work & Event Modeling
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
  Only 7 custom fields exist. `typeId` references a single `EventType` foreign key.
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
  Seeds `EVENT_TYPES = ["Brand experience", "Pop-up", "Installation", "Space", "Corporate", "Wedding", "Conference", "Private", "Exhibition"]`.
- **`src/components/event-form.tsx:25-30`**:
  Renders a single `<select name="typeId">`, preventing multi-selection of products.
- **Absence of Project Identifiers**: No `projectCode` field exists anywhere in `Event.ts`, `domain.ts`, or `events.ts`.

### 1.2 Stages vs Calendar Progression
- **`src/app/(app)/dashboard/page.tsx:14-18, 109-111`**:
  ```typescript
  const PHASES: { id: ExperiencePhase; title: string; hint: string }[] = [
    { id: "live", title: "Live", hint: "Today sits inside these dates." },
    { id: "upcoming", title: "Upcoming", hint: "These start later." },
    { id: "wrapped", title: "Wrapped", hint: "The end date has passed." },
  ];
  ```
  Dashboard groups events exclusively by `experiencePhase(event.start, event.end)`.
- **`src/lib/format.ts:46-56`**:
  ```typescript
  export function experiencePhase(start: Date | string, end: Date | string, today = utcToday()): ExperiencePhase {
    const startDate = typeof start === "string" ? new Date(start) : start;
    const endDate = typeof end === "string" ? new Date(end) : end;
    if (today.getTime() < startDate.getTime()) return "upcoming";
    if (today.getTime() > endDate.getTime()) return "wrapped";
    return "live";
  }
  ```
  Project phase is purely a dynamic calculation against the UTC clock. Zero stage fields exist in the database.

### 1.3 Org Chart, Teams & Permissions
- **`src/lib/domain.ts:1-2`**:
  ```typescript
  export const ROLES = ["owner", "leader", "member"] as const;
  export type Role = (typeof ROLES)[number];
  ```
- **`src/models/User.ts:9-10, 20-21`**:
  ```typescript
  role: { type: String, required: true, enum: ["owner", "leader", "member"] },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  ```
  `teamId` is a single scalar ObjectId. A user cannot belong to multiple teams/lanes.
- **`src/models/Team.ts:3-9, 14`**:
  ```typescript
  name: { type: String, required: true, trim: true, unique: true },
  leaderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  ```
  Teams support at most one single leader.
- **`src/services/org.ts:194-196`**:
  ```typescript
  if (team.leaderId && !sameId(team.leaderId, user._id)) {
    await User.updateOne({ _id: team.leaderId }, { $set: { role: "member" } });
  }
  ```
  Promoting a new team leader automatically demotes the existing leader to member.
- **`src/lib/permissions.ts:40-43`**:
  ```typescript
  export function canCommentOnTask(user: SessionUser, taskTeamId: string, eventTeamIds: string[]): boolean {
    if (!canViewEvent(user, eventTeamIds)) return false;
    if (user.role === "owner") return true;
    return user.teamId === taskTeamId;
  }
  ```
  Users cannot comment on tasks assigned to another team on the exact same event.

### 1.4 Task Model & Accountability
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
  Tasks have only a single `assigneeId`, no collaborators, no RACI owner distinction, no deliverable attachment, no stage association.
- **`src/services/tasks.ts:134`**:
  ```typescript
  if (input.actor.role !== "owner") throw new Error("Only the owner can add backlog tasks");
  ```
  Only the owner can create tasks on the backlog.
- **`src/services/tasks.ts:30-35, 321`**:
  Moving task status requires entering a mandatory non-empty text reason.

### 1.5 Module Inventory & Navigation
- **`src/components/rail.tsx:9-14`**:
  ```typescript
  const links = [
    { href: "/dashboard", label: "Dashboard", ownerOnly: false },
    { href: "/people", label: "People", ownerOnly: true },
    { href: "/teams", label: "Teams", ownerOnly: true },
    { href: "/event-types", label: "Experience types", ownerOnly: true },
  ];
  ```
  Non-owners see only 1 navigation link (Dashboard); owners see 4 links.
- **`src/components/event-tabs.tsx:8-12`**:
  Tabs within an event are strictly `Backlog`, `Board`, and `Performance`.
- **`src/app/(app)/events/[id]/page.tsx:14`**:
  Unconditionally executes `redirect('/events/${id}/backlog')`.
- **Missing route**: `/events` has no `page.tsx` and returns 404.

---

## 2. Logic Chain

1. **Unit of Work Invalidation**:
   - *Observation*: `src/models/Event.ts:18` uses a single scalar `typeId`, and `scripts/seed.ts:9-19` populates it with event categories like "Pop-up" or "Wedding".
   - *Observation*: `MakeHappn [Dashboard].pdf` §1 & §3 defines MakeHappn as a multidisciplinary creative studio delivering *Projects* that combine multiple *Products* (Curation, Design, Brand Design, Brand Communication, Production, Turnkey Experience).
   - *Inference*: The codebase's core entity represents a single calendar event rather than a commercial agency project with multi-product capabilities.

2. **Stage Progression Decoupled from Work**:
   - *Observation*: `src/app/(app)/dashboard/page.tsx:109-111` and `src/lib/format.ts:46-56` calculate "Live", "Upcoming", and "Wrapped" strictly by comparing `event.start` and `event.end` with `utcToday()`.
   - *Observation*: `MakeHappn [Dashboard].pdf` §4 and §11 establish an 11-stage workflow with explicit gating criteria (e.g. Stage 04 blocks task creation without contract/deposit; Stage 08 requires budget lock before production) and discrete project statuses (Planning, In progress, Delivered, Closed).
   - *Inference*: Current code has no stage or lifecycle awareness. Projects are prematurely or incorrectly classified based on the calendar clock regardless of deliverable sign-offs or operational status.

3. **Organizational Disconnect**:
   - *Observation*: `src/models/User.ts:21` and `src/services/org.ts:67-83` restrict users to a single `teamId` and one of three roles (`owner`, `leader`, `member`).
   - *Observation*: `MH [WORKFLOW & OPERATING STRUCTURE].pdf` defines 3 operational lanes (*Vision & Design*, *Project & Delivery*, *Communication*), with specific individuals bridging across lanes (e.g. Sara M. bridging concept and delivery; Mariam documenting across all stages) and assigned Project Leads coordinating across all lanes.
   - *Inference*: The codebase cannot support multi-lane participation, cross-lane project leads, or matrix studio structures.

4. **Task Accountability Failure**:
   - *Observation*: `src/models/Task.ts:8` has a single `assigneeId`, and `src/services/tasks.ts:134` restricts task creation exclusively to the studio owner.
   - *Observation*: `MakeHappn [Dashboard].pdf` §14 requires one accountable owner per task, with clear handover and support for multidisciplinary collaboration and deliverable sign-offs.
   - *Inference*: The task model is an owner-bottlenecked Kanban card that cannot track deliverables, reviews, or approvals.

5. **Enterprise Module Absence**:
   - *Observation*: `src/components/rail.tsx:9-14` exposes only 4 rail links, and the entire `src/app/` tree lacks routes for sales, creative reviews, procurement, collective partners, and finance.
   - *Observation*: `MakeHappn [Dashboard].pdf` §10 mandates 8 core functional modules (*Overview, Sales, Projects, Creative/Design, Production/Procurement, Collective, Finance, Reports*).
   - *Inference*: Over 80% of the agency's required operational surface area is currently unbuilt.

---

## 3. Caveats

1. **Strict Code Freeze Maintained**: No application code in `src/` or repository root was modified during this exploration. Zero commits or diffs were introduced into application files.
2. **Pre-existing Working Tree Modifications**: Git status indicated 24 files in `src/` had uncommitted modifications prior to the start of this investigation. These modifications were inspected in their current state as requested by the prompt.
3. **Seed Data Context**: `scripts/seed.ts` demonstrates the initial architectural assumptions of the original developers, confirming that the current schema was modeled for simple venue/event tracking rather than a creative design and production studio.

---

## 4. Conclusion

The MakeHappen codebase currently operates on an early-stage prototype architecture that cannot support the agency's operational briefs. 

To bridge the gap between the codebase and the authoritative briefs (`MakeHappn [Dashboard].pdf` and `MH [WORKFLOW & OPERATING STRUCTURE].pdf`), the platform requires a fundamental domain refactoring:
1. **Transition root entity from `Event` to `Project`** with unique project codes (`MH-YYYY-XXX`) and multi-select product attachments.
2. **Replace calendar-based phase derivation** with the canonical **11-stage workflow**, hard stage gates, and discrete project statuses (`Planning`, `In progress`, `Delivered`, `Closed`).
3. **Expand User and Team modeling** to support the **3 operational lanes**, multi-lane membership, and cross-lane Project Lead assignments.
4. **Upgrade Task modeling** to include an **Accountable Owner**, collaborators, deliverable approval lifecycles, and stage associations.
5. **Implement the absent modules**, prioritizing the central **Projects Workspace**, **Sales / Pipeline**, **Production & Procurement**, and **Tri-Partite Finance** (Estimated vs Committed vs Actual costs).

---

## 5. Verification Method

To independently verify all findings in this report:
1. **Inspect Analysis Report**:
   - Open and review `d:\Work\MakeHappen\.agents\teamwork\explorer_m1_1\analysis.md`.
2. **Verify Code Locations via `view_file`**:
   - Verify `src/models/Event.ts:3-13` (single `typeId`, missing project code and client fields).
   - Verify `src/app/(app)/dashboard/page.tsx:14-18, 109-111` (Live/Upcoming/Wrapped phase bucketing).
   - Verify `src/lib/format.ts:46-56` (`experiencePhase` date math).
   - Verify `src/lib/permissions.ts:11-52` (siloed permissions and single `teamId` constraint).
   - Verify `src/services/tasks.ts:134` (owner-only task creation constraint).
   - Verify `src/components/rail.tsx:9-14` (only 4 navigation links).
3. **Verify Zero Application Code Alterations**:
   - Run `git status --porcelain src/` to verify that no new modifications were authored by `explorer_m1_1`.
4. **Invalidation Conditions**:
   - If `src/models/Event.ts` contains multi-product arrays, client references, or financial fields, this report is invalidated.
   - If `src/app/(app)/dashboard/page.tsx` checks stage gates or 11 workflow stages, this report is invalidated.
