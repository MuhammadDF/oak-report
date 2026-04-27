import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScreenHeader } from "./ScreenHeader";

describe("ScreenHeader", () => {
  it("renders all header content", () => {
    render(
      <ScreenHeader
        aside={<button type="button">Action</button>}
        eyebrow="Library"
        title="Browse cards"
        description="Find something useful."
      />,
    );

    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Browse cards" })).toBeInTheDocument();
    expect(screen.getByText("Find something useful.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("omits optional content when not provided", () => {
    render(<ScreenHeader title="Only title" />);

    expect(screen.getByRole("heading", { name: "Only title" })).toBeInTheDocument();
    expect(screen.queryByText("Action")).not.toBeInTheDocument();
  });
});
