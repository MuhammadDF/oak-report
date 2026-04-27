import { describe, expect, it, vi } from "vitest";
import { getLibraryRepository } from "./libraryRepository";
import { mockFetchResponse } from "../test/testUtils";

describe("libraryRepository", () => {
  const repository = getLibraryRepository();

  it("requires auth", async () => {
    await expect(repository.listCards(null)).rejects.toThrow("Authentication required.");
  });

  it("returns parsed cards on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: [{ id: "card-1", name: "Blastoise", set: "Base", number: "2", rarity: "Rare", type: "Water", price: 80 }],
      }) as never,
    );

    await expect(repository.listCards("token-123")).resolves.toEqual([
      { id: "card-1", name: "Blastoise", set: "Base", number: "2", rarity: "Rare", type: "Water", price: 80 },
    ]);

    expect(fetch).toHaveBeenCalledWith("/api/library/cards", {
      headers: {
        Authorization: "Bearer token-123",
      },
    });
  });

  it("throws on non-ok responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 500, json: {} }) as never,
    );

    await expect(repository.listCards("token-123")).rejects.toThrow(
      "Failed to load library cards.",
    );
  });
});
