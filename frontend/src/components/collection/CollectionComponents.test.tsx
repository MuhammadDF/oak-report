import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CollectionGrid } from "./CollectionGrid";
import { CollectionSearch } from "./CollectionSearch";
import { CollectionStats } from "./CollectionStats";

const cards = [
  {
    id: "card-1",
    name: "Pikachu",
    set: "Base",
    number: "25",
    price: 12.5,
    image: "/pikachu.png",
    quantity: 2,
    grade: "PSA 9",
  },
  {
    id: "card-2",
    name: "Bulbasaur",
    set: "Base",
    number: "1",
    price: 5,
    image: "/bulbasaur.png",
    quantity: 0,
  },
] as const;

describe("CollectionSearch", () => {
  it("forwards search and sort changes", () => {
    const onChange = vi.fn();
    const onSortChange = vi.fn();
    render(
      <CollectionSearch
        onChange={onChange}
        onSortChange={onSortChange}
        sortBy="name"
        value=""
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pika" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "price-desc" } });

    expect(onChange).toHaveBeenCalledWith("pika");
    expect(onSortChange).toHaveBeenCalledWith("price-desc");
  });
});

describe("CollectionStats", () => {
  it("renders total cards and total value", () => {
    render(<CollectionStats cards={[...cards]} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
  });
});

describe("CollectionGrid", () => {
  it("renders visible cards and supports click plus keyboard selection", () => {
    const onSelectCard = vi.fn();
    render(<CollectionGrid cards={[...cards]} onSelectCard={onSelectCard} />);

    const cardButton = screen.getByRole("button", { name: "Inspect Pikachu" });
    fireEvent.click(cardButton);
    fireEvent.keyDown(cardButton, { key: "Enter" });
    fireEvent.keyDown(cardButton, { key: " " });

    expect(screen.queryByText("Bulbasaur")).not.toBeInTheDocument();
    expect(screen.getByText("×2")).toBeInTheDocument();
    expect(screen.getByText("PSA 9")).toBeInTheDocument();
    expect(onSelectCard).toHaveBeenCalledTimes(3);
  });
});
