"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { changeTaskStatusAction } from "@/app/actions/tasks";
import { BOARD_STATUSES, STATUS_LABEL, isBoardStatus, type BoardStatus } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import type { BoardTask } from "@/lib/board";

export function Board({ eventId, tasks, showTeam }: { eventId: string; tasks: BoardTask[]; showTeam: boolean }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ taskId: string; to: BoardStatus; title: string } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const active = tasks.find((task) => task.id === activeId) ?? null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const task = tasks.find((item) => item.id === String(event.active.id));
    if (!task || !event.over) return;
    const overId = String(event.over.id);
    const overTask = tasks.find((item) => item.id === overId);
    const next = isBoardStatus(overId) ? overId : overTask?.status;
    if (!next || next === task.status || !task.canDrag) return;
    setPending({ taskId: task.id, to: next, title: task.title });
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="board">
          {BOARD_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              eventId={eventId}
              showTeam={showTeam}
              tasks={tasks.filter((task) => task.status === status)}
            />
          ))}
        </div>
        <DragOverlay>{active ? <article className="task-card overlay"><h3>{active.title}</h3></article> : null}</DragOverlay>
      </DndContext>
      {pending ? (
        <ReasonDialog
          title={pending.title}
          fromTo={STATUS_LABEL[pending.to]}
          onCancel={() => setPending(null)}
          onConfirm={async (reason) => {
            const result = await changeTaskStatusAction({
              taskId: pending.taskId,
              toStatus: pending.to,
              reason,
            });
            if (result.ok) {
              setPending(null);
              router.refresh();
            }
            return result;
          }}
        />
      ) : null}
    </>
  );
}

function Column({
  status,
  tasks,
  eventId,
  showTeam,
}: {
  status: BoardStatus;
  tasks: BoardTask[];
  eventId: string;
  showTeam: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={isOver ? "column column-over" : "column"}>
      <header>
        <strong>{STATUS_LABEL[status]}</strong>
        <span className="muted">{tasks.length}</span>
      </header>
      <div className={`column-rule rule-${status}`} />
      <div className="column-body">
        {tasks.length === 0 ? <p className="muted">No tasks</p> : null}
        {tasks.map((task) => (
          <Card key={task.id} task={task} eventId={eventId} showTeam={showTeam} />
        ))}
      </div>
    </section>
  );
}

function Card({ task, eventId, showTeam }: { task: BoardTask; eventId: string; showTeam: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !task.canDrag,
    data: { status: task.status },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <article ref={setNodeRef} style={style} className={isDragging ? "task-card dragging" : "task-card"}>
      <div className="card-meta">
        {task.canDrag ? (
          <button type="button" className="handle" aria-label={`Drag ${task.title}`} {...listeners} {...attributes}>
            ::
          </button>
        ) : <span />}
        {showTeam ? <span>{task.teamName}</span> : null}
      </div>
      <h3><Link href={`/events/${eventId}/tasks/${task.id}`}>{task.title}</Link></h3>
      <div className="card-meta">
        <span>{task.assigneeName}</span>
        <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
      </div>
    </article>
  );
}

function ReasonDialog({
  title,
  fromTo,
  onCancel,
  onConfirm,
}: {
  title: string;
  fromTo: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="reason-title">{title}</h2>
        <p className="hint">Move to {fromTo}. A blank reason is refused, and the reason is kept in the task history.</p>
        <label className="field">
          <span>Reason</span>
          <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} autoFocus required />
        </label>
        {error ? <p className="banner banner-error">{error}</p> : null}
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={async () => {
              if (!reason.trim()) {
                setError("A reason is required");
                return;
              }
              setPending(true);
              const result = await onConfirm(reason.trim());
              setPending(false);
              if (!result.ok) setError(result.error ?? "Could not update the status");
            }}
          >
            {pending ? "Saving…" : "Save status"}
          </button>
        </div>
      </div>
    </div>
  );
}
