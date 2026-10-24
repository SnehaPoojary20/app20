import { useMemo, useRef, useState } from "react";
import { useMeasure } from "../Charts/useMeasure";
import { linear, niceTicks, pathFrom, timeTicks } from "../Charts/scales";
import { fmtDateTime, fmtInt, fmtSigned, fmtTick } from "../../utils/analytics";
import "./ForecastChart.css";

const M = { t: 14, r: 18, b: 30, l: 60 };

/**
 * Forecast (red) vs actual (white) wind generation.
 * rows: normalised records. band: optional { lo:[], hi:[] } aligned with rows (uncertainty range).
 */
export default function ForecastChart({ rows, band, height = 360, uid = "fc" }) {
  const [ref, width] = useMeasure();
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const g = useMemo(() => {
    if (!rows.length) return null;
    const t0 = rows[0].t;
    const t1 = rows[rows.length - 1].t;
    let max = 0;
    rows.forEach((r, i) => {
      max = Math.max(max, r.forecast, r.actual, band ? band.hi[i] : 0);
    });
    const ticksY = niceTicks(0, max * 1.04, 5);
    const x = linear(t0, t1 === t0 ? t0 + 1 : t1, M.l, width - M.r);
    const y = linear(0, ticksY[ticksY.length - 1], height - M.b, M.t);

    const F = rows.map((r) => [x(r.t), y(r.forecast)]);
    const A = rows.map((r) => [x(r.t), y(r.actual)]);
    const gap = pathFrom(F) + pathFrom([...A].reverse()).replace(/^M/, "L") + "Z";
    let bandPath = null;
    if (band) {
      const hi = rows.map((r, i) => [x(r.t), y(band.hi[i])]);
      const lo = rows.map((r, i) => [x(r.t), y(band.lo[i])]).reverse();
      bandPath = pathFrom(hi) + pathFrom(lo).replace(/^M/, "L") + "Z";
    }
    return {
      t0, t1, x, y, ticksY,
      fPath: pathFrom(F), aPath: pathFrom(A), gap, bandPath,
      xt: timeTicks(t0, t1), span: (t1 - t0) / 36e5,
    };
  }, [rows, band, width, height]);

  if (!g) return null;

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const t = g.x.invert(e.clientX - rect.left);
    let lo = 0;
    let hi = rows.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (rows[mid].t < t) lo = mid;
      else hi = mid;
    }
    setHover(Math.abs(rows[lo].t - t) < Math.abs(rows[hi].t - t) ? lo : hi);
  };

  const h = hover != null ? rows[hover] : null;

  return (
    <div className="fc" ref={ref} style={{ height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label="Forecast versus actual wind generation"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${uid}-gap`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff2638" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff2638" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {g.ticksY.map((t) => (
          <g key={t}>
            <line className="fc-grid" x1={M.l} x2={width - M.r} y1={g.y(t)} y2={g.y(t)} />
            <text className="fc-axis" x={M.l - 10} y={g.y(t) + 4} textAnchor="end">
              {fmtInt(t)}
            </text>
          </g>
        ))}
        <text className="fc-axis fc-unit" x={M.l - 10} y={M.t - 4} textAnchor="end">MW</text>

        {g.xt.map((t) => (
          <text key={t} className="fc-axis" x={g.x(t)} y={height - 8} textAnchor="middle">
            {fmtTick(t, g.span)}
          </text>
        ))}

        {g.bandPath && <path className="fc-band" d={g.bandPath} />}
        <path className="fc-gap" d={g.gap} fill={`url(#${uid}-gap)`} />
        <path className="fc-actual" d={g.aPath} />
        <path className="fc-forecast" d={g.fPath} />

        {h && (
          <g>
            <line className="fc-cursor" x1={g.x(h.t)} x2={g.x(h.t)} y1={M.t} y2={height - M.b} />
            <circle className="fc-dot actual" cx={g.x(h.t)} cy={g.y(h.actual)} r="4" />
            <circle className="fc-dot forecast" cx={g.x(h.t)} cy={g.y(h.forecast)} r="4.5" />
          </g>
        )}
      </svg>

      {h && (
        <div className="fc-tip" style={{ left: Math.min(width - 210, Math.max(8, g.x(h.t) + 14)), top: 16 }}>
          <b>{fmtDateTime(h.t)} GMT</b>
          <p><i className="k red" /> Forecast <span>{fmtInt(h.forecast)} MW</span></p>
          <p><i className="k white" /> Actual <span>{fmtInt(h.actual)} MW</span></p>
          <p className="err">Error <span>{fmtSigned(h.error)} MW</span></p>
          <small>Forecast published {fmtDateTime(h.pub)}</small>
        </div>
      )}

      <div className="fc-legend">
        <span><i className="k red" /> Forecast</span>
        <span><i className="k white" /> Actual</span>
        <span><i className="k gap" /> Forecast error</span>
        {band && <span><i className="k band" /> Likely range</span>}
      </div>
    </div>
  );
}
