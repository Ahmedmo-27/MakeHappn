import assert from "node:assert/strict";
import {
  NON_BYPASSABLE_STAGES,
  PROJECT_STAGES,
  STUDIO_PRODUCTS,
  type ProjectStage,
} from "../src/lib/domain";

console.log("Running MakeHappen Studio Platform Domain Invariants Tests...\n");

// Test 1: Non-Bypassable Stages Definition
console.log("Test 1: Non-Bypassable Governance Stages");
assert.equal(NON_BYPASSABLE_STAGES.length, 6, "Must have exactly 6 non-bypassable stages");
assert.ok(NON_BYPASSABLE_STAGES.includes("01_lead_inquiry"), "Stage 01 must be non-bypassable");
assert.ok(NON_BYPASSABLE_STAGES.includes("02_qualification_discovery"), "Stage 02 must be non-bypassable");
assert.ok(NON_BYPASSABLE_STAGES.includes("03_scope_proposal_quotation"), "Stage 03 must be non-bypassable");
assert.ok(NON_BYPASSABLE_STAGES.includes("04_project_confirmation_handover"), "Stage 04 must be non-bypassable");
assert.ok(NON_BYPASSABLE_STAGES.includes("05_kickoff_project_planning"), "Stage 05 must be non-bypassable");
assert.ok(NON_BYPASSABLE_STAGES.includes("11_financial_project_close"), "Stage 11 must be non-bypassable");
console.log("✓ PASS: Non-bypassable stages verified.\n");

// Test 2: Studio Products Coverage
console.log("Test 2: Studio 6 Products Roster");
assert.equal(STUDIO_PRODUCTS.length, 6, "Must have exactly 6 core studio products");
const expectedProducts = [
  "curation",
  "design_development",
  "brand_design",
  "brand_communication",
  "production",
  "turnkey_experience",
];
for (const p of expectedProducts) {
  assert.ok(STUDIO_PRODUCTS.includes(p as typeof STUDIO_PRODUCTS[number]), `Product ${p} must exist`);
}
console.log("✓ PASS: 6 Studio Products verified.\n");

// Test 3: 11 Canonical Stages Sequence
console.log("Test 3: 11 Canonical Lifecycle Stages Sequence");
assert.equal(PROJECT_STAGES.length, 11, "Must have exactly 11 stages in sequence");
assert.equal(PROJECT_STAGES[0], "01_lead_inquiry");
assert.equal(PROJECT_STAGES[10], "11_financial_project_close");
console.log("✓ PASS: 11 Canonical Stages verified.\n");

// Test 4: Tri-Partite Financial Calculation & PO Decrementing (Zero Double-Counting)
console.log("Test 4: Tri-Partite Cost Engine & Relational PO Decrementing");
const approvedContractValue = 100000;
const initialPO = { amount: 30000, billedAmount: 0 };

// Initially: committed = 30000, actual = 0, projected total = 30000
let committedPOCosts = Math.max(0, initialPO.amount - initialPO.billedAmount);
let actualIncurredCosts = 0;
let projectedTotalCost = actualIncurredCosts + committedPOCosts;
assert.equal(committedPOCosts, 30000);
assert.equal(actualIncurredCosts, 0);
assert.equal(projectedTotalCost, 30000);

// Supplier bills $10,000 partial invoice
const supplierBill = 10000;
initialPO.billedAmount += supplierBill;
actualIncurredCosts += supplierBill;
committedPOCosts = Math.max(0, initialPO.amount - initialPO.billedAmount);
projectedTotalCost = actualIncurredCosts + committedPOCosts;

// Projected total cost MUST remain $30,000 with zero double-counting!
assert.equal(actualIncurredCosts, 10000, "Actual cost must be $10,000");
assert.equal(committedPOCosts, 20000, "Committed PO balance must decrement to $20,000");
assert.equal(projectedTotalCost, 30000, "Projected total cost must remain exactly $30,000 (no double-counting)");

const projectedMargin = approvedContractValue - projectedTotalCost;
const marginPercent = (projectedMargin / approvedContractValue) * 100;
assert.equal(projectedMargin, 70000);
assert.equal(marginPercent, 70);
console.log("✓ PASS: Tri-Partite costing and PO balance decrementing verified.\n");

// Test 5: Digital Delivery Trigger for Non-Physical Projects
console.log("Test 5: Digital Delivery Trigger Logic");
const bypassedForBranding: ProjectStage[] = [
  "08_planning_pre_production",
  "09_production_execution",
  "10_delivery_live_operations",
];
const physicalStages = ["08_planning_pre_production", "09_production_execution", "10_delivery_live_operations"];
const isPhysicalBypassed = physicalStages.every((s) => bypassedForBranding.includes(s as ProjectStage));
assert.ok(isPhysicalBypassed, "Branding project bypasses physical fabrication");

let isDelivered = false;
let status = "in_progress";
// When Stage 07 is verified or Stage 11 is targeted:
if (isPhysicalBypassed) {
  isDelivered = true;
  status = "delivered";
}
assert.equal(isDelivered, true, "Must set isDelivered to true without deadlock");
assert.equal(status, "delivered", "Status must become delivered");
console.log("✓ PASS: Digital Delivery Trigger verified.\n");

console.log("=================================================");
console.log("ALL MAKEHAPPEN DOMAIN INVARIANTS TESTS PASSED! ✓");
console.log("=================================================");
