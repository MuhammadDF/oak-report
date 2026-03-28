import { ScanResult } from "../../types/app";

type IdentityReportProps = {
  previewUrl: string | null;
  result: ScanResult;
};

export function IdentityReport({
  previewUrl,
  result,
}: IdentityReportProps) {
  return (
    <article className="panel report-panel">
      <div className="report-panel__header">
        <div>
          <p className="panel__eyebrow">Card identity</p>
          <h2>{result.card.name}</h2>
        </div>
        <span className="report-badge">
          {result.card.rarity ?? "Rarity pending"}
        </span>
      </div>

      <div className="report-summary">
        <div className="report-summary__art">
          {result.card.image_url ? (
            <img alt={result.card.name} src={result.card.image_url} />
          ) : previewUrl ? (
            <img alt={result.card.name} src={previewUrl} />
          ) : (
            <div className="report-summary__placeholder">No card image</div>
          )}
        </div>

        <dl className="metric-list">
          <div>
            <dt>Set</dt>
            <dd>{result.card.set_name ?? "Pending"}</dd>
          </div>
          <div>
            <dt>Number</dt>
            <dd>
              {result.card.card_number ?? "Pending"}
              {result.card.set_size ? ` / ${result.card.set_size}` : ""}
            </dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{result.card.types.join(", ") || "Pending"}</dd>
          </div>
          <div>
            <dt>Condition</dt>
            <dd>{result.condition.condition_label}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
