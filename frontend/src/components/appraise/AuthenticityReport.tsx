import { ScanResult } from "../../types/app";

type AuthenticityReportProps = {
  result: ScanResult;
};

export function AuthenticityReport({
  result,
}: AuthenticityReportProps) {
  const isAuthentic = result.authenticity.is_authentic_guess;

  return (
    <article className="panel report-panel">
      <div className="report-panel__header">
        <div>
          <p className="panel__eyebrow">Authenticity</p>
          <h2>{isAuthentic ? "Likely authentic" : "Needs manual review"}</h2>
        </div>
        <span
          className={`confidence-pill ${
            isAuthentic ? "confidence-pill--pass" : "confidence-pill--warn"
          }`}
        >
          {Math.round(result.authenticity.confidence * 100)}%
        </span>
      </div>

      <p className="report-copy">{result.authenticity.summary}</p>

      <ul className="signal-list">
        {result.authenticity.signals.map((signal) => (
          <li key={signal.name} className="signal-list__item">
            <span
              className={`signal-dot ${
                signal.passed ? "signal-dot--pass" : "signal-dot--warn"
              }`}
            />
            <div>
              <p>{signal.name}</p>
              <span>{signal.detail}</span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
