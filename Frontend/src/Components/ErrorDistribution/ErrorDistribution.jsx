import { useMemo } from "react";
import BarChart from "../Charts/BarChart";
import { errorHistogram, fmtInt, fmtSigned } from "../../utils/analytics";
import "./ErrorDistribution.css";

export default function ErrorDistribution({ rows, summary }) {
  const data = useMemo(() => {
    const bins = errorHistogram(rows);
    return bins.map((b) => ({
      key: b.lo,
      label: fmtSigned(b.lo + (b.hi - b.lo) / 2),
      value: b.count,
      active: b.lo <= 0 && b.hi > 0,
      tip: `${fmtSigned(b.lo)} to ${fmtSigned(b.hi)} MW`,
    }));
  }, [rows]);

  return (
    <div className="ed">
      <BarChart data={data} format={fmtInt} unit="periods" labelEvery={Math.ceil(data.length / 8)} height={260} />
      <div className="ed-q">
        <span>P05 error <b>{fmtSigned(summary.errP05)} MW</b></span>
        <span>P95 error <b>{fmtSigned(summary.errP95)} MW</b></span>
        <span className="mut">Highlighted bar = zero-error band</span>
      </div>
    </div>
  );
}
