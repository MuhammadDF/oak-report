import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LibraryScreen } from "./LibraryScreen";

const { mockListCards } = vi.hoisted(() => ({
  mockListCards: vi.fn(),
}));

vi.mock("../repositories/libraryRepository", () => ({
  getLibraryRepository: () => ({
    listCards: mockListCards,
  }),
}));

describe("LibraryScreen", () => {
  it("clears cards when auth is missing", () => {
    render(<LibraryScreen authToken={null} />);

    expect(screen.getByRole("heading", { name: "Search the reference card catalog." })).toBeInTheDocument();
    expect(mockListCards).not.toHaveBeenCalled();
  });

  it("loads and filters cards", async () => {
    mockListCards.mockResolvedValueOnce([
      {
        id: "card-1",
        name: "Pikachu",
        set: "Base",
        number: "25",
        rarity: "Common",
        type: "Electric",
        price: 12.5,
      },
      {
        id: "card-2",
        name: "Bulbasaur",
        set: "Jungle",
        number: "1",
        rarity: "Common",
        type: "Grass",
        price: 4,
      },
    ]);

    render(<LibraryScreen authToken="token-123" />);

    await waitFor(() => {
      expect(screen.getByText("Pikachu")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "grass" } });

    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.queryByText("Pikachu")).not.toBeInTheDocument();
  });

  it("falls back to an empty table on repository failure", async () => {
    mockListCards.mockRejectedValueOnce(new Error("boom"));

    render(<LibraryScreen authToken="token-123" />);

    await waitFor(() => {
      expect(screen.queryByText("Pikachu")).not.toBeInTheDocument();
    });
  });
});
