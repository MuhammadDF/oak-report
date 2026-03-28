import { CollectionCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type CollectionGridProps = {
  cards: CollectionCard[];
};

export function CollectionGrid({ cards }: CollectionGridProps) {
  return (
    <div className="card-grid">
      {cards.map((card) => (
        <article key={card.id} className="panel collection-card">
          <div className="collection-card__image">
            <img alt={card.name} src={card.image} />
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
