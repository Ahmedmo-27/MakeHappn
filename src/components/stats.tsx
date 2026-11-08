import { TASK_STATUSES, STATUS_LABEL } from "@/lib/domain";
import { donePercent, totalOf, type StatusCounts } from "@/lib/stats";

export function Meter({ counts }: { counts: StatusCounts }) {
  const total = totalOf(counts);
  return (
    <div className="meter" aria-hidden="true">
      {total === 0 ? <span className="meter-empty" /> : null}
      {TASK_STATUSES.map((status) =>
        counts[status] > 0 ? (
          <span key={status} className={`meter-${status}`} style={{ width: `${(counts[status] / total) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}

export function CountLine({ counts }: { counts: StatusCounts }) {
  return (
    <p className="count-line">
      {TASK_STATUSES.map((status) => (
        <span key={status}>
          <i className={`dot dot-${status}`} />
          {STATUS_LABEL[status]} {counts[status]}
        </span>
      ))}
    </p>
  );
}

export function Percent({ counts }: { counts: StatusCounts }) {
  const total = totalOf(counts);
  return (
    <div>
      <div className="stat display">{donePercent(counts)}%</div>
      <p className="muted">{counts.done} of {total} done</p>
    </div>
  );
}
