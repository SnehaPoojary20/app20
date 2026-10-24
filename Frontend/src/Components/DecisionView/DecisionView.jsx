import { useMemo } from "react";
import ForecastChart from "../ForecastChart/ForecastChart";
import { SLOT_HOURS, fmtDateTime, fmtDay, fmtInt } from "../../utils/analytics";
import "./DecisionView.css";

/**
 * "What do I plan around tomorrow?" — the selected delivery day's forecast
 * with a likely range built from the historical error distribution.
 */
export default function DecisionView({ rows, days, day, onDay, worstDay, summary }) {
  const idx = days.indexOf(day);

  const view = useMemo(() => {
    const dayRows = rows.filter((r) => r.day === day);
    if (!dayRows.length) return null;
    // actual = forecast - error, so the 90% range of actual is [f - P95(err), f - P05(err)]
    const lo = dayRows.map((r) => Math.max(0, r.forecast - summary.errP95));
    const hi = dayRows.map((r) => r.forecast - summary.errP05);
    const captured = dayRows.filter((r, i) => r.actual >= lo[i] && r.actual <= hi[i]).length;
    const energy = dayRows.reduce((s, r) => s + r.forecast, 0) * SLOT_HOURS;
    const energyLow = lo.reduce((s, v) => s + v, 0) * SLOT_HOURS;
    const pubs = dayRows.map((r) => r.pub);
    return {
      dayRows,
      band: { lo, hi },
      energy,
      energyLow,
      headroom: energy - energyLow,
      peak: Math.max(...dayRows.map((r) => r.forecast)),
      trough: Math.min(...dayRows.map((r) => r.forecast)),
      coverage: (captured / dayRows.length) * 100,
      pubFrom: Math.min(...pubs),
      pubTo: Math.max(...pubs),
    };
  }, [rows, day, summary]);

  return (
    <div className="dv">
      <div className="dv-bar">
        <div className="dv-pick">
          <button onClick={() => onDay(days[idx - 1])} disabled={idx <= 0} aria-label="Previous day">‹</button>
          <select value={day} onChange={(e) => onDay(e.target.value)} aria-label="Delivery day">
            {days.map((d) => (
              <option key={d} value={d}>{fmtDay(d)} 2026</option>
            ))}
          </select>
          <button onClick={() => onDay(days[idx + 1])} disabled={idx >= days.length - 1} aria-label="Next day">›</button>
        </div>
        <button className="dv-worst" onClick={() => onDay(worstDay)}>
          Jump to worst day · {fmtDay(worstDay)}
        </button>
      </div>

      {view ? (
        <>
          <div className="dv-stats">
            <div>
              <span>Forecast wind energy</span>
              <b>{fmtInt(view.energy / 1000)}<small> GWh</small></b>
            </div>
            <div className="hot">
              <span>Conservative (P05) wind</span>
              <b>{fmtInt(view.energyLow / 1000)}<small> GWh</small></b>
            </div>
            <div>
              <span>Buffer worth planning for</span>
              <b>{fmtInt(view.headroom / 1000)}<small> GWh</small></b>
            </div>
            <div>
              <span>Peak / trough forecast</span>
              <b>{fmtInt(view.peak)}<small> / </small>{fmtInt(view.trough)}<small> MW</small></b>
            </div>
          </div>

          <ForecastChart rows={view.dayRows} band={view.band} height={340} uid="dv" />

          <p className="dv-foot">
            Forecasts used were published between <b>{fmtDateTime(view.pubFrom)}</b> and <b>{fmtDateTime(view.pubTo)}</b> GMT.
            The dashed band is the 90% range implied by this period’s historical error; in hindsight it contained{" "}
            <b>{view.coverage.toFixed(0)}%</b> of this day’s actual half-hours.
          </p>
        </>
      ) : (
        <p className="dv-foot">No matched data for this day.</p>
      )}
    </div>
  );
}
