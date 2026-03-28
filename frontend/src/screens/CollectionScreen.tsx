import { ScreenHeader } from "../components/common/ScreenHeader";
import { CollectionGrid } from "../components/collection/CollectionGrid";
import { CollectionStats } from "../components/collection/CollectionStats";
import { CollectionCard } from "../types/app";

type CollectionScreenProps = {
  cards: CollectionCard[];
  onCardSelect: (card: CollectionCard) => void;
};

export function CollectionScreen({ cards, onCardSelect }: CollectionScreenProps) {
  return (
    <section className="screen">
      <ScreenHeader
        description="A local version of the Figma collection view with quick stats and card tiles."
        eyebrow="Collection"
        title="Your authenticated collection."
      />

      <CollectionStats cards={cards} />
      <CollectionGrid cards={cards} onSelectCard={onCardSelect} />
    </section>
  );
}
