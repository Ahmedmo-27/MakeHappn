import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { EventType } from "../src/models/EventType";
import { Team } from "../src/models/Team";
import { User } from "../src/models/User";

const TEAMS = ["Planning", "Production", "Installment", "Finance"];
const EVENT_TYPES = [
  "Brand experience",
  "Pop-up",
  "Installation",
  "Space",
  "Corporate",
  "Wedding",
  "Conference",
  "Private",
  "Exhibition",
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
  }

  await connectDB();

  for (const name of TEAMS) {
    await Team.updateOne({ name }, { $setOnInsert: { name, leaderId: null } }, { upsert: true });
  }

  for (const name of EVENT_TYPES) {
    await EventType.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }

  const email = (process.env.SEED_OWNER_EMAIL || "owner@makehappen.local").toLowerCase();
  const name = process.env.SEED_OWNER_NAME || "MakeHappen Owner";
  const password = process.env.SEED_OWNER_PASSWORD || "changeme123";
  const existing = await User.findOne({ email });

  if (!existing) {
    await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "owner",
      teamId: null,
    });
    console.log(`Created owner ${email}`);
  } else {
    console.log(`Owner already exists: ${email}`);
  }

  console.log("Seeded teams:", TEAMS.join(", "));
  console.log("Seeded event types:", EVENT_TYPES.join(", "));
  console.log(`Sign in at /login with ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
