import assert from "node:assert";
import { connectDB } from "../src/lib/db";
import { Project } from "../src/models/Project";
import { Client } from "../src/models/Client";
import { User } from "../src/models/User";
import { RiskIssue } from "../src/models/RiskIssue";
import { ChangeRequest } from "../src/models/ChangeRequest";
import {
  createManualChangeRequest,
  approveChangeRequest,
} from "../src/services/commercial";
import {
  createRiskIssue,
  resolveRiskIssue,
} from "../src/services/risks";
import { submitCloseoutAudit } from "../src/services/projects";
import { getStudioAnalytics } from "../src/services/analytics";

async function run() {
  console.log("Starting Governance & Analytics Invariant Suite...");
  await connectDB();

  // Find or create test client and user
  let user = await User.findOne({ email: "sara@makehappen.com" });
  if (!user) {
    user = await User.create({
      name: "Sara Dawoud",
      email: "sara@makehappen.com",
      passwordHash: "hash123",
      role: "owner",
      title: "Founder & Vision Lead",
    });
  }

  let client = await Client.findOne();
  if (!client) {
    client = await Client.create({
      name: "Acme Corporation",
      brandName: "Acme Brand",
      contacts: [{ name: "Alice", email: "alice@acme.com", isPrimary: true }],
    });
  }

  const initialDeliveryDate = new Date("2026-11-20T00:00:00.000Z");

  // Create isolated test project
  const testProject = await Project.create({
    code: `MH-TEST-${Date.now().toString().slice(-4)}`,
    name: "Governance Invariant Test Project",
    clientId: client._id,
    projectLeadId: user._id,
    products: ["brand_design", "turnkey_experience"],
    stage: "07_design_development_refinement",
    status: "in_progress",
    health: "on_track",
    startDate: new Date("2026-11-01"),
    deliveryDate: new Date(initialDeliveryDate),
    quotedValue: 100000,
    approvedContractValue: 100000,
    estimatedTotalCost: 60000,
    committedTotalCost: 0,
    actualTotalCost: 0,
    milestones: [
      { stage: "07_design_development_refinement", isGateApproved: false },
      { stage: "11_financial_project_close", isGateApproved: false },
    ],
  });

  const projId = testProject._id.toString();

  try {
    // -------------------------------------------------------------
    // Test 1: Change Request Financial & Schedule Delta Invariant
    // -------------------------------------------------------------
    console.log("Test 1: Verifying Change Request financial & schedule adjustment...");
    const cr = await createManualChangeRequest({
      projectId: projId,
      title: "VIP Lounge Custom Kinetic Sculpture",
      reason: "client_scope_addition",
      description: "Client requested motorized hanging elements not in initial scope.",
      clientRevenueDelta: 15000,
      internalCostDelta: 9000,
      timeDeltaDays: 7,
    });

    assert.strictEqual(cr.status, "draft");
    assert.strictEqual(cr.code.startsWith("CR-"), true);

    await approveChangeRequest(cr._id.toString(), user._id.toString());

    const updatedProjAfterCR = await Project.findById(projId);
    assert(updatedProjAfterCR !== null);
    assert.strictEqual(
      updatedProjAfterCR.approvedContractValue,
      115000,
      `Expected approvedContractValue to be 115000, got ${updatedProjAfterCR.approvedContractValue}`,
    );
    assert.strictEqual(
      updatedProjAfterCR.estimatedTotalCost,
      69000,
      `Expected estimatedTotalCost to be 69000, got ${updatedProjAfterCR.estimatedTotalCost}`,
    );

    const expectedNewDeliveryDate = new Date(initialDeliveryDate);
    expectedNewDeliveryDate.setDate(expectedNewDeliveryDate.getDate() + 7);
    assert.strictEqual(
      updatedProjAfterCR.deliveryDate?.getTime(),
      expectedNewDeliveryDate.getTime(),
      `Expected deliveryDate to move forward by 7 days`,
    );
    console.log("✓ Test 1 passed: CR approval accurately adjusted revenue, estimated costs, and delivery milestone.");

    // -------------------------------------------------------------
    // Test 2: Critical Risk & Dynamic Project Health Invariant
    // -------------------------------------------------------------
    console.log("Test 2: Verifying Critical Risk dynamic health trigger...");
    assert.strictEqual(updatedProjAfterCR.health, "on_track");

    const criticalRisk = await createRiskIssue({
      projectId: projId,
      title: "Venue ceiling load permit delayed by municipality",
      category: "site_operations",
      severity: "critical",
      ownerId: user._id.toString(),
      impactDescription: "Cannot rig kinetic sculpture without municipal sign-off",
      mitigationDecision: "Engage expedited structural engineering consultant",
    });

    const projAfterCriticalRisk = await Project.findById(projId);
    assert.strictEqual(
      projAfterCriticalRisk?.health,
      "at_risk",
      `Expected project health to be 'at_risk' after logging critical risk, got ${projAfterCriticalRisk?.health}`,
    );

    // Resolve the risk
    await resolveRiskIssue(
      criticalRisk._id.toString(),
      "Engineering permit granted after peer review submission",
      "resolved",
    );

    const projAfterRiskResolved = await Project.findById(projId);
    assert.strictEqual(
      projAfterRiskResolved?.health,
      "on_track",
      `Expected project health to restore to 'on_track' after resolving all critical risks`,
    );
    console.log("✓ Test 2 passed: Critical risk triggered 'at_risk' health flag, and resolution restored 'on_track'.");

    // -------------------------------------------------------------
    // Test 3: Stage 11 Financial & Closeout Audit Gate Invariant
    // -------------------------------------------------------------
    console.log("Test 3: Verifying Stage 11 Closeout Audit Gate...");
    // Partial closeout should NOT close the project
    await submitCloseoutAudit({
      projectId: projId,
      actorId: user._id.toString(),
      clientWalkthroughSigned: true,
      punchListCleared: true,
      postMortemCompleted: false, // Incomplete!
      archiveDelivered: false,    // Incomplete!
    });

    const projAfterPartialClose = await Project.findById(projId);
    assert.notStrictEqual(projAfterPartialClose?.status, "closed");

    // Complete closeout checklist
    await submitCloseoutAudit({
      projectId: projId,
      actorId: user._id.toString(),
      clientWalkthroughSigned: true,
      punchListCleared: true,
      postMortemCompleted: true,
      archiveDelivered: true,
      archivedAssetsUrl: "https://dropbox.com/makehappen/kinetic-vip",
      lessonsLearned: "Pre-submit structural permits 3 weeks in advance.",
    });

    const projAfterFullClose = await Project.findById(projId);
    assert.strictEqual(projAfterFullClose?.status, "closed");
    assert.strictEqual(projAfterFullClose?.stage, "11_financial_project_close");
    assert(projAfterFullClose?.closeDate !== null && projAfterFullClose?.closeDate !== undefined);

    const m11 = projAfterFullClose?.milestones.find((m) => m.stage === "11_financial_project_close");
    assert.strictEqual(m11?.isGateApproved, true);
    console.log("✓ Test 3 passed: 5-point closeout audit safely gated project closure and certified Stage 11.");

    // -------------------------------------------------------------
    // Test 4: Studio Analytics Aggregator Invariant
    // -------------------------------------------------------------
    console.log("Test 4: Verifying Studio Analytics Aggregator...");
    const analytics = await getStudioAnalytics();
    assert(Array.isArray(analytics.productStats));
    assert.strictEqual(analytics.productStats.length, 6, "Must cover all 6 studio products");
    assert(Array.isArray(analytics.topClients));
    assert(Array.isArray(analytics.varianceProjects));
    assert(Array.isArray(analytics.laneStats));
    assert(typeof analytics.funnel.winRatePercent === "number");
    console.log("✓ Test 4 passed: Analytics service aggregated products, lanes, variances, and funnel cleanly.");

    console.log("\nALL 4 GOVERNANCE & ANALYTICS INVARIANTS PASSED! 🎉");
  } finally {
    // Cleanup test artifacts
    await ChangeRequest.deleteMany({ projectId: testProject._id });
    await RiskIssue.deleteMany({ projectId: testProject._id });
    await Project.deleteOne({ _id: testProject._id });
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Invariant test failed:", err);
  process.exit(1);
});
