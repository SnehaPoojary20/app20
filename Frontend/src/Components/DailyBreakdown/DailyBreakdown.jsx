import { useMemo, useState } from "react";
import BarChart from "../Charts/BarChart";
import { fmtDay, fmtInt, fmtSigned } from "../../utils/analytics";
import "./DailyBreakdown.css";

const METRICS = [
  { id: "mae", label: "MAE", marker: "rmse", note: "bars = MAE · dots = RMSE" },
  { id: "rmse", label: "RMSE", note: "bars = RMSE" },
  { id: "bias", label: "Bias", note: "red = over-forecast · grey = under-forecast" },
];

export default function DailyBreakdown({ daily, selected, onSelect }) {
  const [metric, setMetric] = useState("mae");
  const cfg = METRICS.find((m) => m.id === metric);

  const data = useMemo(
    () =>
      daily.map((d) => ({
        key: d.key,
        label: String(Number(d.key.slice(8))),
        value: d[metric],
        marker: cfg.marker ? d[cfg.marker] : undefined,
        active: d.key === selected,
        tip: `${fmtDay(d.key)} · avg actual ${fmtInt(d.avgActual)} MW · bias ${fmtSigned(d.bias)} MW`,
      })),
    [daily, metric, selected, cfg]
  );

  return (
    <div className="db">
      <div className="db-tabs" role="tablist">
        {METRICS.map((m) => (
          <button key={m.id} role="tab" aria-selected={metric === m.id} className={metric === m.id ? "on" : ""} onClick={() => setMetric(m.id)}>
            {m.label}
          </button>
        ))}
        <span>{cfg.note}</span>
      </div>
      <BarChart data={data} format={(v) => (metric === "bias" ? fmtSigned(v) : fmtInt(v))} unit="MW" onSelect={onSelect} labelEvery={daily.length > 20 ? 2 : 1} />
      <p className="db-hint">Click a bar to open that day in the decision view.</p>
    </div>
  );
}
