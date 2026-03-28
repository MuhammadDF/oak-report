import { ScanResult } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type PricingReportProps = {
  result: ScanResult;
};

export function PricingReport({ result }: PricingReportProps) {
  return (
    <article className="panel report-panel">
      <div className="report-panel__header">
        <div>
          <p className="panel__eyebrow">Market value</p>
          <h2>
            {formatCurrency(
              result.pricing.currency,
              result.pricing.estimated_market_value,
            )}
          </h2>
        </div>
        <span className="market-chip">Live estimate</span>
      </div>

      <ul className="price-list">
        {result.pricing.price_points.map((point) => (
          <li key={`${point.source}-${point.label}`}>
            <div>
              <p>
                {point.source} · {point.label}
              </p>
              <span>{point.url}</span>
            </div>
            <a href={point.url} rel="noreferrer" target="_blank">
              {formatCurrency(result.pricing.currency, point.price)}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
