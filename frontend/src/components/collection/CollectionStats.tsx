import { CollectionCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type CollectionStatsProps = {
  cards: CollectionCard[];
};

export function CollectionStats({ cards }: CollectionStatsProps) {
  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  const totalValue = cards.reduce(
    (sum, card) => sum + card.price * card.quantity,
    0,
  );

  return (
    <div className="stats-grid">
      <article className="panel stat-panel">
        <span>Total cards</span>
        <strong>{totalCards}</strong>
      </article>
      <article className="panel stat-panel">
        <span>Total value</span>
        <strong>{formatCurrency("USD", totalValue)}</strong>
      </article>
    </div>
  );
}
