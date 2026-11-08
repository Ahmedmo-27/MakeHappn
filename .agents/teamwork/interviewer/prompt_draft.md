Analyze and document the differences between the current codebase implementation and the three PDF operating briefs (MakeHappn [Dashboard].pdf, Makehappn [Dashboard 2].pdf, and MH [WORKFLOW & OPERATING STRUCTURE].pdf) alongside the provided gap report, prioritizing the documents over existing code, with no application code changes.

Integrity mode: development

## Reference Materials
- `MakeHappn [Dashboard].pdf`
- `Makehappn [Dashboard 2].pdf`
- `MH [WORKFLOW & OPERATING STRUCTURE].pdf`
- Provided gap report on platform gaps against the operating briefs (covering unit of work, stages vs calendar, missing project fields, org chart vs crews, task model, absent modules, doc inconsistencies, and suggested build order)

## Requirements

### R1. Gap Analysis and Reconciliation Report
Compare the current implementation (including `src/lib/domain.ts`, `src/models/Event.ts`, `src/models/Task.ts`, `src/app/(app)/dashboard/page.tsx`, and `src/lib/permissions.ts`) against the three PDF documents and the provided gap report. Focus on verifying and expanding upon the 7 identified gap areas:
1. Unit of work (experience vs project, single typeId vs multi-select products and project codes).
2. Stages and lifecycle (calendar-based Live/Upcoming/Wrapped vs 11-stage pipeline, stage gates, and distinct project statuses).
3. Project record fields (client, lead, scope, costs, milestones, partners, invoices, change requests, and close-out).
4. Org chart, lanes, and permissions (crews vs Vision/Design, Project/Delivery, Communication lanes; multi-lane membership and cross-lane project lead coordination; doc discrepancies such as Sohila/art director).
5. Task accountability and deliverables (single-assignee team cards vs accountable owners, collaborators, deliverable status, approvals, change requests, dependencies).
6. Absent modules (Overview, Sales, Projects, Creative/Design, Production/Procurement, Collective, Finance, Reports).
7. Document inconsistencies and suggested build order (resolving or highlighting contradictions between documents and validating the phased foundation order).
The team decides the deliverable location and format (e.g., repository markdown report or comprehensive response).

### R2. Strict Code Freeze
Do not make or apply any code changes to the application files in this step.

## Acceptance Criteria

### Gap Analysis Coverage
- [ ] Each of the 7 gap areas is evaluated against both the current codebase and the three PDF briefs.
- [ ] Precedence is explicitly given to the PDF documents over current code implementations.
- [ ] Document inconsistencies noted in the report (e.g. org chart vs workflow roles) are cataloged and addressed.
- [ ] The recommended phased build order is reviewed and reconciled against the findings.

### Scope Constraint
- [ ] Zero application code files in the repository are modified.
