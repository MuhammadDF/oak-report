import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { AppraiseScreen } from "./screens/AppraiseScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { Screen, ThemeMode } from "./types/app";
import { COLLECTION_CARDS } from "./data/mockCards";

export default function App() {
  const [screen, setScreen] = useState<Screen>("appraise");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [collectionCards, setCollectionCards] = useState(COLLECTION_CARDS);

  const isDark = theme === "dark";

  function handleUpdateCollectionQuantity(cardId: string, nextQuantity: number) {
    setCollectionCards((cards) => {
      const updated = cards
        .map((card) =>
          card.id === cardId
            ? { ...card, quantity: Math.max(0, nextQuantity) }
            : card,
        )
        .filter((card) => card.quantity > 0);

      return updated;
    });
  }

  function handleRemoveCollectionCard(cardId: string) {
    setCollectionCards((cards) => cards.filter((card) => card.id !== cardId));
  }

  return (
    <AppShell
      isDark={isDark}
      screen={screen}
      setScreen={setScreen}
      setTheme={setTheme}
    >
      {screen === "appraise" ? <AppraiseScreen /> : null}
      {screen === "collection" ? (
        <CollectionScreen
          cards={collectionCards}
          onCardQuantityChange={handleUpdateCollectionQuantity}
          onRemoveCard={handleRemoveCollectionCard}
        />
      ) : null}
      {screen === "settings" ? (
        <SettingsScreen isDark={isDark} setTheme={setTheme} />
      ) : null}
    </AppShell>
  );
}
