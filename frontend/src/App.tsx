import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { AppraiseScreen } from "./screens/AppraiseScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { getCollectionRepository } from "./repositories/collectionRepository";
import { useAuthSession } from "./hooks/useAuthSession";
import { CollectionCard, Screen, ThemeMode } from "./types/app";

const collectionRepository = getCollectionRepository();

export default function App() {
  const [screen, setScreen] = useState<Screen>("appraise");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);

  const {
    authToken,
    authUser,
    isAuthLoading,
    isAuthSubmitting,
    authError,
    handleCredentialReceived,
    handleSignOut,
    handleScreenChange,
  } = useAuthSession({
    screen,
    setScreen,
  });

  const isDark = theme === "dark";

  useEffect(() => {
    if (!authToken) {
      setCollectionCards([]);
      return;
    }

    let cancelled = false;

    async function loadCollection() {
      try {
        const cards = await collectionRepository.getCollection(authToken);
        if (!cancelled) {
          setCollectionCards(cards);
        }
      } catch {
        if (!cancelled) {
          setCollectionCards([]);
        }
      }
    }

    loadCollection();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

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

    if (!authToken) {
      return;
    }

    void collectionRepository.updateCollectionQuantity(
      authToken,
      cardId,
      Math.max(0, nextQuantity),
    );
  }

  function handleRemoveCollectionCard(cardId: string) {
    setCollectionCards((cards) => cards.filter((card) => card.id !== cardId));

    if (!authToken) {
      return;
    }

    void collectionRepository.removeCollectionCard(authToken, cardId);
  }

  function handleCollectionChanged() {
    if (!authToken) {
      return;
    }

    void collectionRepository
      .getCollection(authToken)
      .then((cards) => {
        setCollectionCards(cards);
      })
      .catch(() => {
        setCollectionCards([]);
      });
  }

  return (
    <AppShell
      isDark={isDark}
      screen={screen}
      setScreen={handleScreenChange}
      setTheme={setTheme}
    >
      {isAuthLoading ? (
        <section className="screen auth-screen">
          <article className="panel auth-panel">
            <p className="panel__eyebrow">Authentication</p>
            <h2>Restoring your session...</h2>
          </article>
        </section>
      ) : null}
      {!isAuthLoading && screen === "signin" ? (
        <SignInScreen
          isSubmitting={isAuthSubmitting}
          error={authError}
          onCredentialReceived={handleCredentialReceived}
        />
      ) : null}
      {screen === "appraise" ? (
        <AppraiseScreen
          authToken={authToken}
          onCollectionChanged={handleCollectionChanged}
        />
      ) : null}
      {screen === "collection" && authUser ? (
        <CollectionScreen
          cards={collectionCards}
          onCardQuantityChange={handleUpdateCollectionQuantity}
          onRemoveCard={handleRemoveCollectionCard}
        />
      ) : null}
      {screen === "profile" && authUser ? (
        <ProfileScreen user={authUser} onSignOut={handleSignOut} />
      ) : null}
    </AppShell>
  );
}
