import { useCallback, useEffect, useState } from "react";
import { fetchComparison } from "../api/client";
import { normalise } from "../utils/analytics";

/**
 * Loads forecast-vs-actual data for the applied query params.
 * Returns { rows, metrics, loading, error, reload }.
 */
export default function useForecastData(params) {
  const [state, setState] = useState({ rows: [], metrics: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const { start, end, cutoff } = params;

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchComparison({ start, end, cutoff }, ctrl.signal)
      .then((data) =>
        setState({ rows: normalise(data.records), metrics: data.metrics, loading: false, error: null })
      )
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ rows: [], metrics: null, loading: false, error: err });
      });

    return () => ctrl.abort();
  }, [start, end, cutoff, nonce]);

  return { ...state, reload };
}
