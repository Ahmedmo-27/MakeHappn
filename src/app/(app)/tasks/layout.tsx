import { ModuleTabs } from "@/components/module-tabs";

const tabs = [
  { href: "/tasks", label: "My tasks", exact: true },
  { href: "/tasks/team", label: "Team" },
  { href: "/tasks/week", label: "This week" },
  { href: "/tasks/overdue", label: "Overdue" },
];

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <p className="kicker">Daily execution</p>
          <h1>Tasks</h1>
          <p className="lede">
            What needs to get done, by whom, and by when. Dependencies block a task until the earlier one is done.
          </p>
        </div>
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="Task views" style={{ marginBottom: "1.5rem" }} />
      {children}
    </div>
  );
}