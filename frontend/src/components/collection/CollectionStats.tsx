import { CollectionCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type CollectionStatsProps = {
  cards: CollectionCard[];
};

export function CollectionStats({ cards }: CollectionStatsProps) {
  const totalValue = cards.reduce((sum, card) => sum + card.price, 0);

  return (
    <div className="stats-grid">
      <article className="panel stat-panel">
        <span>Cards</span>
        <strong>{cards.length}</strong>
      </article>
      <article className="panel stat-panel">
        <span>Total value</span>
        <strong>{formatCurrency("USD", totalValue)}</strong>
      </article>
      <article className="panel stat-panel">
        <span>30-day trend</span>
        <strong className="trend-up">+8.4%</strong>
      </article>
    </div>
  );
}
