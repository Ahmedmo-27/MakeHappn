import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { FUNCTIONAL_ROLES, ROLES, type FunctionalRole, type Role } from "@/lib/domain";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

/**
 * Fixed sign-in accounts for the testing phase.
 * Every access role and every functional role has at least one person.
 * Password is shared so anyone testing the studio can sign in.
 */
const TEST_PASSWORD = process.env.SEED_OWNER_PASSWORD || "changeme123";

const STUDIO_LANES = ["Vision & Design", "Project & Delivery", "Communication"] as const;

type TestPerson = {
  name: string;
  email: string;
  title: string;
  lane: (typeof STUDIO_LANES)[number] | null;
  role: Role;
  isExecutive: boolean;
  functionalRoles: FunctionalRole[];
};

export const TEST_ROSTER: TestPerson[] = [
  {
    name: "Sara Dawoud",
    email: "sara.d@makehappen.local",
    title: "Founder & Managing Director",
    lane: "Vision & Design",
    role: "owner",
    isExecutive: true,
    functionalRoles: ["founder_executive"],
  },
  {
    name: "MakeHappen Owner",
    email: (process.env.SEED_OWNER_EMAIL || "owner@makehappen.local").toLowerCase(),
    title: "System Administrator",
    lane: null,
    role: "owner",
    isExecutive: true,
    functionalRoles: ["founder_executive"],
  },
  {
    name: "Sama",
    email: "sama@makehappen.local",
    title: "Creative Lead",
    lane: "Vision & Design",
    role: "leader",
    isExecutive: false,
    functionalRoles: ["creative_lead"],
  },
  {
    name: "Sara M.",
    email: "sara.m@makehappen.local",
    title: "Project & Delivery Lead",
    lane: "Project & Delivery",
    role: "leader",
    isExecutive: false,
    functionalRoles: ["project_delivery_lead"],
  },
  {
    name: "Mariam",
    email: "mariam@makehappen.local",
    title: "Social Media Specialist",
    lane: "Communication",
    role: "leader",
    isExecutive: false,
    functionalRoles: ["content_documentation"],
  },
  {
    name: "Nadine",
    email: "nadine@makehappen.local",
    title: "Senior Graphic Designer",
    lane: "Vision & Design",
    role: "member",
    isExecutive: false,
    functionalRoles: ["identity_designer_2d"],
  },
  {
    name: "Sohila",
    email: "sohila@makehappen.local",
    title: "Art Direction / Senior 3D Designer",
    lane: "Vision & Design",
    role: "member",
    isExecutive: false,
    functionalRoles: ["art_director", "spatial_designer_3d"],
  },
  {
    name: "Hamdy",
    email: "hamdy@makehappen.local",
    title: "Spatial / 3D Visualizer",
    lane: "Vision & Design",
    role: "member",
    isExecutive: false,
    functionalRoles: ["spatial_designer_3d"],
  },
  {
    name: "Mai",
    email: "mai@makehappen.local",
    title: "Design & Production Executive",
    lane: "Project & Delivery",
    role: "member",
    isExecutive: false,
    functionalRoles: ["production_manager", "site_operations"],
  },
  {
    name: "Production Intern",
    email: "intern.production@makehappen.local",
    title: "Production Support",
    lane: "Project & Delivery",
    role: "member",
    isExecutive: false,
    functionalRoles: ["studio_support"],
  },
  {
    name: "Finance Desk",
    email: "finance@makehappen.local",
    title: "Finance & Legal",
    lane: null,
    role: "member",
    isExecutive: false,
    functionalRoles: ["finance_operations"],
  },
];

function assertRosterCoversEveryRole() {
  const access = new Set(TEST_ROSTER.map((person) => person.role));
  const functional = new Set(TEST_ROSTER.flatMap((person) => person.functionalRoles));
  for (const role of ROLES) {
    if (!access.has(role)) throw new Error(`Test roster is missing access role: ${role}`);
  }
  for (const role of FUNCTIONAL_ROLES) {
    if (!functional.has(role)) throw new Error(`Test roster is missing functional role: ${role}`);
  }
}

assertRosterCoversEveryRole();

export function testSignInPassword() {
  return TEST_PASSWORD;
}

let ensuring: Promise<void> | null = null;

/** Create or refresh the hardcoded test accounts. Safe to call on every boot. */
export function ensureTestRoster(): Promise<void> {
  if (!ensuring) {
    ensuring = writeRoster().catch((error: unknown) => {
      ensuring = null;
      throw error;
    });
  }
  return ensuring;
}

async function writeRoster() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Database is not connected");
  }

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const laneIds = new Map<string, mongoose.Types.ObjectId>();

  for (const name of STUDIO_LANES) {
    let lane = await Team.findOne({ name });
    if (!lane) lane = await Team.create({ name, leaderId: null });
    laneIds.set(name, lane._id);
  }

  for (const person of TEST_ROSTER) {
    const laneId = person.lane ? laneIds.get(person.lane) ?? null : null;
    const fields = {
      name: person.name,
      email: person.email,
      passwordHash,
      role: person.role,
      title: person.title,
      isExecutive: person.isExecutive,
      functionalRoles: person.functionalRoles,
      laneIds: laneId ? [laneId] : [],
      teamId: person.role === "owner" ? null : laneId,
      isActive: true,
    };

    const existing = await User.findOne({ email: person.email });
    const saved = existing ?? (await User.create(fields));

    if (person.role === "leader" && laneId && saved) {
      const lane = await Team.findById(laneId).select("leaderId");
      if (lane && !lane.leaderId) {
        await Team.findByIdAndUpdate(laneId, { $set: { leaderId: saved._id } });
      }
    }
  }
}
