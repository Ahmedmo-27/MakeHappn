import { Suspense } from "react";
import { connection } from "next/server";
import { Banner, PageFallback } from "@/components/banner";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { SubmitButton } from "@/components/submit-button";
import { saveOwnProfileAction } from "@/app/actions/profile";
import { setOwnAvailabilityAction } from "@/app/actions/project-setup";
import { AVAILABILITY_LABELS, AVAILABILITY_STATUSES, FUNCTIONAL_ROLE_LABELS, roleLabel } from "@/lib/domain";
import { readMessage } from "@/lib/format";
import { getOwnAvailability } from "@/services/projects";
import { getOwnProfile } from "@/services/profile";

export default function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<PageFallback label="Loading your profile" />}>
      <Profile searchParams={searchParams} />
    </Suspense>
  );
}

async function Profile({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [profile, availability, query] = await Promise.all([
    getOwnProfile(),
    getOwnAvailability(),
    searchParams,
  ]);
  const flash = readMessage(query);
  const role = profile.functionalRoles?.[0]
    ? FUNCTIONAL_ROLE_LABELS[profile.functionalRoles[0]]
    : roleLabel(profile.role);

  return (
    <div className="page stack" style={{ gap: "1.25rem" }}>
      <Banner error={flash.error} notice={flash.notice} />
      <header className="page-header">
        <div className="row" style={{ gap: "1rem", alignItems: "center" }}>
          <EmployeeAvatar name={profile.name} profileImage={profile.profileImage} size={64} />
          <div>
            <p className="kicker">Employee profile</p>
            <h1>{profile.name}</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              {[profile.title, role, profile.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </header>

      <form action={saveOwnProfileAction} className="card stack" style={{ gap: "0.85rem", maxWidth: "820px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Employee information</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "0.8rem" }}>
          {[
            ["Name", profile.name],
            ["Title", profile.title || "—"],
            ["Role", role],
            ["Email", profile.email],
          ].map(([label, value]) => (
            <div key={label}>
              <span className="hint">{label}</span>
              <div><strong>{value}</strong></div>
            </div>
          ))}
        </div>
        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" type="tel" maxLength={40} defaultValue={profile.phone} className="input" />
          </div>
          <div className="form-group">
            <label htmlFor="profileImage">Profile picture</label>
            <input id="profileImage" name="profileImage" type="file" accept="image/jpeg,image/png,image/webp" className="input" />
            <span className="hint">JPG, PNG, or WebP · 256 KB max</span>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="bio">About me</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={profile.bio}
            className="textarea"
            placeholder="A short introduction"
          />
        </div>
        <div className="form-actions">
          <SubmitButton>Save profile</SubmitButton>
        </div>
      </form>

      <form action={setOwnAvailabilityAction} className="card stack" style={{ gap: "0.85rem", maxWidth: "820px" }}>
        <div>
          <h2 style={{ margin: 0 }}>My status</h2>
          <p className="hint" style={{ marginBottom: 0 }}>Update your own status so project leads can plan around your availability.</p>
        </div>
        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={availability.availability} className="select">
              {AVAILABILITY_STATUSES.map((status) => (
                <option key={status} value={status}>{AVAILABILITY_LABELS[status]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="note">Note</label>
            <input
              id="note"
              name="note"
              type="text"
              maxLength={120}
              defaultValue={availability.availabilityNote}
              placeholder="e.g. Back on Sunday"
              className="input"
            />
          </div>
        </div>
        <div className="form-actions">
          <SubmitButton variant="ghost">Update my status</SubmitButton>
        </div>
      </form>
    </div>
  );
}
