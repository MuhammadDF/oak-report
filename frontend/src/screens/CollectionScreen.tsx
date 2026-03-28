import { ScreenHeader } from "../components/common/ScreenHeader";
import { CollectionGrid } from "../components/collection/CollectionGrid";
import { CollectionStats } from "../components/collection/CollectionStats";
import { COLLECTION_CARDS } from "../data/mockCards";

export function CollectionScreen() {
  return (
    <section className="screen">
      <ScreenHeader
        description="A local version of the Figma collection view with quick stats and card tiles."
        eyebrow="Memory bank"
        title="Your authenticated collection."
      />

      <CollectionStats cards={COLLECTION_CARDS} />
      <CollectionGrid cards={COLLECTION_CARDS} />
    </section>
  );
}
