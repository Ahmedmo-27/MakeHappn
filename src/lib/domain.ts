export const ROLES = ["owner", "leader", "member"] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BOARD_STATUSES = [
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
] as const;
export type BoardStatus = (typeof BOARD_STATUSES)[number];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  blocked: "Blocked",
  done: "Done",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isBoardStatus(value: string): value is BoardStatus {
  return (BOARD_STATUSES as readonly string[]).includes(value);
}

export function roleLabel(role: Role): string {
  if (role === "owner") return "Owner";
  if (role === "leader") return "Team leader";
  return "Member";
}

/* =========================================================================
   CANONICAL MAKEHAPPEN STUDIO DOMAIN DEFINITIONS
   Authoritative operating briefs:
   - MakeHappn [Dashboard].pdf
   - Makehappn [Dashboard 2].pdf
   - MH [WORKFLOW & OPERATING STRUCTURE].pdf
   ========================================================================= */

export const PROJECT_STAGES = [
  "01_lead_inquiry",
  "02_qualification_discovery",
  "03_scope_proposal_quotation",
  "04_project_confirmation_handover",
  "05_kickoff_project_planning",
  "06_creative_concept_development",
  "07_design_development_refinement",
  "08_planning_pre_production",
  "09_production_execution",
  "10_delivery_live_operations",
  "11_financial_project_close",
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const NON_BYPASSABLE_STAGES: readonly ProjectStage[] = [
  "01_lead_inquiry",
  "02_qualification_discovery",
  "03_scope_proposal_quotation",
  "04_project_confirmation_handover",
  "05_kickoff_project_planning",
  "11_financial_project_close",
] as const;

export const MACRO_PHASES = [
  {
    id: "01_brief",
    number: "01",
    title: "Client & Creative Brief",
    summary: "Understand the ask, shape the vision, and set the budget & timeline together.",
    leads: "Sama & Sara M.",
    stages: ["01_lead_inquiry", "02_qualification_discovery", "03_scope_proposal_quotation", "04_project_confirmation_handover"],
  },
  {
    id: "02_design",
    number: "02",
    title: "Design Development",
    summary: "Turn the brief into visual and spatial design — 2D and 3D in lockstep.",
    leads: "Nadine, Sohila & Hamdy",
    stages: ["05_kickoff_project_planning", "06_creative_concept_development", "07_design_development_refinement"],
  },
  {
    id: "03_production",
    number: "03",
    title: "Delivery & Production",
    summary: "Fabricate, coordinate, and execute on-site until the project is handed over.",
    leads: "Sara M., Mai & Production Intern",
    stages: ["08_planning_pre_production", "09_production_execution", "10_delivery_live_operations"],
  },
  {
    id: "04_communication",
    number: "04",
    title: "Communication",
    summary: "Share the work with the world — documentation, content & storytelling.",
    leads: "Mariam & Sara Dawoud",
    stages: ["11_financial_project_close"],
  },
] as const;

export const STAGE_LABELS: Record<
  ProjectStage,
  {
    number: string;
    title: string;
    short: string;
    macroPhase: string;
    whatHappens: string;
    expectedOutput: string;
  }
> = {
  "01_lead_inquiry": {
    number: "01",
    title: "Lead / Inquiry",
    short: "Lead",
    macroPhase: "01 · Client & Creative Brief",
    whatHappens: "A potential client, existing client or referral presents an opportunity. Sales records client needs, source, timeline and follow-up date.",
    expectedOutput: "Lead created; lead owner assigned; next action and follow-up date recorded.",
  },
  "02_qualification_discovery": {
    number: "02",
    title: "Qualification & Discovery",
    short: "Discovery",
    macroPhase: "01 · Client & Creative Brief",
    whatHappens: "Assess opportunity fit; clarify objectives, audience, deliverables, budget range, timing, location and decision-makers.",
    expectedOutput: "Discovery notes and a usable client brief. Missing information and assumptions are visible.",
  },
  "03_scope_proposal_quotation": {
    number: "03",
    title: "Scope, Proposal & Quotation",
    short: "Proposal",
    macroPhase: "01 · Client & Creative Brief",
    whatHappens: "Define relevant MakeHappn products, scope, effort, costs and timing. Finance verifies commercial model and margin.",
    expectedOutput: "Proposal, scope of work, deliverables, timeline, assumptions, quotation and payment terms.",
  },
  "04_project_confirmation_handover": {
    number: "04",
    title: "Project Confirmation & Handover",
    short: "Confirmation",
    macroPhase: "01 · Client & Creative Brief",
    whatHappens: "Client approves contract and initial milestone. Sales transfers client context and commitments to delivery team.",
    expectedOutput: "Confirmed project record, approved scope, contract or written approval, initial payment milestone and internal handover.",
  },
  "05_kickoff_project_planning": {
    number: "05",
    title: "Kick-off & Project Planning",
    short: "Kick-off",
    macroPhase: "02 · Design Development",
    whatHappens: "Turn approved scope into a delivery plan. Assign workstreams, accountable owners, milestones, dependencies and risk list.",
    expectedOutput: "Project plan, task list, owners, timeline, milestones, communication rhythm and risk list.",
  },
  "06_creative_concept_development": {
    number: "06",
    title: "Creative Development",
    short: "Concept",
    macroPhase: "02 · Design Development",
    whatHappens: "Creative team interprets approved brief and develops concept or creative direction. Client approval gate.",
    expectedOutput: "Concept presentation, experience direction, creative rationale and client approval.",
  },
  "07_design_development_refinement": {
    number: "07",
    title: "Design Development",
    short: "Design",
    macroPhase: "02 · Design Development",
    whatHappens: "Develop approved direction into visual, spatial, brand and technical materials (2D and 3D in lockstep).",
    expectedOutput: "Approved design files, layouts, renders, artwork, specifications and production-ready information.",
  },
  "08_planning_pre_production": {
    number: "08",
    title: "Planning & Pre-Production",
    short: "Pre-Prod",
    macroPhase: "03 · Delivery & Production",
    whatHappens: "Check feasibility, lock cost sheet, gather supplier quotes, confirm availability and finalize schedules.",
    expectedOutput: "Locked or approved cost sheet, supplier/partner confirmations, production schedule, procurement plan and quality checklist.",
  },
  "09_production_execution": {
    number: "09",
    title: "Production & Execution",
    short: "Production",
    macroPhase: "03 · Delivery & Production",
    whatHappens: "Manage fabrication, purchasing, printing, logistics, and installation. Track progress against production plan and log issues.",
    expectedOutput: "Completed items, progress updates, quality checks, installation readiness and updated actual costs.",
  },
  "10_delivery_live_operations": {
    number: "10",
    title: "Delivery / Live Operations",
    short: "Delivery",
    macroPhase: "03 · Delivery & Production",
    whatHappens: "Deliver final output or manage live experience: setup, event-day ops, client walkthrough, handover and final quality checks.",
    expectedOutput: "Delivered project, client handover or event completion, documentation and outstanding-item list.",
  },
  "11_financial_project_close": {
    number: "11",
    title: "Financial & Project Close",
    short: "Closeout",
    macroPhase: "04 · Communication",
    whatHappens: "Reconcile final costs, follow up on client payments, close supplier payments, organize files and review studio performance.",
    expectedOutput: "Final cost and revenue, actual profit, payment status, final documentation and project review.",
  },
};

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

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: "Not started",
  planning: "Planning",
  in_progress: "In progress",
  waiting_for_client: "Waiting for client",
  at_risk: "At risk",
  on_hold: "On hold",
  delivered: "Delivered",
  closed: "Closed",
};

