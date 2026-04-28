import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { CollectionCard } from "./types/app";
import type { AuthUser } from "./types/app";

const {
  mockAuthState,
  mockUseAuthSession,
  mockGetCollection,
  mockUpdateCollectionQuantity,
  mockRemoveCollectionCard,
} = vi.hoisted(() => ({
  mockAuthState: {
    authToken: null as string | null,
    authUser: null as AuthUser | null,
    isAuthLoading: false,
    isAuthSubmitting: false,
    authError: null as string | null,
    targetScreen: "signin" as
      | "appraise"
      | "collection"
      | "library"
      | "profile"
      | "admin"
      | "access_required"
      | "signin",
  },
  mockUseAuthSession: vi.fn(),
  mockGetCollection: vi.fn(),
  mockUpdateCollectionQuantity: vi.fn(),
  mockRemoveCollectionCard: vi.fn(),
}));

vi.mock("./hooks/useAuthSession", () => ({
  useAuthSession: ({
    screen,
    setScreen,
  }: {
    screen: string;
    setScreen: (nextScreen: string) => void;
  }) => {
    useEffect(() => {
      if (screen !== mockAuthState.targetScreen) {
        setScreen(mockAuthState.targetScreen);
      }
    }, [screen, setScreen]);

    return mockUseAuthSession({
      screen,
      setScreen,
      state: mockAuthState,
    });
  },
}));

vi.mock("./repositories/collectionRepository", () => ({
  getCollectionRepository: () => ({
    getCollection: mockGetCollection,
    updateCollectionQuantity: mockUpdateCollectionQuantity,
    removeCollectionCard: mockRemoveCollectionCard,
  }),
}));

vi.mock("./components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("./screens/SignInScreen", () => ({
  SignInScreen: () => <div>Sign in screen</div>,
}));

vi.mock("./screens/AccessRequiredScreen", () => ({
  AccessRequiredScreen: () => <div>Access required screen</div>,
}));

vi.mock("./screens/ProfileScreen", () => ({
  ProfileScreen: () => <div>Profile screen</div>,
}));

vi.mock("./screens/AppraiseScreen", () => ({
  AppraiseScreen: ({
    onCollectionAdded,
  }: {
    onCollectionAdded?: () => void;
  }) => (
    <div>
      <div>Appraise screen</div>
      <button onClick={onCollectionAdded} type="button">
        Refresh collection
      </button>
    </div>
  ),
}));

vi.mock("./screens/AdminScreen", () => ({
  AdminScreen: () => <div>Admin screen</div>,
}));

vi.mock("./screens/CollectionScreen", () => ({
  CollectionScreen: ({
    cards,
    onCardQuantityChange,
    onRemoveCard,
  }: {
    cards: CollectionCard[];
    onCardQuantityChange: (cardId: string, quantity: number) => void;
    onRemoveCard: (cardId: string) => void;
  }) => (
    <div>
      <div>Collection count: {cards.length}</div>
      <button onClick={() => onCardQuantityChange("missing-card", 0)} type="button">
        Force quantity update
      </button>
      <button onClick={() => onRemoveCard("missing-card")} type="button">
        Force remove card
      </button>
      {cards.map((card) => (
        <div key={card.id}>
          <span>{card.name}</span>
          <span>Quantity: {card.quantity}</span>
          <button onClick={() => onCardQuantityChange(card.id, card.quantity + 1)} type="button">
            Increase {card.name}
          </button>
          <button onClick={() => onRemoveCard(card.id)} type="button">
            Remove {card.name}
          </button>
        </div>
      ))}
    </div>
  ),
}));

function createCollectionCard(overrides: Partial<CollectionCard> = {}): CollectionCard {
  return {
    id: "card-1",
    name: "Pikachu",
    set: "Base Set",
    number: "25",
    price: 12.5,
    image: "/pikachu.png",
    quantity: 1,
    ...overrides,
  };
}

function setMockAuthSessionState({
  authToken = null,
  authUser = null,
  isAuthLoading = false,
  isAuthSubmitting = false,
  authError = null,
  targetScreen = "signin",
}: {
  authToken?: string | null;
  authUser?: AuthUser | null;
  isAuthLoading?: boolean;
  isAuthSubmitting?: boolean;
  authError?: string | null;
  targetScreen?: "appraise" | "collection" | "library" | "profile" | "admin" | "access_required" | "signin";
}) {
  mockAuthState.authToken = authToken;
  mockAuthState.authUser = authUser;
  mockAuthState.isAuthLoading = isAuthLoading;
  mockAuthState.isAuthSubmitting = isAuthSubmitting;
  mockAuthState.authError = authError;
  mockAuthState.targetScreen = targetScreen;

  mockUseAuthSession.mockImplementation(() => ({
    authToken: mockAuthState.authToken,
    authUser: mockAuthState.authUser,
    isAuthLoading: mockAuthState.isAuthLoading,
    isAuthSubmitting: mockAuthState.isAuthSubmitting,
    authError: mockAuthState.authError,
    handleCredentialReceived: vi.fn(),
    handleSignOut: vi.fn(),
    handleScreenChange: vi.fn(),
  }));
}

