import "server-only";
import { notFound, redirect } from "next/navigation";
import {
  isBoardStatus,
  isTaskStatus,
  STATUS_LABEL,
  type BoardStatus,
  type TaskStatus,
  type ProjectStage,
} from "@/lib/domain";
import { connectDB } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { isObjectId, sameId, toObjectId } from "@/lib/ids";
import { sendTaskAssignedEmail } from "@/lib/mail";
import {
  canAssignTask,
  canChangeTaskStatus,
  canCommentOnTask,
  canEditTask,
  type SessionUser,
} from "@/lib/permissions";
import { Activity } from "@/models/Activity";
import { Comment } from "@/models/Comment";
import { Event } from "@/models/Event";
import { Task } from "@/models/Task";
import { Team } from "@/models/Team";
import { User } from "@/models/User";
import type { BoardTask } from "@/lib/board";
import { getAccessibleEvent } from "@/services/events";

function requireReason(reason: string | undefined): string {
  const value = reason?.trim() ?? "";
  if (!value) throw new Error("A reason is required");
  if (value.length > 1000) throw new Error("Reason must be 1000 characters or less");
  return value;
}

async function loadTask(taskId: string) {
  if (!isObjectId(taskId)) notFound();
  await connectDB();
  const task = await Task.findById(taskId);
  if (!task) notFound();
  return task;
}

async function assertAssignee(teamId: string, assigneeId: string) {
  if (!isObjectId(assigneeId)) throw new Error("Choose a person");
  const person = await User.findById(assigneeId);
  if (!person || !sameId(person.teamId, teamId)) {
    throw new Error("Assign someone from this task's team");
  }
  if (person.role !== "leader" && person.role !== "member") {
    throw new Error("Assign a team leader or member");
  }
  return person;
}

