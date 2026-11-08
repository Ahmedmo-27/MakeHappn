import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getProjectById } from "@/services/projects";
import { listProjectBoardTasks } from "@/services/tasks";
import {
  createProjectTaskAction,
  moveProjectTaskStatusAction,
} from "@/app/actions/tasks";
import {
  BOARD_STATUSES,
  STATUS_LABEL,
  PROJECT_STAGES,
  STAGE_LABELS,
} from "@/lib/domain";

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
  const isLeadOrOwner = user.role === "owner" || (lead?._id ? lead._id.toString() === user.id : false);

  const columns = BOARD_STATUSES.map((status) => ({
    status,
    title: STATUS_LABEL[status],
    tasks: boardData.tasks.filter((t) => t.status === status),
  }));

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <Banner error={error} notice={notice} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Project Task Board</h2>
          <p className="hint" style={{ margin: "0.25rem 0" }}>
            Single accountable owner model. Each task is designated to one owner with cross-lane collaborators.
          </p>
        </div>

        {isLeadOrOwner ? (
          <details className="disclosure">
            <summary className="btn btn-primary" style={{ cursor: "pointer" }}>
              + Add Accountable Task
            </summary>
            <div className="card form-card stack" style={{ marginTop: "1rem", maxWidth: "680px", gap: "1.25rem" }}>
              <div className="form-header">
                <h3 className="form-title">New Accountable Task</h3>
                <p className="form-subtitle">Assign an accountable owner and lane to deliver studio scope.</p>
              </div>
              <form action={createProjectTaskAction} className="stack" style={{ gap: "1.15rem" }}>
                <input type="hidden" name="projectId" value={id} />

                <div className="form-group">
                  <label>Task Title *</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Produce technical fabrication drawings for kinetic sculpture"
                    className="input"
                  />
                </div>

                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Accountable Owner *</label>
                    <select name="accountableOwnerId" required className="select">
                      {boardData.roster.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name} {person.title ? `(${person.title})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Studio Lane *</label>
                    <select name="laneId" required className="select">
                      {boardData.lanes.map((lane) => (
                        <option key={lane.id} value={lane.id}>
                          {lane.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
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
                    <select name="stage" defaultValue={project.stage} className="select">
                      {PROJECT_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {STAGE_LABELS[st].number} - {STAGE_LABELS[st].short}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input name="dueDate" type="date" className="input" />
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
      </div>

      {/* Kanban Board Columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          alignItems: "flex-start",
        }}
      >
        {columns.map((col) => (
          <div
            key={col.status}
            style={{
              background: "var(--bg-subtle, #f9fafb)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle, #e5e7eb)",
              padding: "0.75rem",
              minHeight: "450px",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                {col.title}
              </h3>
              <span className="badge" style={{ fontSize: "0.75rem" }}>
                {col.tasks.length}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {col.tasks.map((task) => {
                const priorityColor =
                  task.priority === "urgent"
                    ? "#dc2626"
                    : task.priority === "high"
                      ? "#ea580c"
                      : task.priority === "medium"
                        ? "#2563eb"
                        : "#6b7280";

                return (
                  <div
                    key={task.id}
                    className="card"
                    style={{
                      padding: "0.75rem",
                      background: "#fff",
                      borderLeft: `3px solid ${priorityColor}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {task.laneName}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: priorityColor,
                        }}
                      >
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
                    </div>

                    {task.dueDate ? (
                      <span style={{ fontSize: "0.75rem" }} className="muted">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    ) : null}

                    {/* Quick Move Selector */}
                    <form action={moveProjectTaskStatusAction} style={{ marginTop: "0.25rem" }}>
                      <input type="hidden" name="projectId" value={id} />
                      <input type="hidden" name="taskId" value={task.id} />
                      <select
                        name="status"
                        defaultValue={task.status}
                        onChange={(e) => e.target.form?.requestSubmit()}
                        className="select"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", width: "100%" }}
                      >
                        {BOARD_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            Move to: {STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
