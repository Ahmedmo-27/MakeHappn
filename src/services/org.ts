import "server-only";
import bcrypt from "bcryptjs";
import { isRole, type Role } from "@/lib/domain";
import { connectDB } from "@/lib/db";
import { escapeRegex } from "@/lib/parse";
import { sameId, toObjectId } from "@/lib/ids";
import { EventType } from "@/models/EventType";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

async function assertUniqueTeam(name: string, ignoreId?: string) {
  const existing = await Team.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, "i"),
  }).select("_id");
  if (existing && !sameId(existing._id, ignoreId)) {
    throw new Error("That name is already in use");
  }
}

async function assertUniqueEventType(name: string, ignoreId?: string) {
  const existing = await EventType.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, "i"),
  }).select("_id");
  if (existing && !sameId(existing._id, ignoreId)) {
    throw new Error("That name is already in use");
  }
}

export async function listPeople() {
  await connectDB();
  const [users, teams] = await Promise.all([
    User.find().sort({ name: 1 }),
    Team.find().sort({ name: 1 }),
  ]);
  const teamName = new Map(teams.map((team) => [String(team._id), team.name]));
  return {
    teams: teams.map((team) => ({
      id: String(team._id),
      name: team.name,
      leaderId: team.leaderId ? String(team.leaderId) : null,
    })),
    people: users.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title ?? "",
      jobDescription: user.jobDescription ?? "",
      weeklyCapacityHours: user.weeklyCapacityHours ?? 40,
      reportsToId: user.reportsToId ? String(user.reportsToId) : null,
      teamId: user.teamId ? String(user.teamId) : null,
      teamName: user.teamId ? (teamName.get(String(user.teamId)) ?? "Unknown team") : null,
    })),
  };
}

async function releaseLeadership(userId: string, teamId: string | null) {
  if (!teamId) return;
  await Team.updateOne({ _id: teamId, leaderId: userId }, { $set: { leaderId: null } });
}

export async function createPerson(input: {
  name: string;
  email: string;
  title?: string;
  password: string;
  role: Role;
  teamId: string | null;
  jobDescription?: string;
  weeklyCapacityHours?: number;
  reportsToId?: string | null;
}) {
  await connectDB();
  if (!isRole(input.role)) throw new Error("Choose a role");
  const profile = {
    jobDescription: input.jobDescription ?? "",
    weeklyCapacityHours: input.weeklyCapacityHours ?? 40,
    reportsToId: input.reportsToId ? toObjectId(input.reportsToId) : null,
  };
  if (input.role === "owner") {
    await User.create({
      name: input.name,
      email: input.email,
      title: input.title ?? "",
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "owner",
      isExecutive: true,
      teamId: null,
      ...profile,
    });
    return;
  }
  if (!input.teamId) throw new Error("Choose a team");
  const team = await Team.findById(input.teamId);
  if (!team) throw new Error("Team not found");
  if (input.role === "leader" && team.leaderId) {
    throw new Error("That team already has a leader");
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    title: input.title ?? "",
    passwordHash: await bcrypt.hash(input.password, 12),
    role: input.role,
    teamId: team._id,
    ...profile,
  });

  if (input.role === "leader") {
    team.leaderId = user._id;
    await team.save();
  }
}

