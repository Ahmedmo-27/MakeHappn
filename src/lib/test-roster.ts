import "server-only";
import { FUNCTIONAL_ROLES, ROLES, type FunctionalRole, type Role } from "@/lib/domain";
import type { SessionUser } from "@/lib/permissions";

/**
 * Hardcoded sign-in accounts for the testing phase.
 * Static data only: nothing here is stored or looked up in the database.
 * Every access role and every functional role has at least one person.
 */
export const TEST_PASSWORD = "changeme123";

const LANES = {
  vision: "0000000000000000000000b1",
  delivery: "0000000000000000000000b2",
  communication: "0000000000000000000000b3",
} as const;

export const TEST_LANES = [
  { id: LANES.vision, name: "Vision & Design" },
  { id: LANES.delivery, name: "Project & Delivery" },
  { id: LANES.communication, name: "Communication" },
] as const;

export type TestUser = SessionUser & {
  password: string;
};

export const TEST_ROSTER: TestUser[] = [
  {
    id: "0000000000000000000000a1",
    name: "MakeHappen Owner",
    email: "owner@makehappen.local",
    password: TEST_PASSWORD,
    role: "owner",
    title: "System Administrator",
    isExecutive: true,
    functionalRoles: ["founder_executive"],
    laneIds: [],
    teamId: null,
  },
  {
    id: "0000000000000000000000a2",
    name: "Sara Dawoud",
    email: "sara.d@makehappen.local",
    password: TEST_PASSWORD,
    role: "owner",
    title: "Founder & Managing Director",
    isExecutive: true,
    functionalRoles: ["founder_executive"],
    laneIds: [LANES.vision],
    teamId: null,
  },
  {
    id: "0000000000000000000000a3",
    name: "Sama",
    email: "sama@makehappen.local",
    password: TEST_PASSWORD,
    role: "leader",
    title: "Creative Lead",
    isExecutive: false,
    functionalRoles: ["creative_lead"],
    laneIds: [LANES.vision],
    teamId: LANES.vision,
  },
  {
    id: "0000000000000000000000a4",
    name: "Sara M.",
    email: "sara.m@makehappen.local",
    password: TEST_PASSWORD,
    role: "leader",
    title: "Project & Delivery Lead",
    isExecutive: false,
    functionalRoles: ["project_delivery_lead"],
    laneIds: [LANES.delivery],
    teamId: LANES.delivery,
  },
  {
    id: "0000000000000000000000a5",
    name: "Mariam",
    email: "mariam@makehappen.local",
    password: TEST_PASSWORD,
    role: "leader",
    title: "Social Media Specialist",
    isExecutive: false,
    functionalRoles: ["content_documentation"],
    laneIds: [LANES.communication],
    teamId: LANES.communication,
  },
  {
    id: "0000000000000000000000a6",
    name: "Nadine",
    email: "nadine@makehappen.local",
    password: TEST_PASSWORD,
    role: "member",
    title: "Senior Graphic Designer",
    isExecutive: false,
    functionalRoles: ["identity_designer_2d"],
    laneIds: [LANES.vision],
    teamId: LANES.vision,
  },
  {
    id: "0000000000000000000000a7",
    name: "Sohila",
    email: "sohila@makehappen.local",
    password: TEST_PASSWORD,
    role: "member",
    title: "Art Direction / Senior 3D Designer",
    isExecutive: false,
    functionalRoles: ["art_director", "spatial_designer_3d"],
    laneIds: [LANES.vision],
    teamId: LANES.vision,
  },
  {
    id: "0000000000000000000000a8",
    name: "Hamdy",
    email: "hamdy@makehappen.local",
    password: TEST_PASSWORD,
    role: "member",
    title: "Spatial / 3D Visualizer",
    isExecutive: false,
    functionalRoles: ["spatial_designer_3d"],
    laneIds: [LANES.vision],
    teamId: LANES.vision,
  },
  {
    id: "0000000000000000000000a9",
    name: "Mai",
    email: "mai@makehappen.local",
    password: TEST_PASSWORD,
    role: "member",
    title: "Design & Production Executive",
    isExecutive: false,
    functionalRoles: ["production_manager", "site_operations"],
    laneIds: [LANES.delivery],
    teamId: LANES.delivery,
  },
  {
    id: "0000000000000000000000aa",
    name: "Production Intern",
    email: "intern.production@makehappen.local",
    password: TEST_PASSWORD,
    role: "member",
    title: "Production Support",
    isExecutive: false,
    functionalRoles: ["studio_support"],
    laneIds: [LANES.delivery],
    teamId: LANES.delivery,
  },
  {
    id: "0000000000000000000000ab",
    name: "Finance Desk",
    email: "finance@makehappen.local",
    password: TEST_PASSWORD,
    role: "member",
    title: "Finance & Legal",
    isExecutive: false,
    functionalRoles: ["finance_operations"],
    laneIds: [],
    teamId: null,
  },
];

function assertRosterCoversEveryRole() {
  const access = new Set<Role>(TEST_ROSTER.map((person) => person.role));
  const functional = new Set<FunctionalRole>(TEST_ROSTER.flatMap((person) => person.functionalRoles ?? []));
  for (const role of ROLES) {
    if (!access.has(role)) throw new Error(`Test roster is missing access role: ${role}`);
  }
  for (const role of FUNCTIONAL_ROLES) {
    if (!functional.has(role)) throw new Error(`Test roster is missing functional role: ${role}`);
  }
}

assertRosterCoversEveryRole();

export function findTestUserByEmail(email: string): TestUser | undefined {
  const key = email.toLowerCase().trim();
  return TEST_ROSTER.find((person) => person.email === key);
}

export function findTestUserById(id: string): TestUser | undefined {
  return TEST_ROSTER.find((person) => person.id === id);
}

export function sessionFromTestUser(person: TestUser): SessionUser {
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    role: person.role,
    title: person.title,
    isExecutive: person.isExecutive,
    functionalRoles: person.functionalRoles,
    laneIds: person.laneIds,
    teamId: person.teamId,
  };
}
