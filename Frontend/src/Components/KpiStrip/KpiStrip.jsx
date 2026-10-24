import { useEffect, useState } from "react";
import { fmtInt, fmtPct } from "../../utils/analytics";
import "./KpiStrip.css";

function useCountUp(target, ms = 700) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Kpi({ label, value, unit, note, hot, format = fmtInt }) {
  const shown = useCountUp(Math.abs(value));
  const sign = value < 0 ? "−" : value > 0 && hot === "bias" ? "+" : "";
  return (
    <article className={`kpi ${hot ? "hot" : ""}`}>
      <h3>{label}</h3>
      <p className="kpi-v">
        {sign}
        {format(shown)}
        <small>{unit}</small>
      </p>
      <p className="kpi-n">{note}</p>
    </article>
  );
}

export default function KpiStrip({ s }) {
  const biasNote =
    Math.abs(s.bias) < 1
      ? "Forecast is unbiased"
      : s.bias > 0
        ? "Forecasts run high — wind arrives short of plan"
        : "Forecasts run low — more wind than planned";

  return (
    <section className="kpis" aria-label="Accuracy summary">
      <Kpi hot label="MAE" value={s.mae} unit="MW" note="Typical size of a miss" />
      <Kpi label="RMSE" value={s.rmse} unit="MW" note="Penalises the big misses" />
      <Kpi hot="bias" label="Bias" value={s.bias} unit="MW" note={biasNote} />
      <Kpi label="wMAPE" value={s.wmape} unit="%" note="Error as share of actual output" format={(n) => fmtPct(n)} />
      <Kpi label="P95 abs. error" value={s.p95Abs} unit="MW" note="1-in-20 worst-case miss" />
      <Kpi label="Periods" value={s.n} unit="" note="Matched half-hours" />
    </section>
  );
}
