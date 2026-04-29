import { CollectionCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type CollectionSelectionPanelProps = {
  card: CollectionCard;
  onQuantityChange: (nextQuantity: number) => void;
  onRemove: () => void;
  onClose?: () => void;
};

export function CollectionSelectionPanel({
  card,
  onQuantityChange,
  onRemove,
  onClose,
}: CollectionSelectionPanelProps) {
  const totalHeld = card.price * card.quantity;

  function handleAdjustQuantity(delta: number) {
    const nextQuantity = Math.max(0, card.quantity + delta);
    onQuantityChange(nextQuantity);
  }

  return (
    <article className="panel report-modal__panel results-column">
      <div className="appraisal-header">
        {card.grade ? <span className="report-badge">{card.grade}</span> : null}
        {onClose ? (
          <button
            aria-label="Close collection card"
            className="report-modal__close"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        ) : null}
      </div>
      <div className="appraisal-art">
        <img alt={card.name} src={card.image} />
      </div>
      <div className="appraisal-details">
        <h2 className="appraisal-name">{card.name}</h2>
        <div className="appraisal-separator" />
        <dl className="appraisal-meta">
          <div className="appraisal-meta__row">
            <dt>Set</dt>
            <dd>{card.set}</dd>
          </div>
          <div className="appraisal-meta__row">
            <dt>Number</dt>
            <dd>{card.number}</dd>
          </div>
          <div className="appraisal-meta__row">
            <dt>Owned</dt>
            <dd>×{card.quantity}</dd>
          </div>
        </dl>
        <div className="appraisal-price appraisal-price--split">
          <div>
            <span className="appraisal-price__label">Last appraised</span>
            <strong className="appraisal-price__value">{formatCurrency("USD", card.price)}</strong>
          </div>
          <div>
            <span className="appraisal-price__label">Total held</span>
            <strong className="appraisal-price__value">{formatCurrency("USD", totalHeld)}</strong>
          </div>
        </div>
        <div className="appraisal-actions">
          <div className="appraisal-actions__buttons">
            <div className="quantity-stepper">
              <button
                aria-label="Decrease quantity"
                onClick={() => handleAdjustQuantity(-1)}
                type="button"
                disabled={card.quantity === 0}
              >
                −
              </button>
              <strong>{card.quantity}</strong>
              <button
                aria-label="Increase quantity"
                onClick={() => handleAdjustQuantity(1)}
                type="button"
              >
                +
              </button>
            </div>
            <button className="danger-button appraisal-cta" onClick={onRemove} type="button">
              <TrashIcon />
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
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
