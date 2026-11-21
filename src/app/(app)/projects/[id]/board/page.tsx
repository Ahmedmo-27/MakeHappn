import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { listProjectBoardTasks, type ProjectTeam } from "@/services/tasks";
import {
  createProjectTaskAction,
  moveProjectTaskStatusAction,
} from "@/app/actions/tasks";
import {
  BOARD_STATUSES,
  STATUS_LABEL,
  PROJECT_STAGES,
  STAGE_LABELS,
  type ProjectStage,
} from "@/lib/domain";

type BoardData = Awaited<ReturnType<typeof listProjectBoardTasks>>;
type BoardTask = BoardData["tasks"][number];

export default function ProjectBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading project board" />}>
      <ProjectBoard params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectBoard({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const [user, project, boardData, sParams] = await Promise.all([
    getCurrentUser(),
    getProjectById(id),
    listProjectBoardTasks(id),
    searchParams,
  ]);

  if (!project) notFound();

  const notice = typeof sParams.notice === "string" ? sParams.notice : undefined;
  const error = typeof sParams.error === "string" ? sParams.error : undefined;

  const lead = project.projectLeadId as unknown as { _id?: unknown; name?: string } | null;
  const canManage =
    user.role === "owner" || !!user.isExecutive || (lead?._id ? lead._id.toString() === user.id : false);
  const { projectTeams, tasks } = boardData;

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Project Board</h2>
        <p className="hint" style={{ margin: "0.25rem 0" }}>
          One shared board for this project. Tasks can be assigned to any selected project member.
        </p>
      </div>

      {canManage ? (
        <Link className="btn btn-ghost" href={`/projects/${id}/setup/team`}>
          Manage project members
        </Link>
      ) : null}

      {projectTeams.length === 0 ? (
        <div className="empty">
          <p>No project members are available yet.</p>
          <p className="hint">
            {canManage
              ? "Add members in the Team setup tab before creating project tasks."
              : "The project lead must add project members before tasks can be assigned."}
          </p>
        </div>
      ) : null}

      {projectTeams.map((team) => (
        <TeamSection
          key={team.id}
          team={team}
          tasks={tasks.filter((task) => task.teamId === team.id)}
          projectId={id}
          projectStage={project.stage}
          canAddTasks={canManage || team.members.some((member) => member.id === user.id)}
        />
      ))}
    </div>
  );
}

