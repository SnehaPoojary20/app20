import { useState } from "react";
import "./ControlPanel.css";

export const MIN_DATE = "2026-01-01";
export const MAX_DATE = "2026-01-31";

// "Cutoff" = how long before delivery a forecast must have been published to count.
const CUTOFFS = [
  { min: 60, label: "1 h" },
  { min: 360, label: "6 h" },
  { min: 720, label: "12 h" },
  { min: 1440, label: "24 h · day-ahead" },
  { min: 2160, label: "36 h" },
  { min: 2880, label: "48 h" },
];

export default function ControlPanel({ applied, loading, onApply }) {
  const [draft, setDraft] = useState(applied);
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: k === "cutoff" ? Number(e.target.value) : e.target.value }));
  const invalid = draft.start > draft.end;
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);

  return (
    <form
      className="cp"
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) onApply(draft);
      }}
    >
      <label>
        <span>From</span>
        <input type="date" min={MIN_DATE} max={MAX_DATE} value={draft.start} onChange={set("start")} />
      </label>
      <label>
        <span>To</span>
        <input type="date" min={MIN_DATE} max={MAX_DATE} value={draft.end} onChange={set("end")} />
      </label>

      <fieldset className="cp-cut">
        <legend>Forecast cutoff before delivery</legend>
        <div>
          {CUTOFFS.map((c) => (
            <button
              type="button"
              key={c.min}
              className={draft.cutoff === c.min ? "chip on" : "chip"}
              onClick={() => setDraft((d) => ({ ...d, cutoff: c.min }))}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button className="cp-go" type="submit" disabled={invalid || loading || !dirty}>
        {loading ? "Loading…" : "Apply"}
      </button>
      {invalid && <p className="cp-warn">Start date must be on or before the end date.</p>}
    </form>
  );
}
