import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders allowed nav items and toggles theme", () => {
    const setScreen = vi.fn();
    const setTheme = vi.fn();

    render(
      <Sidebar
        authRole="admin"
        isDark
        screen="admin"
        setScreen={setScreen}
        setTheme={setTheme}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Profile/i }));
    fireEvent.click(screen.getByRole("button", { name: /Light mode/i }));

    expect(screen.getByRole("button", { name: /Admin/i })).toHaveClass("nav-button--active");
    expect(setScreen).toHaveBeenCalledWith("profile");
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("hides protected nav items without auth", () => {
    render(
      <Sidebar
        authRole={null}
        isDark={false}
        screen="signin"
        setScreen={vi.fn()}
        setTheme={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /Admin/i })).not.toBeInTheDocument();
  });
});

describe("MobileNav", () => {
  it("renders visible actions and forwards selection", () => {
    const setScreen = vi.fn();

    render(<MobileNav authRole="collector" screen="collection" setScreen={setScreen} />);

    fireEvent.click(screen.getByRole("button", { name: /Scan/i }));

    expect(setScreen).toHaveBeenCalledWith("appraise");
    expect(screen.getByRole("button", { name: /Collection/i })).toHaveClass(
      "mobile-nav__button--active",
    );
    expect(screen.queryByRole("button", { name: /^Admin$/i })).not.toBeInTheDocument();
  });

  it("hides protected mobile actions without auth", () => {
    render(<MobileNav authRole={null} screen="signin" setScreen={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /^Admin$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Collection/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Profile/i })).toBeInTheDocument();
  });
});

describe("AppShell", () => {
  it("renders chrome around child content", () => {
    render(
      <AppShell
        authRole="admin"
        isDark={false}
        screen="profile"
        setScreen={vi.fn()}
        setTheme={vi.fn()}
      >
        <div>Inner content</div>
      </AppShell>,
    );

    expect(screen.getByText("Inner content")).toBeInTheDocument();
    expect(screen.getByLabelText("Primary")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile primary")).toBeInTheDocument();
  });
});
