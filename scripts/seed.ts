import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Client } from "../src/models/Client";
import { Team } from "../src/models/Team";
import { User } from "../src/models/User";
import { type FunctionalRole } from "../src/lib/domain";

const STUDIO_LANES = [
  "Vision & Design",
  "Project & Delivery",
  "Communication",
];

const INITIAL_ROSTER: Array<{
  name: string;
  email: string;
  title: string;
  lane: string;
  role: "owner" | "leader" | "member";
  isExecutive: boolean;
  functionalRoles: FunctionalRole[];
}> = [
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
    name: "Sama",
    email: "sama@makehappen.local",
    title: "Creative Lead",
    lane: "Vision & Design",
    role: "leader",
    isExecutive: false,
    functionalRoles: ["creative_lead"],
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
    name: "Sara M.",
    email: "sara.m@makehappen.local",
    title: "Project & Delivery Lead",
    lane: "Project & Delivery",
    role: "leader",
    isExecutive: false,
    functionalRoles: ["project_delivery_lead"],
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
    title: "Production Support (Open Role)",
    lane: "Project & Delivery",
    role: "member",
    isExecutive: false,
    functionalRoles: ["studio_support"],
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
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
  }

  await connectDB();
  console.log("Connected to MongoDB. Seeding studio baseline...");

  // 1. Seed the 3 Studio Lanes
  const laneMap = new Map<string, mongoose.Types.ObjectId>();
  for (const name of STUDIO_LANES) {
    let lane = await Team.findOne({ name });
    if (!lane) {
      lane = await Team.create({ name, leaderId: null });
    }
    laneMap.set(name, lane._id);
  }
  console.log("Seeded lanes:", STUDIO_LANES.join(", "));

  // 2. Seed Default Client
  let defaultClient = await Client.findOne({ name: "MakeHappen Studio Client" });
  if (!defaultClient) {
    defaultClient = await Client.create({
      name: "MakeHappen Studio Client",
      brandName: "MakeHappen Enterprise",
      industry: "Experiential & Creative",
      contacts: [
        {
          name: "Client Director",
          email: "client@makehappen.local",
          isPrimary: true,
        },
      ],
      paymentTermsDays: 30,
      status: "active",
    });
    console.log("Seeded default client:", defaultClient.name);
  }

  // 3. Seed Studio Roster
  const passwordHash = await bcrypt.hash("changeme123", 12);
  for (const person of INITIAL_ROSTER) {
    const laneId = laneMap.get(person.lane);
    const existing = await User.findOne({ email: person.email });

    if (!existing) {
      const created = await User.create({
        name: person.name,
        email: person.email,
        passwordHash,
        role: person.role,
        title: person.title,
        isExecutive: person.isExecutive,
        functionalRoles: person.functionalRoles,
        laneIds: laneId ? [laneId] : [],
        teamId: laneId ?? null,
      });

      if (person.role === "leader" && laneId) {
        await Team.findByIdAndUpdate(laneId, { $set: { leaderId: created._id } });
      }
      console.log(`Created user: ${person.name} (${person.email}) - ${person.title}`);
    } else {
      await User.findByIdAndUpdate(existing._id, {
        $set: {
          title: person.title,
          isExecutive: person.isExecutive,
          functionalRoles: person.functionalRoles,
          laneIds: laneId ? [laneId] : [],
        },
      });
      console.log(`Updated user profile: ${person.name} (${person.email})`);
    }
  }

  // 4. Backward Compatibility Owner
  const legacyEmail = (process.env.SEED_OWNER_EMAIL || "owner@makehappen.local").toLowerCase();
  const legacyOwner = await User.findOne({ email: legacyEmail });
  if (!legacyOwner) {
    await User.create({
      name: process.env.SEED_OWNER_NAME || "MakeHappen Owner",
      email: legacyEmail,
      passwordHash,
      role: "owner",
      title: "System Administrator",
      isExecutive: true,
      functionalRoles: ["founder_executive"],
      laneIds: [],
      teamId: null,
    });
    console.log(`Created legacy admin: ${legacyEmail}`);
  }

  console.log("Seeding finished successfully. Default password for all users is: changeme123");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
