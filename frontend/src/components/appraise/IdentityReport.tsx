import { ScanResult } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type IdentityReportProps = {
  previewUrl: string | null;
  result: ScanResult;
  embedded?: boolean;
};

export function IdentityReport({
  previewUrl,
  result,
  embedded = false,
}: IdentityReportProps) {
  const artSrc = result.image_url ?? previewUrl;

  const content = (
    <>
      <h2>{result.card.name}</h2>

      <div className="report-summary">
        <div className="report-summary__art">
          {artSrc ? (
            <img alt={result.card.name} src={artSrc} />
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
    </>
  );

  if (embedded) {
    return content;
  }

  return <article className="panel report-panel">{content}</article>;
}
