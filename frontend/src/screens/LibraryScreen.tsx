import { useState } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { LibrarySearch } from "../components/library/LibrarySearch";
import { LibraryTable } from "../components/library/LibraryTable";
import { LIBRARY_CARDS } from "../data/mockCards";

export function LibraryScreen() {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filteredCards = !query
    ? LIBRARY_CARDS
    : LIBRARY_CARDS.filter((card) => {
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
