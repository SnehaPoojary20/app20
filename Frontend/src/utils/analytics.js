// Pure helpers: turn API records into the shapes the charts need.
export const SLOT_HOURS = 0.5; // 30-minute settlement periods

export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export function quantile(sorted, p) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** API record -> numeric row used everywhere in the UI. */
export function normalise(records) {
  return records.map((r) => {
    const t = Date.parse(r.start_time);
    return {
      t,
      pub: Date.parse(r.publish_time),
      forecast: r.forecast_mw,
      actual: r.actual_mw,
      error: r.error_mw,
      day: r.start_time.slice(0, 10),
      hour: new Date(t).getUTCHours(),
    };
  });
}

/** Headline accuracy numbers, including a few the backend does not return. */
export function summarise(rows) {
  const errors = rows.map((r) => r.error);
  const abs = errors.map(Math.abs).sort((a, b) => a - b);
  const sortedErr = [...errors].sort((a, b) => a - b);
  const sumActual = rows.reduce((s, r) => s + r.actual, 0);
  const sumAbs = abs.reduce((s, x) => s + x, 0);
  return {
    n: rows.length,
    mae: mean(abs),
    rmse: Math.sqrt(mean(errors.map((e) => e * e))),
    bias: mean(errors),
    // weighted MAPE: robust when actual output approaches zero
    wmape: sumActual ? (sumAbs / sumActual) * 100 : 0,
    p95Abs: quantile(abs, 0.95),
    errP05: quantile(sortedErr, 0.05),
    errP95: quantile(sortedErr, 0.95),
    avgActual: mean(rows.map((r) => r.actual)),
  };
}

function group(rows, keyFn) {
  const m = new Map();
  rows.forEach((r) => {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  });
  return m;
}

function stats(key, list) {
  const e = list.map((r) => r.error);
  return {
    key,
    n: list.length,
    mae: mean(e.map(Math.abs)),
    rmse: Math.sqrt(mean(e.map((x) => x * x))),
    bias: mean(e),
    avgActual: mean(list.map((r) => r.actual)),
    avgForecast: mean(list.map((r) => r.forecast)),
  };
}

export const dailyStats = (rows) =>
  [...group(rows, (r) => r.day)].map(([k, l]) => stats(k, l)).sort((a, b) => a.key.localeCompare(b.key));

export function hourlyStats(rows) {
  const g = group(rows, (r) => r.hour);
  return Array.from({ length: 24 }, (_, h) => stats(h, g.get(h) || []));
}

/** Histogram of forecast error (forecast - actual) with ~30 bins. */
export function errorHistogram(rows) {
  if (!rows.length) return [];
  const errs = rows.map((r) => r.error);
  const lo = Math.min(...errs);
  const hi = Math.max(...errs);
  const width = Math.max(250, Math.ceil((hi - lo) / 30 / 250) * 250);
  const start = Math.floor(lo / width) * width;
  const bins = [];
  for (let b = start; b <= hi; b += width) bins.push({ lo: b, hi: b + width, count: 0 });
  errs.forEach((e) => {
    const i = Math.min(bins.length - 1, Math.floor((e - start) / width));
    bins[i].count += 1;
  });
  return bins;
}

/* ---------- formatting ---------- */
export const fmtInt = (n) => Math.round(n).toLocaleString("en-GB");
export const fmtSigned = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtInt(Math.abs(n))}`;
export const fmtPct = (n, d = 1) => `${n.toFixed(d)}%`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

export function fmtDay(key) {
  const [, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function fmtDateTime(t) {
  const d = new Date(t);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function fmtTick(t, spanHours) {
  const d = new Date(t);
  return spanHours <= 48
    ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
    : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export const fmtCutoff = (min) => (min % 60 === 0 ? `${min / 60}h` : `${min}m`);
