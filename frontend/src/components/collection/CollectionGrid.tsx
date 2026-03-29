import { CollectionCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type CollectionGridProps = {
  cards: CollectionCard[];
  onSelectCard?: (card: CollectionCard) => void;
};

export function CollectionGrid({ cards, onSelectCard }: CollectionGridProps) {
  const visibleCards = cards.filter((card) => card.quantity > 0);

  return (
    <div className="card-grid">
      {visibleCards.map((card) => (
        <article
          key={card.id}
          className="panel collection-card collection-card--interactive"
          aria-label={`Inspect ${card.name}`}
          onClick={() => onSelectCard?.(card)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectCard?.(card);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="collection-card__image">
            <img alt={card.name} src={card.image} />
            {card.quantity > 1 ? (
              <span className="collection-card__quantity">×{card.quantity}</span>
            ) : null}
            {card.grade ? <span className="grade-pill">{card.grade}</span> : null}
          </div>
          <div className="collection-card__body">
            <h2>{card.name}</h2>
            <p>
              {card.set} · {card.number}
            </p>
            <div className="collection-card__meta">
              <strong>{formatCurrency("USD", card.price)}</strong>
              <span className={card.trend === "up" ? "trend-up" : "trend-down"}>
                {card.trend === "up" ? "+" : "-"}
                {card.trendPct}%
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