export async function listOpenTasks(userId: string) {
  await connectDB();
  const tasks = await Task.find({
    assigneeId: userId,
    status: { $nin: ["done", "backlog"] },
  })
    .sort({ dueDate: 1 })
    .limit(12);
  const eventIds = tasks
    .map((task) => task.eventId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const events = await Event.find({ _id: { $in: eventIds } }).select("name");
  const names = new Map(events.map((event) => [String(event._id), event.name]));
  return tasks.flatMap((task) => {
    if (!isTaskStatus(task.status)) return [];
    return [
      {
        id: String(task._id),
        title: task.title,
        status: task.status,
        eventId: String(task.eventId),
        eventName: names.get(String(task.eventId)) ?? "Event",
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      },
    ];
  });
}

export async function teamRoster(teamId: string) {
  await connectDB();
  const people = await User.find({
    teamId,
    role: { $in: ["leader", "member"] },
  }).sort({ name: 1 });
  return people.map((person) => ({
    id: String(person._id),
    name: person.name,
    role: person.role,
  }));
}

export async function listBacklog(eventId: string, user: SessionUser) {
  const { event } = await getAccessibleEvent(eventId);
  await connectDB();
  const teamFilter = user.role === "owner" ? {} : { teamId: user.teamId };
  const tasks = await Task.find({ eventId: event.id, status: "backlog", ...teamFilter }).sort({
    createdAt: 1,
  });
  const rosterIds = user.role === "owner" ? event.teamIds : user.teamId ? [user.teamId] : [];
  const people = await User.find({
    teamId: { $in: rosterIds },
    role: { $in: ["leader", "member"] },
  }).sort({ name: 1 });

  return {
    event,
    tasks: tasks.map((task) => ({
      id: String(task._id),
      title: task.title,
      description: task.description,
      teamId: String(task.teamId),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    })),
    people: people.map((person) => ({
      id: String(person._id),
      name: person.name,
      teamId: String(person.teamId),
      role: person.role,
    })),
  };
}

export async function createTask(input: {
  actor: SessionUser;
  eventId: string;
  teamId: string;
  title: string;
  description: string;
  dueDate: Date | null;
}) {
  if (input.actor.role !== "owner") throw new Error("Only the owner can add backlog tasks");
  const { event } = await getAccessibleEvent(input.eventId);
  if (!event.teamIds.includes(input.teamId)) {
    throw new Error("Assign the task to a team on this event");
  }
  await connectDB();
  const task = await Task.create({
    eventId: toObjectId(event.id),
    teamId: toObjectId(input.teamId),
    assigneeId: null,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    status: "backlog",
  });
  return String(task._id);
}

export async function assignTask(input: {
  actor: SessionUser;
  taskId: string;
  assigneeId: string;
  reason?: string;
}) {
  const task = await loadTask(input.taskId);
  const { event } = await getAccessibleEvent(String(task.eventId));
  if (!canAssignTask(input.actor, String(task.teamId))) {
    throw new Error("You cannot assign this task");
  }
  const person = await assertAssignee(String(task.teamId), input.assigneeId);
  const fromAssignee = task.assigneeId ? String(task.assigneeId) : null;
  const movingOut = task.status === "backlog";
  if (!movingOut && fromAssignee === String(person._id)) {
    throw new Error("This person is already assigned");
  }
  const reason = movingOut ? requireReason(input.reason) : undefined;

  task.assigneeId = person._id;
  if (movingOut) task.status = "todo";
  await task.save();

  if (fromAssignee !== String(person._id)) {
    await Activity.create({
      taskId: task._id,
      eventId: task.eventId,
      actorId: toObjectId(input.actor.id),
      type: "assignment",
      fromAssigneeId: fromAssignee ? toObjectId(fromAssignee) : null,
      toAssigneeId: person._id,
    });
  }
  if (movingOut) {
    await Activity.create({
      taskId: task._id,
      eventId: task.eventId,
      actorId: toObjectId(input.actor.id),
      type: "status",
      fromStatus: "backlog",
      toStatus: "todo",
      reason,
    });
  }

  if (String(person._id) === input.actor.id) return "Task assigned";
  const mailed = await sendTaskAssignedEmail({
    to: person.email,
    assigneeName: person.name,
    taskTitle: task.title,
    eventName: event.name,
    dueDate: task.dueDate,
    taskPath: `/events/${event.id}/tasks/${task._id}`,
  });
  if (mailed.sent) return `Task assigned. ${person.name} was emailed.`;
  const reasonText = mailed.error ? `: ${mailed.error}` : "";
  return `Task assigned. Email to ${person.name} was not sent${reasonText}.`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export async function updateTask(input: {
  actor: SessionUser;
  taskId: string;
  title: string;
  description: string;
  dueDate: Date | null;
  teamId?: string;
}) {
  const task = await loadTask(input.taskId);
  const { event } = await getAccessibleEvent(String(task.eventId));
  if (!canEditTask(input.actor, String(task.teamId))) {
    throw new Error("You cannot edit this task");
  }
  const previous = {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    teamId: task.teamId,
  };

  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  if (title.length > 160) throw new Error("Title must be 160 characters or less");
  const description = input.description.trim();
  if (description.length > 8000) throw new Error("Description is too long");

  const edited: string[] = [];
  const cleared: string[] = [];
  if (title !== task.title) {
    edited.push("the title");
    task.title = title;
  }
  if (description !== task.description) {
    edited.push("the description");
    task.description = description;
  }

  const nextDue = input.dueDate?.getTime() ?? null;
  const currentDue = task.dueDate?.getTime() ?? null;
  if (nextDue !== currentDue) {
    if (input.dueDate) edited.push(`the due date to ${formatDate(input.dueDate)}`);
    else cleared.push("the due date");
    task.dueDate = input.dueDate;
  }

  const nextTeamId = input.teamId?.trim() ?? "";
  if (nextTeamId && nextTeamId !== String(task.teamId)) {
    if (input.actor.role !== "owner") throw new Error("Only the owner can change the team");
    if (task.status !== "backlog") {
      throw new Error("The team can change only while the task is in the backlog");
    }
    if (!event.teamIds.includes(nextTeamId)) {
      throw new Error("Assign the task to a team on this event");
    }
    const team = await Team.findById(nextTeamId);
    if (!team) throw new Error("That team no longer exists");
    edited.push(`the team to ${team.name}`);
    task.teamId = team._id;
  }

  if (edited.length === 0 && cleared.length === 0) {
    return { notice: "Nothing changed" };
  }

  await task.save();
  const parts: string[] = [];
  if (edited.length > 0) parts.push(`changed ${joinList(edited)}`);
  if (cleared.length > 0) parts.push(`cleared ${joinList(cleared)}`);
  try {
    await Activity.create({
      taskId: task._id,
      eventId: task.eventId,
      actorId: toObjectId(input.actor.id),
      type: "edit",
      detail: parts.join(" and "),
    });
  } catch (error) {
    task.title = previous.title;
    task.description = previous.description;
    task.dueDate = previous.dueDate;
    task.teamId = previous.teamId;
    await task.save();
    throw error;
  }
  return { notice: "Task updated" };
}

export async function updateTaskStatus(input: {
  actor: SessionUser;
  taskId: string;
  toStatus: string;
  reason: string;
}) {
  const task = await loadTask(input.taskId);
  if (!canChangeTaskStatus(input.actor, {
    teamId: String(task.teamId),
    assigneeId: task.assigneeId ? String(task.assigneeId) : null,
  })) {
    throw new Error("You cannot change this task");
  }
  if (task.status === "backlog") {
    throw new Error("Assign this task before moving it on the board");
  }
  if (!isBoardStatus(input.toStatus)) throw new Error("Choose a board status");
  if (task.status === input.toStatus) throw new Error("Choose a different status");
  const reason = requireReason(input.reason);
  const fromStatus = task.status;
  task.status = input.toStatus;
  await task.save();
  await Activity.create({
    taskId: task._id,
    eventId: task.eventId,
    actorId: toObjectId(input.actor.id),
    type: "status",
    fromStatus,
    toStatus: input.toStatus,
    reason,
  });
  return { eventId: String(task.eventId), taskId: String(task._id) };
}

export async function addComment(input: { actor: SessionUser; taskId: string; body: string }) {
  const task = await loadTask(input.taskId);
  const event = await Event.findById(task.eventId);
  if (!event) notFound();
  const eventTeamIds = event.teamIds.map((id) => String(id));
  if (!canCommentOnTask(input.actor, String(task.teamId), eventTeamIds)) {
    redirect("/dashboard");
  }
  const body = input.body.trim();
  if (!body) throw new Error("Write a comment");
  if (body.length > 4000) throw new Error("Comment must be 4000 characters or less");

  await Comment.create({
    taskId: task._id,
    authorId: toObjectId(input.actor.id),
    body,
  });
  await Activity.create({
    taskId: task._id,
    eventId: task.eventId,
    actorId: toObjectId(input.actor.id),
    type: "comment",
  });
  return { eventId: String(task.eventId), taskId: String(task._id) };
}

export async function listBoardTasks(eventId: string, user: SessionUser, teamFilter: string | null) {
  const { event } = await getAccessibleEvent(eventId);
  await connectDB();
  const scopedTeam = user.role === "owner" ? teamFilter : user.teamId;
  const query: { eventId: string; status: { $in: BoardStatus[] }; teamId?: string } = {
    eventId: event.id,
    status: { $in: ["todo", "in_progress", "in_review", "blocked", "done"] },
  };
  if (scopedTeam) query.teamId = scopedTeam;

  const tasks = await Task.find(query).sort({ createdAt: 1 });
  const assigneeIds = tasks.map((task) => task.assigneeId).filter(Boolean);
  const users = await User.find({ _id: { $in: assigneeIds } }).select("name");
  const names = new Map(users.map((person) => [String(person._id), person.name]));
  const teamNames = new Map(event.teams.map((team) => [team.id, team.name]));

  const cards: BoardTask[] = tasks.flatMap((task) => {
    if (!isBoardStatus(task.status)) return [];
    const assigneeId = task.assigneeId ? String(task.assigneeId) : null;
    return [
      {
        id: String(task._id),
        title: task.title,
        status: task.status,
        assigneeId,
        assigneeName: assigneeId ? (names.get(assigneeId) ?? "Unknown") : "Unassigned",
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        teamId: String(task.teamId),
        teamName: teamNames.get(String(task.teamId)) ?? "Team",
        canDrag: canChangeTaskStatus(user, { teamId: String(task.teamId), assigneeId }),
      },
    ];
  });

  return { event, tasks: cards, teamFilter: scopedTeam };
}

export type TaskDetail = {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  description: string;
  status: TaskStatus;
  statusLabel: string;
  teamId: string;
  teamName: string;
  assigneeId: string | null;
  assigneeName: string;
  dueDate: string | null;
  canAssign: boolean;
  canChangeStatus: boolean;
  canEdit: boolean;
  canChangeTeam: boolean;
  teams: { id: string; name: string }[];
  roster: { id: string; name: string; role: string }[];
  comments: { id: string; body: string; authorName: string; createdAt: string }[];
  activity: { id: string; text: string; createdAt: string }[];
};

export async function getTaskDetail(eventId: string, taskId: string, user: SessionUser): Promise<TaskDetail> {
  const { event } = await getAccessibleEvent(eventId);
  const task = await loadTask(taskId);
  if (!sameId(task.eventId, event.id)) notFound();
  if (user.role !== "owner" && user.teamId !== String(task.teamId)) redirect("/dashboard");
  if (!isTaskStatus(task.status)) throw new Error("Unknown status");

  const [comments, activity, roster, team] = await Promise.all([
    Comment.find({ taskId: task._id }).sort({ createdAt: 1 }),
    Activity.find({ taskId: task._id }).sort({ createdAt: -1 }),
    teamRoster(String(task.teamId)),
    Team.findById(task.teamId),
  ]);

  const ids = new Set<string>();
  if (task.assigneeId) ids.add(String(task.assigneeId));
  for (const comment of comments) ids.add(String(comment.authorId));
  for (const entry of activity) {
    ids.add(String(entry.actorId));
    if (entry.fromAssigneeId) ids.add(String(entry.fromAssigneeId));
    if (entry.toAssigneeId) ids.add(String(entry.toAssigneeId));
  }
  const people = await User.find({ _id: { $in: [...ids] } }).select("name");
  const names = new Map(people.map((person) => [String(person._id), person.name]));
  const nameOf = (id: unknown, fallback = "Someone") =>
    id ? (names.get(String(id)) ?? fallback) : "Unassigned";

  return {
    id: String(task._id),
    eventId: event.id,
    eventName: event.name,
    title: task.title,
    description: task.description,
    status: task.status,
    statusLabel: STATUS_LABEL[task.status],
    teamId: String(task.teamId),
    teamName: team?.name ?? "Team",
    assigneeId: task.assigneeId ? String(task.assigneeId) : null,
    assigneeName: task.assigneeId ? nameOf(task.assigneeId) : "Unassigned",
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    canAssign: canAssignTask(user, String(task.teamId)),
    canChangeStatus: canChangeTaskStatus(user, {
      teamId: String(task.teamId),
      assigneeId: task.assigneeId ? String(task.assigneeId) : null,
    }),
    canEdit: canEditTask(user, String(task.teamId)),
    canChangeTeam: user.role === "owner" && task.status === "backlog",
    teams: event.teams.map((team) => ({ id: team.id, name: team.name })),
    roster,
    comments: comments.map((comment) => ({
      id: String(comment._id),
      body: comment.body,
      authorName: nameOf(comment.authorId),
      createdAt: comment.createdAt.toISOString(),
    })),
    activity: activity.map((entry) => ({
      id: String(entry._id),
      createdAt: entry.createdAt.toISOString(),
      text: describeActivity(entry, nameOf),
    })),
  };
}

function describeActivity(
  entry: {
    type: string;
    actorId: unknown;
    fromStatus?: string;
    toStatus?: string;
    reason?: string;
    fromAssigneeId?: unknown;
    toAssigneeId?: unknown;
    detail?: string;
  },
  nameOf: (id: unknown, fallback?: string) => string,
): string {
  const actor = nameOf(entry.actorId);
  if (entry.type === "status" && entry.fromStatus && entry.toStatus && isTaskStatus(entry.fromStatus) && isTaskStatus(entry.toStatus)) {
    return `${actor} moved this from ${STATUS_LABEL[entry.fromStatus]} to ${STATUS_LABEL[entry.toStatus]}. Reason: ${entry.reason || "No reason recorded"}`;
  }
  if (entry.type === "assignment") {
    return `${actor} assigned this from ${nameOf(entry.fromAssigneeId, "Unassigned")} to ${nameOf(entry.toAssigneeId)}`;
  }
  if (entry.type === "comment") return `${actor} commented`;
  if (entry.type === "edit") return `${actor} ${entry.detail || "updated this task"}.`;
  return `${actor} updated this task`;
}

export async function listProjectBoardTasks(projectId: string) {
  await connectDB();
  const [tasks, users, teams] = await Promise.all([
    Task.find({ projectId: toObjectId(projectId) })
      .populate("accountableOwnerId", "name title")
      .populate("collaboratorIds", "name title")
      .populate("teamId", "name")
      .sort({ createdAt: -1 })
      .lean(),
    User.find().select("name email title role functionalRoles").sort({ name: 1 }).lean(),
    Team.find().select("name").sort({ name: 1 }).lean(),
  ]);

  return {
    tasks: tasks.map((t) => ({
      id: String(t._id),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority ?? "medium",
      stage: t.stage ?? null,
      taskCategory: t.taskCategory ?? "deliverable_prerequisite",
      isGatePrerequisite: t.isGatePrerequisite ?? true,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      laneName: (t.teamId as unknown as { name?: string })?.name ?? "General",
      owner: t.accountableOwnerId as unknown as { _id?: unknown; name?: string; title?: string } | null,
      collaborators: (t.collaboratorIds as unknown as Array<{ _id?: unknown; name?: string }>) ?? [],
    })),
    roster: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      title: u.title ?? "",
      role: u.role,
    })),
    lanes: teams.map((team) => ({
      id: String(team._id),
      name: team.name,
    })),
  };
}

