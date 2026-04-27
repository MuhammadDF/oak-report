import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

describe("useMediaQuery", () => {
  it("reads the current match state and reacts to change events", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQuery = {
      matches: true,
      media: "(pointer: coarse)",
      onchange: null,
      addEventListener: vi.fn((_event, listener) => listeners.add(listener)),
      removeEventListener: vi.fn((_event, listener) => listeners.delete(listener)),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const matchMedia = vi.fn(() => mediaQuery);
    window.matchMedia = matchMedia as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery("(pointer: coarse)"));

    expect(result.current).toBe(true);

    act(() => {
      mediaQuery.matches = false;
      listeners.forEach((listener) =>
        listener({ matches: false } as MediaQueryListEvent),
      );
    });

    expect(result.current).toBe(false);
  });

  it("uses legacy addListener/removeListener when needed", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      media: "(max-width: 640px)",
      onchange: null,
      addListener,
      removeListener,
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    const { unmount } = renderHook(() => useMediaQuery("(max-width: 640px)"));

    expect(addListener).toHaveBeenCalled();

    unmount();

    expect(removeListener).toHaveBeenCalled();
  });

  it("returns false when matchMedia is unavailable", () => {
    // @ts-expect-error intentional test override
    delete window.matchMedia;

    const { result } = renderHook(() => useMediaQuery("(pointer: coarse)"));

    expect(result.current).toBe(false);
  });
});