function TeamSection({
  team,
  tasks,
  projectId,
  projectStage,
  canAddTasks,
}: {
  team: ProjectTeam;
  tasks: BoardTask[];
  projectId: string;
  projectStage: ProjectStage;
  canAddTasks: boolean;
}) {
  const open = tasks.filter((task) => task.status !== "done").length;
  const owners = team.members;
  const defaultOwnerId = owners.find((person) => person.id === team.leader?.id)?.id ?? owners[0]?.id ?? "";

  return (
    <section className="panel stack" style={{ gap: "1rem" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0 }}>{team.name}</h3>
          <p className="hint" style={{ margin: "0.25rem 0 0" }}>
            Project lead: <strong>{team.leader?.name ?? "Not set"}</strong>
            {team.leader?.title ? ` (${team.leader.title})` : ""}
          </p>
          {team.members.length > 0 ? (
            <p className="muted" style={{ margin: "0.15rem 0 0", fontSize: "0.8rem" }}>
              Members: {team.members.map((member) => member.name).join(", ")}
            </p>
          ) : null}
        </div>
        <span className="badge">{open} open</span>
      </div>

      {canAddTasks && owners.length > 0 ? (
        <details className="disclosure">
          <summary className="btn btn-primary" style={{ cursor: "pointer" }}>
            + Add task for {team.name}
          </summary>
          <div className="card form-card stack" style={{ marginTop: "1rem", maxWidth: "680px", gap: "1.25rem" }}>
            <form action={createProjectTaskAction} className="stack" style={{ gap: "1.15rem" }}>
              <input type="hidden" name="projectId" value={projectId} />

              <div className="form-group">
                <label>Task Title *</label>
                <input name="title" type="text" required placeholder="e.g. Produce fabrication drawings" className="input" />
              </div>

              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Accountable Owner *</label>
                  <select name="accountableOwnerId" required defaultValue={defaultOwnerId} className="select">
                    {owners.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} {person.title ? `(${person.title})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input name="dueDate" type="date" required className="input" />
                </div>
              </div>

              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" defaultValue="medium" className="select">
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pipeline Stage</label>
                  <select name="stage" defaultValue={projectStage} className="select">
                    {PROJECT_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {STAGE_LABELS[st].number} - {STAGE_LABELS[st].short}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Collaborators{" "}
                  <span className="muted" style={{ fontWeight: "normal" }}>(Anyone other than the accountable owner)</span>
                </label>
                <div className="check-list" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                  {owners.map((person) => (
                    <label key={person.id}>
                      <input type="checkbox" name="collaboratorIds" value={person.id} />
                      {person.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Operational Category</label>
                <select name="taskCategory" defaultValue="deliverable_prerequisite" className="select">
                  <option value="deliverable_prerequisite">Deliverable Prerequisite (Gate Blocking)</option>
                  <option value="continuous_support">Continuous Support (Non-Blocking, e.g. Social/Doc)</option>
                  <option value="operational_internal">Operational Internal</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                  <input type="checkbox" name="isGatePrerequisite" value="true" defaultChecked />
                  Prerequisite for Stage Gate Advancement
                </label>
              </div>

              <div className="form-group">
                <label>Description & Scope</label>
                <textarea name="description" rows={3} placeholder="Acceptance criteria, notes..." className="textarea" />
              </div>

              <div className="form-actions">
                <SubmitButton>Create Task</SubmitButton>
              </div>
            </form>
          </div>
        </details>
      ) : null}
      {canAddTasks && owners.length === 0 ? (
        <p className="hint">Add project members in the Team setup tab before adding tasks.</p>
      ) : null}

      <Columns tasks={tasks} projectId={projectId} />
    </section>
  );
}

function Columns({ tasks, projectId }: { tasks: BoardTask[]; projectId: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      {BOARD_STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <div
            key={status}
            style={{
              background: "var(--bg-subtle, var(--surface-2))",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle, var(--line))",
              padding: "0.75rem",
              minHeight: "220px",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                {STATUS_LABEL[status]}
              </h4>
              <span className="badge" style={{ fontSize: "0.75rem" }}>{columnTasks.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} projectId={projectId} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, projectId }: { task: BoardTask; projectId: string }) {
  const priorityColor =
    task.priority === "urgent"
      ? "var(--danger)"
      : task.priority === "high"
        ? "var(--warn)"
        : task.priority === "medium"
          ? "var(--info)"
          : "var(--muted)";

  return (
    <div
      className="card"
      style={{
        padding: "0.75rem",
        background: "var(--surface-2)",
        borderLeft: `3px solid ${priorityColor}`,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: priorityColor }}>
          {task.priority}
        </span>
      </div>

      <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{task.title}</h4>

      {task.description ? (
        <p className="muted" style={{ margin: 0, fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
          {task.description}
        </p>
      ) : null}

      <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
        Accountable: <strong>{task.owner?.name ?? "Unassigned"}</strong>
        {task.collaborators.length > 0 ? (
          <span> · with {task.collaborators.map((person) => person.name).filter(Boolean).join(", ")}</span>
        ) : null}
      </div>

      {task.dueDate ? (
        <span style={{ fontSize: "0.75rem" }} className="muted">
          Due: {formatDate(task.dueDate)}
        </span>
      ) : null}

      <form action={moveProjectTaskStatusAction} style={{ marginTop: "0.25rem" }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="taskId" value={task.id} />
        <AutoSubmitSelect
          name="status"
          defaultValue={task.status}
          className="select"
          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", width: "100%" }}
        >
          {BOARD_STATUSES.map((st) => (
            <option key={st} value={st}>
              Move to: {STATUS_LABEL[st]}
            </option>
          ))}
        </AutoSubmitSelect>
      </form>
    </div>
  );
}
