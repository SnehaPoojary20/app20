import { useMemo, useState } from "react";
import useForecastData from "../../hooks/useForecastData";
import { dailyStats, fmtDay, fmtInt, fmtSigned, hourlyStats, summarise } from "../../utils/analytics";
import ControlPanel from "../ControlPanel/ControlPanel";
import KpiStrip from "../KpiStrip/KpiStrip";
import ForecastChart from "../ForecastChart/ForecastChart";
import DecisionView from "../DecisionView/DecisionView";
import DailyBreakdown from "../DailyBreakdown/DailyBreakdown";
import IntradayProfile from "../IntradayProfile/IntradayProfile";
import ErrorDistribution from "../ErrorDistribution/ErrorDistribution";
import HorizonSweep from "../HorizonSweep/HorizonSweep";
import { ErrorState, LoadingState } from "../States/States";
import "./Home.css";

const DEFAULTS = { start: "2026-01-01", end: "2026-01-31", cutoff: 1440 };

function Panel({ id, kicker, title, lead, children }) {
  return (
    <section className="panel" id={id}>
      <header>
        <span className="kicker">{kicker}</span>
        <h2>{title}</h2>
        {lead && <p>{lead}</p>}
      </header>
      {children}
    </section>
  );
}

export default function Home() {
  const [applied, setApplied] = useState(DEFAULTS);
  const { rows, loading, error, reload } = useForecastData(applied);
  const [pickedDay, setPickedDay] = useState(null);
  const [scope, setScope] = useState("range");

  const summary = useMemo(() => (rows.length ? summarise(rows) : null), [rows]);
  const daily = useMemo(() => dailyStats(rows), [rows]);
  const hourly = useMemo(() => hourlyStats(rows), [rows]);
  const days = useMemo(() => daily.map((d) => d.key), [daily]);
  const worstDay = useMemo(
    () => (daily.length ? daily.reduce((a, b) => (b.mae > a.mae ? b : a)).key : null),
    [daily]
  );
  const day = days.includes(pickedDay) ? pickedDay : days[days.length - 1];
  const chartRows = useMemo(
    () => (scope === "day" ? rows.filter((r) => r.day === day) : rows),
    [rows, scope, day]
  );

  const selectDay = (d) => {
    setPickedDay(d);
    document.getElementById("decision")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const ready = !loading && !error && summary;

  return (
    <main className="home">
      <section className="hero" id="overview">
        <span className="kicker">UK · Day-ahead · National wind</span>
        <h1>
          Know the wind <em>before</em> you buy the power.
        </h1>
        <p>
          The latest Elexon wind forecast available at decision time, measured against what the turbines
          actually delivered — so every day-ahead position carries a quantified error.
        </p>
        {ready && (
          <div className="hero-stats">
            <div><b>{fmtInt(summary.mae)} MW</b><span>typical miss (MAE)</span></div>
            <div><b>{fmtSigned(summary.bias)} MW</b><span>average bias</span></div>
            <div><b>{fmtInt(summary.n)}</b><span>half-hours scored</span></div>
          </div>
        )}
      </section>

      <ControlPanel applied={applied} loading={loading} onApply={setApplied} />

      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {ready && (
        <>
          <KpiStrip s={summary} />

          <Panel
            id="forecast"
            kicker="01 · Latest forecast"
            title="Forecast vs actual wind generation"
            lead="For every half-hour, the most recent forecast published before your cutoff, against metered output. Hover to inspect a period."
          >
            <div className="seg" role="tablist" aria-label="Chart scope">
              <button role="tab" aria-selected={scope === "range"} className={scope === "range" ? "on" : ""} onClick={() => setScope("range")}>
                Full range
              </button>
              <button role="tab" aria-selected={scope === "day"} className={scope === "day" ? "on" : ""} onClick={() => setScope("day")}>
                {fmtDay(day)} only
              </button>
            </div>
            <ForecastChart rows={chartRows} height={380} uid="main" />
          </Panel>

          <Panel
            id="decision"
            kicker="02 · Decision view"
            title="What to plan around for a delivery day"
            lead="The day's forecast with a 90% likely range built from historical error, so the thermal top-up can include a buffer you can defend."
          >
            <DecisionView rows={rows} days={days} day={day} onDay={setPickedDay} worstDay={worstDay} summary={summary} />
          </Panel>

          <Panel
            id="accuracy"
            kicker="03 · Accuracy"
            title="How wrong is the forecast, and when?"
            lead="Error is forecast minus actual. Positive means the forecast over-promised wind."
          >
            <div className="grid-3">
              <div className="card wide">
                <h3>By delivery day</h3>
                <DailyBreakdown daily={daily} selected={day} onSelect={selectDay} />
              </div>
              <div className="card">
                <h3>By hour of day</h3>
                <IntradayProfile hourly={hourly} />
              </div>
              <div className="card">
                <h3>Error distribution</h3>
                <ErrorDistribution rows={rows} summary={summary} />
              </div>
            </div>
          </Panel>

          <Panel
            id="horizon"
            kicker="04 · Forecast horizon"
            title="Does an earlier forecast cost accuracy?"
            lead="Re-scores the same days with older and older forecasts to show what the day-ahead deadline costs you."
          >
            <HorizonSweep params={applied} />
          </Panel>
        </>
      )}
    </main>
  );
}
