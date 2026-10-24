import { useEffect, useState } from "react";
import { fetchHealth } from "../../api/client";
import "./Header.css";

const LINKS = [
  ["Overview", "#overview"],
  ["Forecast", "#forecast"],
  ["Decision", "#decision"],
  ["Accuracy", "#accuracy"],
  ["Horizon", "#horizon"],
];

export default function Header() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchHealth(ctrl.signal)
      .then(() => setOnline(true))
      .catch((e) => e.name !== "AbortError" && setOnline(false));
    return () => ctrl.abort();
  }, []);

  return (
    <header className="hd">
      <a className="hd-brand" href="#overview" aria-label="Redline home">
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
          <rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="#ff2638" strokeWidth="1.6" />
          <path d="M5 21 C 9 21, 9 11, 14 11 S 19 21, 23 21 S 26 15, 27 15" fill="none" stroke="#ff2638" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span>
          RED<b>LINE</b>
        </span>
      </a>

      <nav className="hd-nav" aria-label="Sections">
        {LINKS.map(([label, href]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </nav>

      <div className={`hd-status ${online === false ? "off" : online ? "on" : ""}`} title="Backend health check">
        <i />
        {online === null ? "Connecting" : online ? "API live" : "API offline"}
      </div>
    </header>
  );
}
