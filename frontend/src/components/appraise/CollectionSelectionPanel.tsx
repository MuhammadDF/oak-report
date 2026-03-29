import { CollectionCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type CollectionSelectionPanelProps = {
  card: CollectionCard;
  onQuantityChange: (nextQuantity: number) => void;
  onRemove: () => void;
};

export function CollectionSelectionPanel({
  card,
  onQuantityChange,
  onRemove,
}: CollectionSelectionPanelProps) {
  const totalHeld = card.price * card.quantity;

  function handleAdjustQuantity(delta: number) {
    const nextQuantity = Math.max(0, card.quantity + delta);
    onQuantityChange(nextQuantity);
  }

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
            <div>
              <dt>Total held</dt>
              <dd>{formatCurrency("USD", totalHeld)}</dd>
            </div>
          </dl>
        </div>

        <div className="collection-quantity">
          <span>Quantity owned</span>
          <div className="quantity-stepper">
            <button
              aria-label="Decrease quantity"
              onClick={() => handleAdjustQuantity(-1)}
              type="button"
              disabled={card.quantity === 0}
            >
              -
            </button>
            <strong>{card.quantity}</strong>
            <button
              aria-label="Increase quantity"
              onClick={() => handleAdjustQuantity(1)}
              type="button"
            >
              +
            </button>
            <button className="trash-button" onClick={onRemove} type="button">
              <TrashIcon />
              <span className="sr-only">Remove card</span>
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M3 6h18" />
      <path d="M8 6v13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
      <path d="M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
