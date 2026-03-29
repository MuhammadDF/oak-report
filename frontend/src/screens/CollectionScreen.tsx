import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { CollectionGrid } from "../components/collection/CollectionGrid";
import { CollectionStats } from "../components/collection/CollectionStats";
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
  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId) ?? null,
    [activeCardId, cards],
  );

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
        description="A local version of the Figma collection view with quick stats and card tiles."
        eyebrow="Collection"
        title="Your authenticated collection."
      />

      <CollectionStats cards={cards} />
      <CollectionGrid
        cards={cards}
        onSelectCard={(card) => setActiveCardId(card.id)}
      />

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
          <div className="report-modal__panel">
            <div className="report-modal__header">
              <p className="panel__eyebrow">Collection card</p>
              <button
                className="report-modal__close"
                onClick={handleCloseModal}
                type="button"
              >
                Close
              </button>
            </div>
            <CollectionSelectionPanel
              card={activeCard}
              onQuantityChange={(quantity) =>
                onCardQuantityChange(activeCard.id, quantity)
              }
              onRemove={() => handleRemoveCard(activeCard.id)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
