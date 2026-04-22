import { useEffect, useState } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { LibrarySearch } from "../components/library/LibrarySearch";
import { LibraryTable } from "../components/library/LibraryTable";
import { getLibraryRepository } from "../repositories/libraryRepository";
import { LibraryCard } from "../types/app";

const libraryRepository = getLibraryRepository();

type LibraryScreenProps = {
  authToken: string | null;
};

export function LibraryScreen({ authToken }: LibraryScreenProps) {
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState<LibraryCard[]>([]);

  useEffect(() => {
    if (!authToken) {
      setCards([]);
      return;
    }

    let cancelled = false;

    async function loadCards() {
      try {
        const result = await libraryRepository.listCards(authToken);
        if (!cancelled) {
          setCards(result);
        }
      } catch {
        if (!cancelled) {
          setCards([]);
        }
      }
    }

    loadCards();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const query = search.trim().toLowerCase();
  const filteredCards = !query
    ? cards
    : cards.filter((card) => {
        return (
          card.name.toLowerCase().includes(query) ||
          card.set.toLowerCase().includes(query) ||
          card.type.toLowerCase().includes(query)
        );
      });

  return (
    <section className="screen">
      <ScreenHeader
        description="This keeps the structure of the mockup's library screen without adding extra dependencies."
        eyebrow="Library"
        title="Search the reference card catalog."
      />

      <div className="panel library-panel">
        <LibrarySearch onChange={setSearch} value={search} />
        <LibraryTable cards={filteredCards} />
      </div>
    </section>
  );
}
