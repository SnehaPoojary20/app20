import { useState } from "react";
import BarChart from "../Charts/BarChart";
import { fetchComparison } from "../../api/client";
import { fmtCutoff, fmtInt, fmtSigned } from "../../utils/analytics";
import "./HorizonSweep.css";

const SWEEP = [60, 180, 360, 720, 1440, 2160, 2880];

/**
 * How does accuracy change with the forecast cutoff?
 * Opt-in: each point is one backend call, which in turn hits Elexon.
 */
export default function HorizonSweep({ params }) {
  const [state, setState] = useState({ status: "idle", done: 0, points: [] });

  const run = async () => {
    setState({ status: "running", done: 0, points: [] });
    const points = [];
    for (let i = 0; i < SWEEP.length; i += 1) {
      try {
        const d = await fetchComparison({ start: params.start, end: params.end, cutoff: SWEEP[i] });
        points.push({ cutoff: SWEEP[i], ...d.metrics });
      } catch {
        points.push({ cutoff: SWEEP[i], failed: true });
      }
      setState({ status: "running", done: i + 1, points: [...points] });
    }
    setState({ status: "done", done: SWEEP.length, points });
  };

  const ok = state.points.filter((p) => !p.failed);
  const data = ok.map((p) => ({
    key: p.cutoff,
    label: fmtCutoff(p.cutoff),
    value: p.mae_mw,
    marker: p.rmse_mw,
    active: p.cutoff === params.cutoff,
    tip: `bias ${fmtSigned(p.bias_mw)} MW · ${fmtInt(p.matched_periods)} periods`,
  }));

  return (
    <div className="hs">
      {state.status === "idle" && (
        <div className="hs-idle">
          <p>
            Compare accuracy across cutoffs from <b>1 h to 48 h</b> before delivery for{" "}
            <b>{params.start}</b> → <b>{params.end}</b>. Runs {SWEEP.length} requests against the API.
          </p>
          <button onClick={run}>Run horizon sweep</button>
        </div>
      )}

      {state.status === "running" && (
        <div className="hs-prog" role="status">
          <div style={{ width: `${(state.done / SWEEP.length) * 100}%` }} />
          <span>Fetching {state.done} / {SWEEP.length}…</span>
        </div>
      )}

      {data.length > 0 && (
        <>
          <BarChart data={data} format={fmtInt} unit="MW MAE" height={260} />
          <p className="hs-note">
            Bars = MAE · dots = RMSE · highlighted = your applied cutoff ({fmtCutoff(params.cutoff)}).
            Longer lead times mean the forecast was made earlier, so you would expect larger error.
          </p>
        </>
      )}

      {state.status === "done" && (
        <button className="hs-again" onClick={run}>Re-run sweep</button>
      )}
      {state.status === "done" && ok.length === 0 && (
        <p className="hs-note">No cutoff returned matched data for this range.</p>
      )}
    </div>
  );
}
