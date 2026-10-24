// Tiny scale + path helpers so the charts need no charting dependency.
export const linear = (d0, d1, r0, r1) => {
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = (v) => r0 + (v - d0) * k;
  f.invert = (p) => d0 + (p - r0) / k;
  return f;
};

export function niceTicks(min, max, count = 5) {
  if (min === max) max = min + 1;
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const out = [];
  for (let v = start; v <= end + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

export const pathFrom = (pts) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");

/** Ticks aligned to UTC midnight (or 3h) depending on the visible span. */
export function timeTicks(t0, t1) {
  const hours = (t1 - t0) / 36e5;
  const step = hours <= 48 ? 3 * 36e5 : Math.max(1, Math.ceil(hours / 24 / 7)) * 864e5;
  const out = [];
  for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) out.push(t);
  return out;
}
