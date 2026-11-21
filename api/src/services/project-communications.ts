import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { sendProjectTeamNotificationEmail } from "@/lib/mail";
import { Project } from "@/models/Project";
import { User } from "@/models/User";

export async function getProjectCommunicationDetails(projectId: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(projectId)) throw new Error("Project not found");

  const project = await Project.findById(projectId)
    .select("name code brief projectLeadId teamUserIds")
    .lean();
  if (!project) throw new Error("Project not found");

  const memberIds = [...new Set([String(project.projectLeadId), ...project.teamUserIds.map(String)])];
  const members = await User.find({
    _id: { $in: memberIds },
    isActive: { $ne: false },
    isVacant: { $ne: true },
  })
    .select("name email")
    .sort({ name: 1 })
    .lean();

  return {
    name: project.name,
    code: project.code,
    brief: project.brief,
    members: members.map((member) => ({ name: member.name, email: member.email })),
  };
}

export async function notifyProjectTeam(projectId: string) {
  const project = await getProjectCommunicationDetails(projectId);
  if (project.members.length === 0) throw new Error("Add project members before notifying the team");
  if (project.members.some((member) => !member.email?.trim())) {
    throw new Error("Add an email address for each project member before notifying the team");
  }

  const result = await sendProjectTeamNotificationEmail({
    to: project.members.map((member) => member.email.trim().toLowerCase()),
    projectName: project.name,
    projectCode: project.code,
    projectPath: `/projects/${projectId}`,
  });
  if (!result.sent) throw new Error(result.error ?? "Could not send the team notification");
  return { sentCount: project.members.length };
}
