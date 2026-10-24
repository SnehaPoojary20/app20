import { useMemo } from "react";
import BarChart from "../Charts/BarChart";
import { fmtInt, fmtSigned } from "../../utils/analytics";
import "./IntradayProfile.css";

export default function IntradayProfile({ hourly }) {
  const data = useMemo(() => {
    const worst = Math.max(...hourly.map((h) => h.mae));
    return hourly.map((h) => ({
      key: h.key,
      label: String(h.key).padStart(2, "0"),
      value: h.mae,
      active: h.mae === worst,
      tip: `bias ${fmtSigned(h.bias)} MW · RMSE ${fmtInt(h.rmse)} MW`,
    }));
  }, [hourly]);

  const worst = data.find((d) => d.active);

  return (
    <div className="ip">
      <BarChart data={data} format={fmtInt} unit="MW MAE" labelEvery={3} height={260} />
      {worst && (
        <p className="ip-note">
          Forecasts are least reliable around <b>{worst.label}:00 GMT</b> — the hardest hour to plan wind for.
        </p>
      )}
    </div>
  );
}
