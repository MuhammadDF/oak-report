import { LibraryCard } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type LibraryTableProps = {
  cards: LibraryCard[];
};

export function LibraryTable({ cards }: LibraryTableProps) {
  return (
    <div className="library-table">
      {cards.map((card) => (
        <article key={card.id} className="library-row">
          <div>
            <h2>{card.name}</h2>
            <p>
              {card.set} · {card.number}
            </p>
          </div>
          <div>
            <span>{card.type}</span>
            <p>{card.rarity}</p>
          </div>
          <strong>{formatCurrency("USD", card.price)}</strong>
        </article>
      ))}
    </div>
  );
}
