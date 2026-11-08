import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { Client } from "../src/models/Client";
import { Event } from "../src/models/Event";
import { Project, type IProjectMilestone } from "../src/models/Project";
import { Task } from "../src/models/Task";
import { User } from "../src/models/User";
import { PROJECT_STAGES } from "../src/lib/domain";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
  }

  await connectDB();
  console.log("Connected to MongoDB. Starting legacy Event -> Project migration...");

  // 1. Ensure default fallback client exists
  let defaultClient = await Client.findOne({ name: "MakeHappen Studio Client" });
  if (!defaultClient) {
    defaultClient = await Client.create({
      name: "MakeHappen Studio Client",
      brandName: "MakeHappen Client",
      industry: "Experiential & Creative",
      contacts: [
        {
          name: "Studio Contact",
          email: "client@makehappen.local",
          isPrimary: true,
        },
      ],
      paymentTermsDays: 30,
      status: "active",
    });
    console.log("Created default Client:", defaultClient.name);
  }

  // 2. Find fallback project lead (owner or first user)
  const defaultLead =
    (await User.findOne({ role: "owner" })) ?? (await User.findOne());
  if (!defaultLead) {
    throw new Error("No user found in database. Run npm run seed first.");
  }

  // 3. Find all legacy events
  const legacyEvents = await Event.find().lean();
  console.log(`Found ${legacyEvents.length} legacy events to check.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < legacyEvents.length; i++) {
    const event = legacyEvents[i];
    const legacyCode = `MH-LEGACY-${String(i + 1).padStart(3, "0")}`;

    // Check if already migrated
    const existingProject = await Project.findOne({
      $or: [{ name: event.name }, { code: legacyCode }],
    });

    if (existingProject) {
      console.log(`Event "${event.name}" already migrated as ${existingProject.code}.`);
      skippedCount++;
      // Backfill tasks if needed
      await Task.updateMany(
        { eventId: event._id, projectId: { $exists: false } },
        { $set: { projectId: existingProject._id } },
      );
      continue;
    }

    const now = new Date();
    const isPast = event.end < now;
    const isCurrent = event.start <= now && now <= event.end;

    const stage = isPast
      ? "10_delivery_live_operations"
      : isCurrent
        ? "10_delivery_live_operations"
        : "05_kickoff_project_planning";

    const status = isPast ? "delivered" : isCurrent ? "in_progress" : "planning";

    const milestones: IProjectMilestone[] = PROJECT_STAGES.map((st) => ({
      stage: st,
      targetDate: st === "10_delivery_live_operations" ? event.end : null,
      completedAt: isPast ? event.end : null,
      isGateApproved: isPast,
      approvedById: defaultLead._id,
      approvalNotes: "Migrated from legacy Event record",
    }));

    const project = await Project.create({
      code: legacyCode,
      name: event.name,
      clientId: defaultClient._id,
      projectLeadId: defaultLead._id,
      products: ["turnkey_experience"],
      stage,
      bypassedStages: [],
      status,
      health: "on_track",
      brief: "Migrated from legacy experience booking.",
      objectives: "",
      audience: "",
      location: "",
      startDate: event.start,
      deliveryDate: event.end,
      closeDate: isPast ? event.end : null,
      isDelivered: isPast,
      currency: "USD",
      quotedValue: 0,
      approvedContractValue: 0,
      contractedRevisionRounds: 2,
      estimatedTotalCost: 0,
      committedTotalCost: 0,
      actualTotalCost: 0,
      milestones,
      teamUserIds: [defaultLead._id],
    });

    // Update tasks referencing this event
    const taskUpdate = await Task.updateMany(
      { eventId: event._id },
      { $set: { projectId: project._id, stage } },
    );

    console.log(
      `Migrated event "${event.name}" -> Project ${project.code} (${taskUpdate.modifiedCount} tasks linked).`,
    );
    migratedCount++;
  }

  console.log(
    `Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}.`,
  );
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