export async function updatePerson(input: {
  id: string;
  name: string;
  email: string;
  title?: string;
  password?: string;
  role: Role;
  teamId: string | null;
  jobDescription?: string;
  weeklyCapacityHours?: number;
  reportsToId?: string | null;
}) {
  await connectDB();
  if (!isRole(input.role)) throw new Error("Choose a role");
  const user = await User.findById(input.id).select("+passwordHash");
  if (!user) throw new Error("Person not found");

  const duplicate = await User.findOne({ email: input.email, _id: { $ne: user._id } }).select("_id");
  if (duplicate) throw new Error("That email is already in use");

  if (user.role === "owner" && input.role !== "owner") {
    const owners = await User.countDocuments({ role: "owner" });
    if (owners <= 1) throw new Error("Keep at least one owner");
  }

  const nextTeamId = input.role === "owner" ? null : input.teamId;
  if (input.role !== "owner" && !nextTeamId) throw new Error("Choose a team");

  if (input.role === "leader" && nextTeamId) {
    const team = await Team.findById(nextTeamId);
    if (!team) throw new Error("Team not found");
    if (team.leaderId && !sameId(team.leaderId, user._id)) {
      throw new Error("That team already has a leader");
    }
  }

  const previousTeamId = user.teamId ? String(user.teamId) : null;
  const staysLeader =
    user.role === "leader" && input.role === "leader" && previousTeamId === nextTeamId;
  if (user.role === "leader" && !staysLeader) {
    await releaseLeadership(String(user._id), previousTeamId);
  }

  user.name = input.name;
  user.email = input.email;
  if (input.title !== undefined) user.title = input.title;
  if (input.jobDescription !== undefined) user.jobDescription = input.jobDescription;
  if (input.weeklyCapacityHours !== undefined) user.weeklyCapacityHours = input.weeklyCapacityHours;
  if (input.reportsToId !== undefined) {
    user.reportsToId = input.reportsToId ? toObjectId(input.reportsToId) : null;
  }
  user.role = input.role;
  user.teamId = nextTeamId ? toObjectId(nextTeamId) : null;
  if (input.password) user.passwordHash = await bcrypt.hash(input.password, 12);
  await user.save();

  if (input.role === "leader" && nextTeamId) {
    await Team.updateOne({ _id: nextTeamId }, { $set: { leaderId: user._id } });
  }
}

export async function listTeamsWithPeople() {
  await connectDB();
  const [teams, users] = await Promise.all([
    Team.find().sort({ name: 1 }),
    User.find({ role: { $in: ["leader", "member"] } }).sort({ name: 1 }),
  ]);
  return teams.map((team) => ({
    id: String(team._id),
    name: team.name,
    leaderId: team.leaderId ? String(team.leaderId) : null,
    people: users
      .filter((user) => sameId(user.teamId, team._id))
      .map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      })),
  }));
}

export async function createTeam(name: string) {
  await connectDB();
  await assertUniqueTeam(name);
  await Team.create({ name, leaderId: null });
}

export async function renameTeam(teamId: string, name: string) {
  await connectDB();
  const team = await Team.findById(teamId);
  if (!team) throw new Error("Team not found");
  await assertUniqueTeam(name, teamId);
  team.name = name;
  await team.save();
}

export async function promoteLeader(teamId: string, userId: string) {
  await connectDB();
  const [team, user] = await Promise.all([Team.findById(teamId), User.findById(userId)]);
  if (!team || !user) throw new Error("Team or person not found");
  if (!sameId(user.teamId, team._id) || user.role === "owner") {
    throw new Error("Choose a member of this team");
  }
  if (sameId(team.leaderId, user._id) && user.role === "leader") return;

  if (team.leaderId && !sameId(team.leaderId, user._id)) {
    await User.updateOne({ _id: team.leaderId }, { $set: { role: "member" } });
  }

  user.role = "leader";
  await user.save();
  team.leaderId = user._id;
  await team.save();
}

export async function listEventTypes() {
  await connectDB();
  const types = await EventType.find().sort({ name: 1 });
  return types.map((type) => ({ id: String(type._id), name: type.name }));
}

export async function createEventType(name: string) {
  await connectDB();
  await assertUniqueEventType(name);
  await EventType.create({ name });
}

export async function renameEventType(typeId: string, name: string) {
  await connectDB();
  const eventType = await EventType.findById(typeId);
  if (!eventType) throw new Error("Event type not found");
  await assertUniqueEventType(name, typeId);
  eventType.name = name;
  await eventType.save();
}
