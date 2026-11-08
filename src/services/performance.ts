import "server-only";
import { isTaskStatus, type Role } from "@/lib/domain";
import { utcToday } from "@/lib/format";
import { connectDB } from "@/lib/db";
import { donePercent, emptyCounts, totalOf, type StatusCounts } from "@/lib/stats";
import { Task } from "@/models/Task";
import { User } from "@/models/User";

export type PersonStat = {
  userId: string | null;
  name: string;
  role: Role | "unassigned";
  counts: StatusCounts;
  total: number;
  percent: number;
};

export type TeamStat = {
  teamId: string;
  name: string;
  counts: StatusCounts;
  total: number;
  percent: number;
  people: PersonStat[];
};

function personStat(userId: string | null, name: string, role: PersonStat["role"]): PersonStat {
  const counts = emptyCounts();
  return { userId, name, role, counts, total: 0, percent: 0 };
}

function finalize(counts: StatusCounts) {
  return { total: totalOf(counts), percent: donePercent(counts) };
}

export async function eventPerformance(
  eventId: string,
  teams: { id: string; name: string }[],
): Promise<TeamStat[]> {
  await connectDB();
  const tasks = await Task.find({ eventId }).select("teamId assigneeId status");
  const teamIds = teams.map((team) => team.id);
  const users = await User.find({
    teamId: { $in: teamIds },
    role: { $in: ["leader", "member"] },
  }).select("name role teamId");

  const byTeam = new Map<string, TeamStat>();
  for (const team of teams) {
    const counts = emptyCounts();
    byTeam.set(team.id, {
      teamId: team.id,
      name: team.name,
      counts,
      total: 0,
      percent: 0,
      people: users
        .filter((user) => String(user.teamId) === team.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((user) => personStat(String(user._id), user.name, user.role)),
    });
  }

  const extras = new Map<string, PersonStat>();

  for (const task of tasks) {
    if (!isTaskStatus(task.status)) continue;
    const team = byTeam.get(String(task.teamId));
    if (!team) continue;
    team.counts[task.status] += 1;

    if (!task.assigneeId) {
      let unassigned = team.people.find((person) => person.userId === null);
      if (!unassigned) {
        unassigned = personStat(null, "Unassigned", "unassigned");
        team.people.push(unassigned);
      }
      unassigned.counts[task.status] += 1;
      continue;
    }

    const assigneeId = String(task.assigneeId);
    let person = team.people.find((row) => row.userId === assigneeId);
    if (!person) {
      const key = `${team.teamId}:${assigneeId}`;
      person = extras.get(key);
      if (!person) {
        person = personStat(assigneeId, "Former teammate", "member");
        extras.set(key, person);
        team.people.push(person);
      }
    }
    person.counts[task.status] += 1;
  }

  const missingNames = [...extras.values()].map((person) => person.userId).filter(Boolean);
  if (missingNames.length > 0) {
    const named = await User.find({ _id: { $in: missingNames } }).select("name");
    const names = new Map(named.map((user) => [String(user._id), user.name]));
    for (const person of extras.values()) {
      if (person.userId && names.has(person.userId)) person.name = names.get(person.userId)!;
    }
  }

  return [...byTeam.values()].map((team) => {
    const summary = finalize(team.counts);
    return {
      ...team,
      ...summary,
      people: team.people.map((person) => ({ ...person, ...finalize(person.counts) })),
    };
  });
}

export async function summarizeEvents(eventIds: string[]) {
  const map = new Map<string, StatusCounts>();
  for (const id of eventIds) map.set(id, emptyCounts());
  if (eventIds.length === 0) return map;
  await connectDB();
  const tasks = await Task.find({ eventId: { $in: eventIds } }).select("eventId status");
  for (const task of tasks) {
    if (!isTaskStatus(task.status)) continue;
    const counts = map.get(String(task.eventId));
    if (counts) counts[task.status] += 1;
  }
  return map;
}

export async function countOverdueByEvent(eventIds: string[]) {
  const map = new Map<string, number>();
  for (const id of eventIds) map.set(id, 0);
  if (eventIds.length === 0) return map;
  await connectDB();
  const tasks = await Task.find({
    eventId: { $in: eventIds },
    dueDate: { $ne: null, $lt: utcToday() },
    status: { $ne: "done" },
  }).select("eventId");
  for (const task of tasks) {
    const id = String(task.eventId);
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}
