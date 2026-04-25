import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { CollectionGrid } from "../components/collection/CollectionGrid";
import { CollectionStats } from "../components/collection/CollectionStats";
import { CollectionSearch } from "../components/collection/CollectionSearch";
import { CollectionSelectionPanel } from "../components/appraise/CollectionSelectionPanel";
import { CollectionCard } from "../types/app";

type CollectionScreenProps = {
  cards: CollectionCard[];
  onCardQuantityChange: (cardId: string, nextQuantity: number) => void;
  onRemoveCard: (cardId: string) => void;
};

export function CollectionScreen({
  cards,
  onCardQuantityChange,
  onRemoveCard,
}: CollectionScreenProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId) ?? null,
    [activeCardId, cards],
  );
  const normalizedQuery = search.trim().toLowerCase();
  const filteredCards = useMemo(() => {
    if (!normalizedQuery) {
      return cards;
    }

    return cards.filter((card) => {
      return (
        card.name.toLowerCase().includes(normalizedQuery) ||
        card.set.toLowerCase().includes(normalizedQuery) ||
        card.number.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [cards, normalizedQuery]);

  useEffect(() => {
    if (activeCardId && !activeCard) {
      setActiveCardId(null);
    }
  }, [activeCardId, activeCard]);

  function handleCloseModal() {
    setActiveCardId(null);
  }

  function handleRemoveCard(cardId: string) {
    onRemoveCard(cardId);
    handleCloseModal();
  }

  return (
    <section className="screen">
      <ScreenHeader
        title="Your Collection"
      />

      <CollectionSearch onChange={setSearch} value={search} />

      <CollectionStats cards={filteredCards} />
      {filteredCards.length ? (
        <CollectionGrid
          cards={filteredCards}
          onSelectCard={(card) => setActiveCardId(card.id)}
        />
      ) : (
        <p className="collection-empty">
          No cards matched “{search.trim()}”.
        </p>
      )}

      {activeCard ? (
        <div
          aria-modal="true"
          className="report-modal"
          onClick={(event) => {
            if (event.currentTarget === event.target) {
              handleCloseModal();
            }
          }}
          role="dialog"
        >
          <CollectionSelectionPanel
            card={activeCard}
            onQuantityChange={(quantity) =>
              onCardQuantityChange(activeCard.id, quantity)
            }
            onRemove={() => handleRemoveCard(activeCard.id)}
            onClose={handleCloseModal}
          />
        </div>
      ) : null}
    </section>
  );
}
