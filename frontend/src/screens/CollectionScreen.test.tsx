import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CollectionScreen } from "./CollectionScreen";

const cards = [
  {
    id: "card-1",
    name: "Pikachu",
    set: "Base",
    number: "25",
    price: 10,
    image: "/pikachu.png",
    quantity: 1,
    grade: "PSA 9",
  },
  {
    id: "card-2",
    name: "Bulbasaur",
    set: "Jungle",
    number: "1",
    price: 5,
    image: "/bulbasaur.png",
    quantity: 3,
  },
] as const;

describe("CollectionScreen", () => {
  it("filters, sorts, and updates cards through the modal", () => {
    const onCardQuantityChange = vi.fn();
    const onRemoveCard = vi.fn();

    render(
      <CollectionScreen
        cards={[...cards]}
        onCardQuantityChange={onCardQuantityChange}
        onRemoveCard={onRemoveCard}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "jungle" } });
    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.queryByText("Pikachu")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "copies-asc" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Inspect Pikachu" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));

    expect(onCardQuantityChange).toHaveBeenCalledWith("card-1", 2);
    expect(onRemoveCard).toHaveBeenCalledWith("card-1");
  });

  it("clears active selections when the chosen card disappears and shows empty state", () => {
    const { rerender } = render(
      <CollectionScreen
        cards={[...cards]}
        onCardQuantityChange={vi.fn()}
        onRemoveCard={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Inspect Pikachu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(
      <CollectionScreen
        cards={[cards[1]]}
        onCardQuantityChange={vi.fn()}
        onRemoveCard={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <CollectionScreen
        cards={[]}
        onCardQuantityChange={vi.fn()}
        onRemoveCard={vi.fn()}
      />,
    );

    expect(screen.getByText('No cards matched “” .'.replace(" .", "."))).toBeInTheDocument();
  });

  it("supports default name sorting tie-breakers and closes the modal from the backdrop", () => {
    render(
      <CollectionScreen
        cards={[
          {
            id: "card-1",
            name: "Pikachu",
            set: "Base",
            number: "25",
            price: 10,
            image: "/pikachu.png",
            quantity: 1,
          },
          {
            id: "card-2",
            name: "Pikachu",
            set: "Base",
            number: "10",
            price: 5,
            image: "/pikachu-2.png",
            quantity: 1,
          },
        ]}
        onCardQuantityChange={vi.fn()}
        onRemoveCard={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /Inspect Pikachu/i });
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[0]);
    fireEvent.click(screen.getByRole("dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports price and copy sorting branches", () => {
    render(
      <CollectionScreen
        cards={[
          {
            id: "card-1",
            name: "Pikachu",
            set: "Base",
            number: "25",
            price: 10,
            image: "/pikachu.png",
            quantity: 1,
          },
          {
            id: "card-2",
            name: "Bulbasaur",
            set: "Jungle",
            number: "1",
            price: 5,
            image: "/bulbasaur.png",
            quantity: 3,
          },
          {
            id: "card-3",
            name: "Charmander",
            set: "Fossil",
            number: "4",
            price: 20,
            image: "/charmander.png",
            quantity: 2,
          },
          {
            id: "card-4",
            name: "Abra",
            set: "Base",
            number: "2",
            price: 7,
            image: "/abra.png",
            quantity: 1,
          },
          {
            id: "card-5",
            name: "Abra",
            set: "Base",
            number: "1",
            price: 6,
            image: "/abra-2.png",
            quantity: 1,
          },
        ]}
        onCardQuantityChange={vi.fn()}
        onRemoveCard={vi.fn()}
      />,
    );

    const sortSelect = screen.getByRole("combobox");

    fireEvent.change(sortSelect, { target: { value: "price-desc" } });
    expect(screen.getAllByRole("button", { name: /Inspect/i })[0]).toHaveAccessibleName(
      "Inspect Charmander",
    );

    fireEvent.change(sortSelect, { target: { value: "price-asc" } });
    expect(screen.getAllByRole("button", { name: /Inspect/i })[0]).toHaveAccessibleName(
      "Inspect Bulbasaur",
    );

    fireEvent.change(sortSelect, { target: { value: "copies-desc" } });
    expect(screen.getAllByRole("button", { name: /Inspect/i })[0]).toHaveAccessibleName(
      "Inspect Bulbasaur",
    );

    fireEvent.change(sortSelect, { target: { value: "copies-asc" } });
    expect(screen.getAllByRole("button", { name: /Inspect/i })[0]).toHaveAccessibleName(
      "Inspect Pikachu",
    );

    fireEvent.change(sortSelect, { target: { value: "set" } });
    expect(screen.getAllByRole("button", { name: /Inspect/i })[0]).toHaveAccessibleName(
      "Inspect Abra",
    );
  });
});
