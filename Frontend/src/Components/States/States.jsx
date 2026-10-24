import "./States.css";

export function LoadingState() {
  return (
    <div className="st st-load" role="status" aria-live="polite">
      <div className="st-scan" />
      <p>Pulling Elexon FUELHH + WINDFOR data…</p>
      <small>The first request for a date range can take a few seconds.</small>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const hint =
    error?.status === 404
      ? "Try a wider date range or a shorter forecast cutoff."
      : error?.status === 502
        ? "Elexon's API did not respond as expected. Retry in a moment."
        : error?.kind === "network"
          ? "Start the backend (uvicorn app.main:app --port 8000) and check CORS origins."
          : "";
  return (
    <div className="st st-err" role="alert">
      <div className="st-x">!</div>
      <h3>{error?.status === 404 ? "No matched data" : "Something went wrong"}</h3>
      <p>{error?.message}</p>
      {hint && <small>{hint}</small>}
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}