export async function createProjectTask(input: {
  projectId: string;
  stage?: string | null;
  laneId: string;
  accountableOwnerId: string;
  collaboratorIds?: string[];
  title: string;
  description?: string;
  dueDate?: Date | null;
  priority?: "urgent" | "high" | "medium" | "low";
  taskCategory?: "deliverable_prerequisite" | "continuous_support" | "operational_internal";
  isGatePrerequisite?: boolean;
}) {
  await connectDB();
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Task title is required");
  }

  const ownerId = toObjectId(input.accountableOwnerId);
  const task = await Task.create({
    projectId: toObjectId(input.projectId),
    stage: (input.stage as ProjectStage) ?? undefined,
    teamId: toObjectId(input.laneId),
    accountableOwnerId: ownerId,
    assigneeId: ownerId,
    collaboratorIds: (input.collaboratorIds ?? []).map(toObjectId),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    dueDate: input.dueDate ?? null,
    status: "todo",
    priority: input.priority ?? "medium",
    taskCategory: input.taskCategory ?? "deliverable_prerequisite",
    isGatePrerequisite: input.isGatePrerequisite ?? true,
    dependsOnTaskIds: [],
  });

  return task;
}

export async function moveProjectTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  actorId: string,
  reason?: string,
) {
  await connectDB();
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  const prevStatus = task.status;
  task.status = newStatus;
  await task.save();

  await Activity.create({
    taskId: task._id,
    actorId: toObjectId(actorId),
    type: "status",
    fromStatus: prevStatus,
    toStatus: newStatus,
    reason: reason?.trim() || "Status updated on project board",
  });

  return task;
}
