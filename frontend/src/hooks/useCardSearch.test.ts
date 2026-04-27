import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCardSearch } from "./useCardSearch";
import { mockFetchResponse } from "../test/testUtils";

function createSubmitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useCardSearch", () => {
  it("ignores blank submissions", async () => {
    const onSearchResults = vi.fn();
    const { result } = renderHook(() => useCardSearch("token-123", onSearchResults));

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(onSearchResults).not.toHaveBeenCalled();
  });

  it("requires auth", async () => {
    const onSearchResults = vi.fn();
    const { result } = renderHook(() => useCardSearch(null, onSearchResults));

    act(() => {
      result.current.setQuery("pikachu");
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(result.current.error).toBe("Authentication required for search.");
    expect(result.current.loading).toBe(false);
  });

  it("loads results and stores the last search term", async () => {
    const onSearchResults = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          results: [
            {
              id: "match-1",
              console_name: "Pokemon",
              product_name: "Pikachu 25/102",
              loose_price: 14.99,
              image_url: "/pikachu.png",
              refreshed_at: "2026-04-26T00:00:00Z",
            },
          ],
        },
      }) as never,
    );

    const { result } = renderHook(() => useCardSearch("token-123", onSearchResults));

    act(() => {
      result.current.setQuery("  pikachu  ");
    });

    const submitEvent = createSubmitEvent();
    await act(async () => {
      await result.current.handleSubmit(submitEvent);
    });

    await waitFor(() => {
      expect(onSearchResults).toHaveBeenCalledWith("pikachu", [
        {
          id: "match-1",
          console_name: "Pokemon",
          product_name: "Pikachu 25/102",
          loose_price: 14.99,
          image_url: "/pikachu.png",
          refreshed_at: "2026-04-26T00:00:00Z",
        },
      ]);
    });

    expect(submitEvent.preventDefault).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith("/api/search/cards?query=pikachu", {
      headers: {
        Authorization: "Bearer token-123",
      },
    });
    expect(result.current.lastSearchTerm).toBe("pikachu");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("surfaces request failures", async () => {
    const onSearchResults = vi.fn();
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 500, json: {} }) as never,
    );

    const { result } = renderHook(() => useCardSearch("token-123", onSearchResults));

    act(() => {
      result.current.setQuery("charizard");
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(result.current.error).toBe("Search request failed.");
    expect(onSearchResults).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("surfaces generic non-error failures", async () => {
    const onSearchResults = vi.fn();
    vi.mocked(fetch).mockRejectedValueOnce("boom" as never);

    const { result } = renderHook(() => useCardSearch("token-123", onSearchResults));

    act(() => {
      result.current.setQuery("charizard");
    });

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(result.current.error).toBe("Search could not complete.");
    expect(onSearchResults).not.toHaveBeenCalled();
  });
});
