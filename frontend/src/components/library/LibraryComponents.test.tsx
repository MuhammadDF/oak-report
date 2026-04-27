import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LibrarySearch } from "./LibrarySearch";
import { LibraryTable } from "./LibraryTable";

describe("LibrarySearch", () => {
  it("forwards search input changes", () => {
    const onChange = vi.fn();
    render(<LibrarySearch onChange={onChange} value="" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pikachu" } });

    expect(onChange).toHaveBeenCalledWith("pikachu");
  });
});

describe("LibraryTable", () => {
  it("renders library rows", () => {
    render(
      <LibraryTable
        cards={[
          {
            id: "card-1",
            name: "Pikachu",
            set: "Base",
            number: "25",
            rarity: "Common",
            type: "Electric",
            price: 12.5,
          },
        ]}
      />,
    );

    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText("Base · 25")).toBeInTheDocument();
    expect(screen.getByText("$12.50")).toBeInTheDocument();
  });
});
