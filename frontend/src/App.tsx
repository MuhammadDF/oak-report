import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { AppraiseScreen } from "./screens/AppraiseScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { LibraryScreen } from "./screens/LibraryScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { Screen, ThemeMode, CollectionCard } from "./types/app";
import { COLLECTION_CARDS } from "./data/mockCards";

export default function App() {
  const [screen, setScreen] = useState<Screen>("appraise");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [collectionCards, setCollectionCards] = useState(COLLECTION_CARDS);
  const [selectedCollectionCard, setSelectedCollectionCard] =
    useState<CollectionCard | null>(null);

  const isDark = theme === "dark";

  function handleCollectionCardSelect(card: CollectionCard) {
    setSelectedCollectionCard(card);
    setScreen("appraise");
  }

  function handleClearCollectionSelection() {
    setSelectedCollectionCard(null);
  }

  function handleRemoveCollectionCard(cardId: string) {
    setCollectionCards((cards) => cards.filter((card) => card.id !== cardId));
    setSelectedCollectionCard((current) =>
      current && current.id === cardId ? null : current,
    );
  }

  return (
    <AppShell
      isDark={isDark}
      screen={screen}
      setScreen={setScreen}
      setTheme={setTheme}
    >
      {screen === "appraise" ? (
        <AppraiseScreen
          onClearCollectionSelection={handleClearCollectionSelection}
          onRemoveCollectionCard={handleRemoveCollectionCard}
          selectedCollectionCard={selectedCollectionCard}
        />
      ) : null}
      {screen === "collection" ? (
        <CollectionScreen
          cards={collectionCards}
          onCardSelect={handleCollectionCardSelect}
        />
      ) : null}
      {screen === "library" ? <LibraryScreen /> : null}
      {screen === "settings" ? (
        <SettingsScreen isDark={isDark} setTheme={setTheme} />
      ) : null}
    </AppShell>
  );
}
