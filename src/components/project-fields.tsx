import { STUDIO_PRODUCT_LABELS, CURRENCIES, type StudioProduct } from "@/lib/domain";

type Option = { _id: unknown; name: string; title?: string; brandName?: string };

export type ProjectFieldDefaults = {
  name?: string;
  clientId?: string;
  projectLeadId?: string;
  products?: string[];
  teamUserIds?: string[];
  startDate?: Date | null;
  deliveryDate?: Date | null;
  currency?: string;
  quotedValue?: number;
  approvedContractValue?: number;
  contractedRevisionRounds?: number;
  brief?: string;
  objectives?: string;
  audience?: string;
  location?: string;
};

const dateValue = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const twoCol = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" } as const;

/** Shared inputs for the create and edit project forms. */
export function ProjectFields({
  clients,
  users,
  defaults = {},
}: {
  clients: Option[];
  users: Option[];
  defaults?: ProjectFieldDefaults;
}) {
  const products = defaults.products ?? ["turnkey_experience"];
  const team = new Set(defaults.teamUserIds ?? []);

  return (
    <>
      <div className="form-group">
        <label htmlFor="name">Project Name *</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          defaultValue={defaults.name}
          placeholder="e.g. Red Sea Horizon Pavilion & Brand Identity"
          className="input"
        />
      </div>

      <div className="form-row" style={twoCol}>
        <div className="form-group">
          <label htmlFor="clientId">Client *</label>
          <select id="clientId" name="clientId" required className="select" defaultValue={defaults.clientId}>
            {clients.map((c) => (
              <option key={String(c._id)} value={String(c._id)}>
                {c.brandName ? `${c.brandName} (${c.name})` : c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="projectLeadId">Project Lead *</label>
          <select id="projectLeadId" name="projectLeadId" defaultValue={defaults.projectLeadId} required className="select">
            {users.map((u) => (
              <option key={String(u._id)} value={String(u._id)}>
                {u.name} {u.title ? `(${u.title})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>
          Studio Products * <span className="muted" style={{ fontWeight: "normal" }}>(Select one or more)</span>
        </label>
        <div
          className="check-list"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
        >
          {(Object.keys(STUDIO_PRODUCT_LABELS) as StudioProduct[]).map((prod) => (
            <label key={prod}>
              <input type="checkbox" name="products" value={prod} defaultChecked={products.includes(prod)} />
              {STUDIO_PRODUCT_LABELS[prod]}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>
          Internal Team{" "}
          <span className="muted" style={{ fontWeight: "normal" }}>
            (Members can see and work on this project. The lead always has access.)
          </span>
        </label>
        <div
          className="check-list"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
        >
          {users.map((u) => (
            <label key={String(u._id)}>
              <input
                type="checkbox"
                name="teamUserIds"
                value={String(u._id)}
                defaultChecked={team.has(String(u._id))}
              />
              <span>
                {u.name}
                {u.title ? <span className="muted"> · {u.title}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-row" style={twoCol}>
        <div className="form-group">
          <label htmlFor="startDate">Target Start Date</label>
          <input id="startDate" name="startDate" type="date" className="input" defaultValue={dateValue(defaults.startDate)} />
        </div>
        <div className="form-group">
          <label htmlFor="deliveryDate">Target Delivery Date</label>
          <input id="deliveryDate" name="deliveryDate" type="date" className="input" defaultValue={dateValue(defaults.deliveryDate)} />
        </div>
      </div>

      <div className="form-row" style={{ ...twoCol, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <select id="currency" name="currency" defaultValue={defaults.currency ?? "USD"} className="select">
            {CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="quotedValue">Quoted Value</label>
          <input id="quotedValue" name="quotedValue" type="number" step="any" min="0" defaultValue={defaults.quotedValue ?? 0} className="input" />
        </div>
        <div className="form-group">
          <label htmlFor="approvedContractValue">Approved Value</label>
          <input
            id="approvedContractValue"
            name="approvedContractValue"
            type="number"
            step="any"
            min="0"
            defaultValue={defaults.approvedContractValue ?? 0}
            className="input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contractedRevisionRounds">Revision Rounds</label>
          <input
            id="contractedRevisionRounds"
            name="contractedRevisionRounds"
            type="number"
            min="1"
            step="1"
            defaultValue={defaults.contractedRevisionRounds ?? 2}
            className="input"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="brief">Creative Brief</label>
        <textarea
          id="brief"
          name="brief"
          rows={3}
          defaultValue={defaults.brief}
          placeholder="Key design goals, client requirements, creative vision..."
          className="textarea"
        />
      </div>

      <div className="form-group">
        <label htmlFor="objectives">Objectives & Success Criteria</label>
        <textarea
          id="objectives"
          name="objectives"
          rows={3}
          defaultValue={defaults.objectives}
          placeholder="What does success look like? e.g. 20k visitors, 3 press features, sign-off by launch week..."
          className="textarea"
        />
      </div>

      <div className="form-row" style={twoCol}>
        <div className="form-group">
          <label htmlFor="audience">Target Audience</label>
          <input id="audience" name="audience" type="text" defaultValue={defaults.audience} placeholder="e.g. VIP guests, design public" className="input" />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location / Venue</label>
          <input id="location" name="location" type="text" defaultValue={defaults.location} placeholder="e.g. Riyadh Cultural District" className="input" />
        </div>
      </div>
    </>
  );
}