describe("App", () => {
  beforeEach(() => {
    mockGetCollection.mockReset();
    mockUpdateCollectionQuantity.mockReset();
    mockRemoveCollectionCard.mockReset();
    mockUseAuthSession.mockReset();
    setMockAuthSessionState({});
  });

  it("shows the sign-in screen while unauthenticated", () => {
    setMockAuthSessionState({});

    render(<App />);

    expect(screen.getByText("Sign in screen")).toBeInTheDocument();
    expect(mockGetCollection).not.toHaveBeenCalled();
  });

  it("shows the auth loading state while restoring a session", () => {
    setMockAuthSessionState({
      isAuthLoading: true,
    });

    render(<App />);

    expect(screen.getByText("Restoring your session...")).toBeInTheDocument();
  });

  it("renders the access-required screen for restricted users", () => {
    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "misty@example.com",
        display_name: "Misty",
        role: "na",
      },
      targetScreen: "access_required",
    });

    render(<App />);

    expect(screen.getByText("Access required screen")).toBeInTheDocument();
  });

  it("loads collection data when authenticated and clears it when the token is removed", async () => {
    const firstState = {
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector" as const,
      },
      isAuthLoading: false,
      isAuthSubmitting: false,
      authError: null,
      targetScreen: "collection" as const,
    };
    const secondState = {
      ...firstState,
      authToken: null,
      targetScreen: "collection" as const,
    };

    setMockAuthSessionState(firstState);
    mockGetCollection.mockResolvedValueOnce([createCollectionCard()]);

    const { rerender } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Collection count: 1")).toBeInTheDocument();
    });
    expect(mockGetCollection).toHaveBeenCalledWith("token-123");

    setMockAuthSessionState(secondState);
    rerender(<App />);

    await waitFor(() => {
      expect(screen.getByText("Collection count: 0")).toBeInTheDocument();
    });
  });

  it("renders the admin screen only for admins", () => {
    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "oak@example.com",
        display_name: "Oak",
        role: "admin",
      },
      targetScreen: "admin",
    });

    render(<App />);

    expect(screen.getByText("Admin screen")).toBeInTheDocument();
  });

  it("renders appraise and profile screens for authenticated collectors", async () => {
    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "appraise",
    });

    const { unmount } = render(<App />);
    expect(screen.getByText("Appraise screen")).toBeInTheDocument();

    unmount();
    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "profile",
    });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Profile screen")).toBeInTheDocument();
    });
  });

  it("updates local collection state for quantity changes and removals", async () => {
    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "collection",
    });
    mockGetCollection.mockResolvedValueOnce([
      createCollectionCard(),
      createCollectionCard({ id: "card-2", name: "Bulbasaur", quantity: 2 }),
    ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Quantity: 1")).toBeInTheDocument();
      expect(screen.getByText("Quantity: 2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Increase Pikachu" }));

    await waitFor(() => {
      expect(screen.getAllByText("Quantity: 2")).toHaveLength(2);
    });
    expect(mockUpdateCollectionQuantity).toHaveBeenCalledWith("token-123", "card-1", 2);

    fireEvent.click(screen.getByRole("button", { name: "Remove Bulbasaur" }));

    await waitFor(() => {
      expect(screen.getByText("Collection count: 1")).toBeInTheDocument();
    });
    expect(mockRemoveCollectionCard).toHaveBeenCalledWith("token-123", "card-2");
  });

  it("skips collection loading when auth is missing", async () => {
    setMockAuthSessionState({
      authToken: null,
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "collection",
    });

    mockGetCollection.mockResolvedValueOnce([
      createCollectionCard(),
    ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Collection count: 0")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Force quantity update" }));
    fireEvent.click(screen.getByRole("button", { name: "Force remove card" }));

    expect(mockGetCollection).not.toHaveBeenCalled();
    expect(mockUpdateCollectionQuantity).not.toHaveBeenCalled();
    expect(mockRemoveCollectionCard).not.toHaveBeenCalled();
  });

  it("refreshes collection changes for authenticated collectors", async () => {
    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "appraise",
    });
    mockGetCollection.mockResolvedValueOnce([createCollectionCard()]);
    mockGetCollection.mockResolvedValueOnce([createCollectionCard({ quantity: 2 })]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Appraise screen")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Refresh collection" }));

    await waitFor(() => {
      expect(mockGetCollection).toHaveBeenCalledTimes(2);
    });
  });

  it("ignores collection refresh requests without an auth token", async () => {
    setMockAuthSessionState({
      authToken: null,
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "appraise",
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh collection" }));

    expect(mockGetCollection).not.toHaveBeenCalled();
  });

  it("clears collection state when loading fails and ignores refresh failures", async () => {
    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "collection",
    });
    mockGetCollection.mockRejectedValueOnce(new Error("load failed"));

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Collection count: 0")).toBeInTheDocument();
    });

    unmount();

    setMockAuthSessionState({
      authToken: "token-123",
      authUser: {
        id: "user-1",
        email: "ash@example.com",
        display_name: "Ash",
        role: "collector",
      },
      targetScreen: "appraise",
    });
    mockGetCollection
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("refresh failed"));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh collection" }));

    await waitFor(() => {
      expect(mockGetCollection).toHaveBeenCalled();
    });
  });
});
