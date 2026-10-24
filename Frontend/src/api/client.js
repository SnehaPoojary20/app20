// Thin API client for the FastAPI backend.
// Set VITE_API_BASE_URL in Frontend/.env to point at a deployed backend,
// e.g. VITE_API_BASE_URL=https://your-backend.example.com/api
const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

async function request(path, params, signal) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  let res;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    const e = new Error("Cannot reach the backend. Is the API running on " + BASE + " ?");
    e.kind = "network";
    throw e;
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* body was not JSON */
    }
    const e = new Error(detail);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

/** Matched forecast/actual records + MAE/RMSE/bias for a date range. */
export function fetchComparison({ start, end, cutoff }, signal) {
  return request(
    "/forecast/comparison",
    { start_date: start, end_date: end, cutoff_minutes: cutoff },
    signal
  );
}

export function fetchHealth(signal) {
  return request("/health", {}, signal);
}
