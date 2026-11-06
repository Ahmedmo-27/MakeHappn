import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { isObjectId, sameId, toObjectId } from "@/lib/ids";
import { sendTeamAssignedEmail } from "@/lib/mail";
import { canViewEvent } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { Event } from "@/models/Event";
import { EventType } from "@/models/EventType";
import { Team } from "@/models/Team";
import { User } from "@/models/User";

export type EventTeam = { id: string; name: string; leaderId: string | null };

export type EventDetail = {
  id: string;
  name: string;
  typeId: string;
  typeName: string;
  start: string;
  end: string;
  teamIds: string[];
  notifiedTeamIds: string[];
  teams: EventTeam[];
};

export const getAccessibleEvent = cache(async (eventId: string) => {
  const user = await getCurrentUser();
  if (!isObjectId(eventId)) notFound();
  await connectDB();
  const event = await Event.findById(eventId);
  if (!event) notFound();

  const teamIds = event.teamIds.map((id) => String(id));
  if (!canViewEvent(user, teamIds)) redirect("/dashboard");

  const [eventType, teams] = await Promise.all([
    EventType.findById(event.typeId),
    Team.find({ _id: { $in: event.teamIds } }).sort({ name: 1 }),
  ]);

  const detail: EventDetail = {
    id: String(event._id),
    name: event.name,
    typeId: String(event.typeId),
    typeName: eventType?.name ?? "Event",
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    teamIds,
    notifiedTeamIds: (event.notifiedTeamIds ?? []).map((id) => String(id)),
    teams: teams.map((team) => ({
      id: String(team._id),
      name: team.name,
      leaderId: team.leaderId ? String(team.leaderId) : null,
    })),
  };

  return { user, event: detail, start: event.start, end: event.end };
});

export async function notifyPendingTeams(eventId: string): Promise<string[]> {
  await connectDB();
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  const notified = new Set((event.notifiedTeamIds ?? []).map((id) => String(id)));
  const pending = event.teamIds.filter((id) => !notified.has(String(id)));
  const warnings: string[] = [];
  const sent: string[] = [];

  for (const teamId of pending) {
    const team = await Team.findById(teamId);
    if (!team) continue;
    if (!team.leaderId) {
      warnings.push(`${team.name} has no team leader, so no assignment email was sent.`);
      continue;
    }
    const leader = await User.findById(team.leaderId);
    if (!leader) {
      warnings.push(`${team.name} has no team leader, so no assignment email was sent.`);
      continue;
    }

    const result = await sendTeamAssignedEmail({
      to: leader.email,
      leaderName: leader.name,
      teamName: team.name,
      eventName: event.name,
      start: event.start,
      end: event.end,
      eventPath: `/events/${event._id}/backlog`,
    });

    if (result.sent) {
      sent.push(String(team._id));
    } else {
      warnings.push(
        `Email to ${leader.name} (${team.name}) was not sent${result.error ? `: ${result.error}` : ""}.`,
      );
    }
  }

  if (sent.length > 0) {
    await Event.updateOne(
      { _id: event._id },
      { $addToSet: { notifiedTeamIds: { $each: sent.map((id) => toObjectId(id)) } } },
    );
  }

  return warnings;
}

export async function createEvent(input: {
  name: string;
  typeId: string;
  teamIds: string[];
  start: Date;
  end: Date;
}) {
  await connectDB();
  if (input.end < input.start) throw new Error("The end date must be on or after the start date");
  const uniqueTeams = [...new Set(input.teamIds)];
  if (uniqueTeams.length === 0) throw new Error("Assign at least one team");
  if (!isObjectId(input.typeId)) throw new Error("Choose an event type");

  const [eventType, teams] = await Promise.all([
    EventType.findById(input.typeId),
    Team.find({ _id: { $in: uniqueTeams } }),
  ]);
  if (!eventType) throw new Error("Choose an event type");
  if (teams.length !== uniqueTeams.length) throw new Error("One of the selected teams no longer exists");

  const event = await Event.create({
    name: input.name,
    typeId: eventType._id,
    start: input.start,
    end: input.end,
    teamIds: teams.map((team) => team._id),
    notifiedTeamIds: [],
  });

  const warnings = await notifyPendingTeams(String(event._id));
  return { id: String(event._id), warnings };
}

export async function addTeamToEvent(eventId: string, teamId: string) {
  await connectDB();
  if (!isObjectId(eventId) || !isObjectId(teamId)) throw new Error("Invalid id");
  const [event, team] = await Promise.all([Event.findById(eventId), Team.findById(teamId)]);
  if (!event || !team) throw new Error("Event or team not found");
  if (event.teamIds.some((id) => sameId(id, team._id))) {
    throw new Error("That team is already on this event");
  }
  event.teamIds.push(team._id);
  await event.save();
  return notifyPendingTeams(eventId);
}

export async function listEventsForUser(role: string, teamId: string | null) {
  await connectDB();
  if (role !== "owner" && !teamId) return [];
  const events = await Event.find(role === "owner" ? {} : { teamIds: teamId }).sort({ start: 1 });
  const typeIds = events.map((event) => event.typeId);
  const teamIds = events.flatMap((event) => event.teamIds);
  const [types, teams] = await Promise.all([
    EventType.find({ _id: { $in: typeIds } }),
    Team.find({ _id: { $in: teamIds } }),
  ]);
  const typeName = new Map(types.map((type) => [String(type._id), type.name]));
  const teamName = new Map(teams.map((team) => [String(team._id), team.name]));

  return events.map((event) => ({
    id: String(event._id),
    name: event.name,
    typeName: typeName.get(String(event.typeId)) ?? "Event",
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    teams: event.teamIds.map((id) => ({
      id: String(id),
      name: teamName.get(String(id)) ?? "Team",
    })),
  }));
}

export async function listCatalog() {
  await connectDB();
  const [types, teams] = await Promise.all([
    EventType.find().sort({ name: 1 }),
    Team.find().sort({ name: 1 }),
  ]);
  return {
    types: types.map((type) => ({ id: String(type._id), name: type.name })),
    teams: teams.map((team) => ({ id: String(team._id), name: team.name })),
  };
}
