import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, readMessage } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/domain";
import { getCurrentUser } from "@/lib/session";
import { createLeaveFormAction, linkDependencyFormAction } from "@/app/actions/studio-ops";
import { rosterForOps, studioTasks } from "@/services/studio-ops";

export default function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="page"><PageFallback label="Loading tasks" /></div>}>
      <Tasks searchParams={searchParams} />
    </Suspense>
  );
}

function idOf(value: unknown) {
  if (value && typeof value === "object" && "_id" in value) return String((value as { _id: unknown })._id);
  return value ? String(value) : "";
}

async function Tasks({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [user, params, tasks, roster] = await Promise.all([
    getCurrentUser(),
    searchParams,
    studioTasks(),
    rosterForOps(),
  ]);
  const flash = readMessage(params);
  const view = typeof params.view === "string" ? params.view : "mine";
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  const soon = new Date(now);
  soon.setDate(now.getDate() + 3);

  const mine = (owner: unknown) => idOf(owner) === user.id;
  const open = tasks.filter((task) => task.status !== "done");
  const filtered = open.filter((task) => {
    if (view === "team") return true;
    if (view === "overdue") return task.dueDate && new Date(task.dueDate) < now;
    if (view === "week") return task.dueDate && new Date(task.dueDate) <= weekEnd;
    return mine(task.accountableOwnerId);
  });
  const reminders = open.filter(
    (task) => mine(task.accountableOwnerId) && task.dueDate && new Date(task.dueDate) >= now && new Date(task.dueDate) <= soon,
  );
  const doneThisWeek = tasks.filter(
    (task) => task.status === "done" && task.updatedAt && new Date(task.updatedAt) >= new Date(now.getTime() - 7 * 86400000),
  );

  const load = roster.map((person) => {
    const owned = open.filter((task) => idOf(task.accountableOwnerId) === String(person._id));
    const hours = person.weeklyCapacityHours || 40;
    return { person, count: owned.length, hours, pressure: Math.round((owned.length * 4 / hours) * 100) };
  });

  const views = [
    { id: "mine", label: "My tasks" },
    { id: "team", label: "Team tasks" },
    { id: "week", label: "This week" },
    { id: "overdue", label: "Overdue" },
  ];

  return (
    <div className="page page-wide">
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div>
          <p className="kicker">Daily execution</p>
          <h1>Tasks</h1>
          <p className="lede">What needs to get done, by whom, and by when. Dependencies block a task until the earlier one is done.</p>
        </div>
      </header>

      <nav className="segmented" aria-label="Task view">
        {views.map((item) => (
          <Link key={item.id} href={`/tasks?view=${item.id}`} className={view === item.id ? "active" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Open in this view</span>
          <span className="kpi-value">{filtered.length}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Reminders, next 3 days</span>
          <span className="kpi-value">{reminders.length}</span>
        </div>
        <div className="kpi is-good">
          <span className="kpi-label">Completed in 7 days</span>
          <span className="kpi-value">{doneThisWeek.length}</span>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <div className="section-head"><h2>Work list</h2></div>
          {filtered.length === 0 ? <p className="muted">Nothing in this view.</p> : (
            <ul className="attn-list">
              {filtered.map((task) => {
                const project = task.projectId as unknown as { _id?: unknown; code?: string; name?: string } | null;
                const owner = task.accountableOwnerId as unknown as { name?: string } | null;
                const deps = (task.dependsOnTaskIds ?? []) as unknown as Array<{ title?: string; status?: string } | string>;
                const blocked = deps.some((dep) => typeof dep === "object" && dep.status && dep.status !== "done");
                const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== "done";
                return (
                  <li key={String(task._id)}>
                    <div className="card stack" style={{ gap: "0.45rem" }}>
                      <div className="row">
                        <strong>{task.title}</strong>
                        <span className={overdue ? "badge badge-danger" : "badge"}>{STATUS_LABEL[task.status]}</span>
                      </div>
                      <p className="muted" style={{ margin: 0 }}>
                        {owner?.name ?? "Unassigned"} · {task.priority} · {task.dueDate ? formatDate(task.dueDate) : "No deadline"}
                        {project?._id ? ` · ${project.code}` : ""}
                      </p>
                      {blocked ? <p className="hint">Waiting on a dependency that is not done.</p> : null}
                      {deps.length > 0 ? (
                        <p className="hint">Depends on {deps.map((dep) => (typeof dep === "object" ? dep.title : "task")).filter(Boolean).join(", ")}</p>
                      ) : null}
                      <form action={linkDependencyFormAction} className="row" style={{ gap: "0.5rem", alignItems: "end" }}>
                        <input type="hidden" name="taskId" value={String(task._id)} />
                        <label className="field" style={{ flex: 1 }}>
                          <span>Add dependency</span>
                          <select className="select" name="dependsOnId" required>
                            <option value="">Choose a task</option>
                            {tasks.filter((other) => String(other._id) !== String(task._id)).slice(0, 40).map((other) => (
                              <option key={String(other._id)} value={String(other._id)}>{other.title}</option>
                            ))}
                          </select>
                        </label>
                        <SubmitButton variant="ghost">Link</SubmitButton>
                      </form>
                      {project?._id ? <Link href={`/projects/${String(project._id)}/board`}>Open board</Link> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="stack">
          <div className="panel">
            <div className="section-head"><h2>Weekly workload</h2></div>
            {load.map(({ person, count, hours, pressure }) => (
              <div key={String(person._id)} className="row" style={{ marginBottom: "0.6rem" }}>
                <span>{person.name}</span>
                <span className="muted">{count} open · {hours}h capacity · {pressure}% loaded</span>
              </div>
            ))}
          </div>
          <div className="card form-card">
            <h2>Request leave</h2>
            <form action={createLeaveFormAction} className="stack">
              <input type="hidden" name="next" value="/tasks" />
              <input type="hidden" name="userId" value={user.id} />
              <label className="field"><span>From</span><input className="input" type="date" name="startDate" required /></label>
              <label className="field"><span>To</span><input className="input" type="date" name="endDate" required /></label>
              <label className="field"><span>Reason</span><input className="input" name="reason" /></label>
              <SubmitButton>Send request</SubmitButton>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