export const STUDIO_PRODUCTS = [
  "curation",
  "design_development",
  "brand_design",
  "brand_communication",
  "production",
  "turnkey_experience",
] as const;
export type StudioProduct = (typeof STUDIO_PRODUCTS)[number];

export const STUDIO_PRODUCT_LABELS: Record<StudioProduct, string> = {
  curation: "Curation",
  design_development: "Design Development",
  brand_design: "Brand Design",
  brand_communication: "Brand Communication",
  production: "Production",
  turnkey_experience: "Turnkey Experience",
};

export const STUDIO_LANES = [
  "vision_design",
  "project_delivery",
  "communication",
  "communication_engagement",
] as const;
export type StudioLane = (typeof STUDIO_LANES)[number];

export const STUDIO_LANE_LABELS: Record<StudioLane, string> = {
  vision_design: "Vision & Design",
  project_delivery: "Project & Delivery",
  communication: "Communication",
  communication_engagement: "Communication",
};

export const FUNCTIONAL_ROLES = [
  "founder_executive",
  "creative_lead",
  "project_delivery_lead",
  "identity_designer_2d",
  "spatial_designer_3d",
  "art_director",
  "production_manager",
  "site_operations",
  "content_documentation",
  "finance_operations",
  "studio_support",
] as const;
export type FunctionalRole = (typeof FUNCTIONAL_ROLES)[number];

export const FUNCTIONAL_ROLE_LABELS: Record<FunctionalRole, string> = {
  founder_executive: "Founder & Managing Director",
  creative_lead: "Creative Lead",
  project_delivery_lead: "Project & Delivery Lead",
  identity_designer_2d: "Senior Graphic Designer",
  spatial_designer_3d: "Spatial / 3D Visualizer",
  art_director: "Art Director / Senior 3D Designer",
  production_manager: "Design & Production Executive",
  site_operations: "Site Operations",
  content_documentation: "Social Media Specialist",
  finance_operations: "Finance & Legal",
  studio_support: "Production Support (Intern)",
};

export const CURRENCIES = ["USD", "AED", "SAR", "EGP"] as const;
export type StudioCurrency = (typeof CURRENCIES)[number];

export function isProjectStage(value: string): value is ProjectStage {
  return (PROJECT_STAGES as readonly string[]).includes(value);
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

export function isStudioProduct(value: string): value is StudioProduct {
  return (STUDIO_PRODUCTS as readonly string[]).includes(value);
}

export function isStudioLane(value: string): value is StudioLane {
  return (STUDIO_LANES as readonly string[]).includes(value);
}
