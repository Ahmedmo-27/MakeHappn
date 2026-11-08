# Task Assignment: Apply Adversarial Hardening Amendments to Master Report

## Working Directory
d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\

## Original Request
Path: d:\Work\MakeHappen\.agents\teamwork\ORIGINAL_REQUEST.md (MANDATORY: read this first)

## Base Master Report
`d:\Work\MakeHappen\.agents\teamwork\worker_m2_1\GAP_ANALYSIS_REPORT.md`

## Feedback Artifacts to Address
- `d:\Work\MakeHappen\.agents\teamwork\challenger_m3_1\analysis.md` & `handoff.md`
- `d:\Work\MakeHappen\.agents\teamwork\challenger_m3_2\analysis.md` & `handoff.md`
- `d:\Work\MakeHappen\.agents\teamwork\reviewer_m3_1\analysis.md` & `handoff.md`
- `d:\Work\MakeHappen\.agents\teamwork\reviewer_m3_2\analysis.md` & `handoff.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Constraints
- STRICT CODE FREEZE: Zero application code files in `src/` or repository root may be modified.
- You exclusively own writing in `d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\`.
- Prioritize PDF operating briefs over current code implementations.

## Required Amendments to Incorporate into GAP_ANALYSIS_REPORT.md
1. **Stage Bypass Invariants & Deadlock Resolution**: Define `NON_BYPASSABLE_STAGES` (Stages 01, 02, 03, 04, 05, 11). For brand design / curation projects skipping Stages 08–10, client approval of the final Stage 07 deliverable sets `project.isDelivered = true` and `project.status = "delivered"`, unlocking Stage 11 closeout and preventing state machine deadlock.
2. **Task Categorization & Matrix Supervision**: Add `isGatePrerequisite: boolean` and `taskCategory: "deliverable_prerequisite" | "continuous_support" | "operational_internal"` to `ITask` so continuous documentation tasks do not block Stage 06/07 gates. Support multi-stakeholder approval chains for public communication deliverables (`craftReviewerId: Nadine`, `projectReviewerId: Sara M.`, `executiveReviewerId: Sara Dawoud`).
3. **Financial Engine Hardening**: Add `currency: "USD" | "AED" | "SAR" | "EGP"`. Define `projectedTotalCostAtCompletion = actualCosts.total + committedCosts.activePurchaseOrders`. Distinguish in-flight `projectedGrossMargin` from closed `reconciledGrossMargin`. Add relational `IPurchaseOrder` and `ISupplierBill` schemas. Split `costImpact` on `IChangeRequest` into `clientRevenueDelta: number` and `internalCostDelta: number`.
4. **Author Full `Client.ts` Schema**: Provide the formal Mongoose schema, TypeScript interface, and indexes for `Client.ts` in Section 4 and include it in Phase 0.
5. **Add `stage` to `Deliverable.ts`**: Add `stage: { type: String, enum: PROJECT_STAGES, required: true, index: true }` to `Deliverable.ts`.
6. **Deliverable State Machine Loopback**: Add explicit transition: `revision_required -> draft (version++) -> internal_review -> sent_to_client`.
7. **Deliverable & Change Request Linkage**: Add `revisionRound: number` and `changeRequestId?: ObjectId` to `Deliverable.ts`; add `deliverableId?: ObjectId` to `ChangeRequest.ts`; add `contractedRevisionRounds: number` to `Project.ts`.
8. **Two-Tier Stage Gate Rollout in Roadmap**: Explicitly document in Phase 1 that stage gates rely on `Project.milestones` human sign-offs as a baseline, and that automated programmatic artifact validation hooks in during Phases 2–5, eliminating the circular dependency.
9. **Mongoose Schemas for Section 4.5**: Author full Mongoose schemas and exports for `ChangeRequest`, `Invoice`, and `CollectiveMember`.

## Deliverables
- Author the updated master report at:
  `d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\GAP_ANALYSIS_REPORT.md`
- Write your self-contained handoff report at:
  `d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\handoff.md`

## 2026-11-08T21:00:47Z
You are worker_m2_2, a teamwork_worker.
Your working directory is: d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\
Read your task assignment at: d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\DISPATCH.md
Read the original request at: d:\Work\MakeHappen\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CRITICAL CONSTRAINTS:
1. STRICT CODE FREEZE: Zero application code files in src/ or repository root may be modified.
2. You exclusively own writing in d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\.
3. Prioritize PDF operating briefs over current code implementations.

Input Artifacts to Synthesize:
- Base Report: d:\Work\MakeHappen\.agents\teamwork\worker_m2_1\GAP_ANALYSIS_REPORT.md
- Feedback from challenger_m3_1: d:\Work\MakeHappen\.agents\teamwork\challenger_m3_1\handoff.md and analysis.md
- Feedback from challenger_m3_2: d:\Work\MakeHappen\.agents\teamwork\challenger_m3_2\handoff.md and analysis.md
- Feedback from reviewer_m3_1: d:\Work\MakeHappen\.agents\teamwork\reviewer_m3_1\handoff.md and analysis.md
- Feedback from reviewer_m3_2: d:\Work\MakeHappen\.agents\teamwork\reviewer_m3_2\handoff.md and analysis.md

Apply the 9 concrete hardening amendments specified in your DISPATCH.md to author the definitive master report:
d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\GAP_ANALYSIS_REPORT.md
And write your self-contained handoff report at:
d:\Work\MakeHappen\.agents\teamwork\worker_m2_2\handoff.md

