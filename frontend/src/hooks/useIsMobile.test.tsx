import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./useIsMobile";

vi.mock("./useMediaQuery", () => ({
  useMediaQuery: vi.fn(),
}));

describe("useIsMobile", () => {
  it("returns true when coarse pointer and touch support are both present", async () => {
    const { useMediaQuery } = await import("./useMediaQuery");
    vi.mocked(useMediaQuery).mockReturnValue(true);
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns false when touch support is missing", async () => {
    const { useMediaQuery } = await import("./useMediaQuery");
    vi.mocked(useMediaQuery).mockReturnValue(true);
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});
