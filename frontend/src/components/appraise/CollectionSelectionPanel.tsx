import { CollectionCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type CollectionSelectionPanelProps = {
  card: CollectionCard;
  onRemove: () => void;
};

export function CollectionSelectionPanel({
  card,
  onRemove,
}: CollectionSelectionPanelProps) {
  return (
    <section className="results-column">
      <article className="panel report-panel">
        <div className="report-panel__header">
          <div>
            <p className="panel__eyebrow">Collection card</p>
            <h2>{card.name}</h2>
          </div>
          {card.grade ? <span className="report-badge">{card.grade}</span> : null}
        </div>

        <div className="collection-detail">
          <div className="collection-detail__art">
            <img alt={card.name} src={card.image} />
          </div>
          <dl className="metric-list collection-detail__list">
            <div>
              <dt>Set</dt>
              <dd>{card.set}</dd>
            </div>
            <div>
              <dt>Number</dt>
              <dd>{card.number}</dd>
            </div>
            <div>
              <dt>Last appraised</dt>
              <dd>{formatCurrency("USD", card.price)}</dd>
            </div>
            <div>
              <dt>Trend</dt>
              <dd className={card.trend === "up" ? "trend-up" : "trend-down"}>
                {card.trend === "up" ? "+" : "-"}
                {card.trendPct}%
              </dd>
            </div>
          </dl>
        </div>

        <div className="report-actions">
          <button className="danger-button" onClick={onRemove} type="button">
            Remove from collection
          </button>
        </div>
      </article>
    </section>
  );
}
