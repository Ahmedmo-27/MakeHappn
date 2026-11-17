import { Sticker } from "@/components/brand/sticker";
import { ModuleTabs } from "@/components/module-tabs";

const tabs = [
  { href: "/people", label: "Directory", exact: true },
  { href: "/people/leave", label: "Leave" },
  { href: "/people/reviews", label: "Reviews" },
];

export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <Sticker name="meet-tape" className="people-tape" />
          <h1 className="title-compact">People</h1>
          <p className="lede">Add the people who will sign in. A member works on one team, a team has one leader, and an owner sits outside the teams.</p>
        </div>
      </header>
      <ModuleTabs tabs={tabs} ariaLabel="People sections" style={{ marginBottom: "1.5rem" }} />
      {children}
    </div>
  );
}
