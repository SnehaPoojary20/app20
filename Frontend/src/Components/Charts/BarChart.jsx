import { useMemo, useState } from "react";
import { useMeasure } from "./useMeasure";
import { linear, niceTicks } from "./scales";
import "./BarChart.css";

const M = { t: 14, r: 12, b: 34, l: 56 };

/**
 * Generic bar chart.
 * data: [{ key, label, value, marker?, tip?, active? }]
 *  - value  -> the bar (red; negative bars are drawn muted)
 *  - marker -> optional white dot (e.g. RMSE next to a MAE bar)
 */
export default function BarChart({ data, height = 280, format = (v) => v, onSelect, labelEvery = 1, unit = "" }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);

  const geo = useMemo(() => {
    const vals = data.flatMap((d) => [d.value, d.marker ?? 0]);
    const ticks = niceTicks(Math.min(0, ...vals), Math.max(0, ...vals) * 1.05 || 1, 4);
    const y = linear(ticks[0], ticks[ticks.length - 1], height - M.b, M.t);
    const band = (width - M.l - M.r) / Math.max(1, data.length);
    return { ticks, y, band };
  }, [data, width, height]);

  const barW = Math.max(2, geo.band * 0.68);
  const zeroY = geo.y(0);

  return (
    <div className="bc" ref={ref} style={{ height }}>
      <svg width={width} height={height} role="img" aria-label="Bar chart">
        {geo.ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? "bc-zero" : "bc-grid"} x1={M.l} x2={width - M.r} y1={geo.y(t)} y2={geo.y(t)} />
            <text className="bc-axis" x={M.l - 8} y={geo.y(t) + 4} textAnchor="end">
              {format(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = M.l + geo.band * i + (geo.band - barW) / 2;
          const yv = geo.y(d.value);
          const top = Math.min(yv, zeroY);
          const h = Math.max(1, Math.abs(zeroY - yv));
          const cls = ["bc-bar", d.value < 0 ? "neg" : "", d.active ? "active" : "", hover === i ? "hover" : ""].join(" ");
          return (
            <g
              key={d.key}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect && onSelect(d.key)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              <rect x={M.l + geo.band * i} y={M.t} width={geo.band} height={height - M.t - M.b} fill="transparent" />
              <rect className={cls} x={x} y={top} width={barW} height={h} rx={Math.min(3, barW / 2)} />
              {d.marker != null && <circle className="bc-marker" cx={x + barW / 2} cy={geo.y(d.marker)} r={Math.min(4, barW / 2 + 1)} />}
              {i % labelEvery === 0 && (
                <text className={`bc-axis ${d.active ? "on" : ""}`} x={x + barW / 2} y={height - M.b + 18} textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover != null && data[hover] && (
        <div
          className="bc-tip"
          style={{
            left: Math.min(width - 150, Math.max(0, M.l + geo.band * hover + geo.band / 2 - 70)),
            top: Math.max(0, geo.y(Math.max(0, data[hover].value)) - 58),
          }}
        >
          <strong>{data[hover].label}</strong>
          <span>
            {format(data[hover].value)} {unit}
          </span>
          {data[hover].tip && <em>{data[hover].tip}</em>}
        </div>
      )}
    </div>
  );
}
