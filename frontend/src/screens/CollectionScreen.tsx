import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { CollectionGrid } from "../components/collection/CollectionGrid";
import { CollectionStats } from "../components/collection/CollectionStats";
import { CollectionSearch } from "../components/collection/CollectionSearch";
import { CollectionSelectionPanel } from "../components/appraise/CollectionSelectionPanel";
import { CollectionCard } from "../types/app";

type CollectionSort =
  | "name"
  | "set"
  | "price-desc"
  | "price-asc"
  | "copies-desc"
  | "copies-asc";

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
  const [sortBy, setSortBy] = useState<CollectionSort>("name");
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

  const sortedCards = useMemo(() => {
    const cardsToSort = [...filteredCards];

    if (sortBy === "price-desc") {
      return cardsToSort.sort((left, right) => right.price - left.price);
    }

    if (sortBy === "price-asc") {
      return cardsToSort.sort((left, right) => left.price - right.price);
    }

    if (sortBy === "copies-desc") {
      return cardsToSort.sort((left, right) => right.quantity - left.quantity);
    }

    if (sortBy === "copies-asc") {
      return cardsToSort.sort((left, right) => left.quantity - right.quantity);
    }

    if (sortBy === "set") {
      return cardsToSort.sort((left, right) => {
        return (
          left.set.localeCompare(right.set) ||
          left.name.localeCompare(right.name) ||
          left.number.localeCompare(right.number)
        );
      });
    }

    return cardsToSort.sort((left, right) => {
      return (
        left.name.localeCompare(right.name) ||
        left.set.localeCompare(right.set) ||
        left.number.localeCompare(right.number)
      );
    });
  }, [filteredCards, sortBy]);

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

      <CollectionSearch
        onChange={setSearch}
        onSortChange={setSortBy}
        sortBy={sortBy}
        value={search}
      />

      <CollectionStats cards={sortedCards} />
      {sortedCards.length ? (
        <CollectionGrid
          cards={sortedCards}
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
