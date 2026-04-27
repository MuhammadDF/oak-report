import { ScanResult } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type IdentityReportProps = {
  result: ScanResult;
};

export function IdentityReport({
  result,
}: IdentityReportProps) {
  return (
    <article className="panel report-panel">
      <div className="report-panel__header">
        <div>
          <p className="panel__eyebrow">Card identity</p>
          <h2>{result.card.name}</h2>
        </div>
        <span className="report-badge">{result.card.language ?? "Language pending"}</span>
      </div>

      <div className="report-summary">
        <div className="report-summary__art">
          {result.image_url ? (
            <img alt={result.card.name} src={result.image_url} />
          ) : (
            <div className="report-summary__placeholder">No card image</div>
          )}
        </div>

        <dl className="metric-list">
          <div>
            <dt>Set</dt>
            <dd>{result.set_name ?? "Pending"}</dd>
          </div>
          <div>
            <dt>Number</dt>
            <dd>{result.card.card_number ?? "Pending"}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{result.card.language ?? "Pending"}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>{formatCurrency("USD", result.pricing)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
