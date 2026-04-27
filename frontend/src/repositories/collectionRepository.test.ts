import { describe, expect, it, vi } from "vitest";
import { getCollectionRepository } from "./collectionRepository";
import { mockFetchResponse } from "../test/testUtils";

describe("collectionRepository", () => {
  const repository = getCollectionRepository();

  it("returns an empty collection without auth", async () => {
    const result = await repository.getCollection(null);

    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("loads the collection with auth", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          owner_id: "user-1",
          items: [{ id: "card-1", name: "Pikachu", set: "Base", number: "25", price: 12.5, image: "/img.png", quantity: 2 }],
        },
      }) as never,
    );

    const result = await repository.getCollection("token-123");

    expect(fetch).toHaveBeenCalledWith("/api/collection/", {
      headers: {
        Authorization: "Bearer token-123",
      },
    });
    expect(result).toEqual([
      { id: "card-1", name: "Pikachu", set: "Base", number: "25", price: 12.5, image: "/img.png", quantity: 2 },
    ]);
  });

  it("throws when collection loading fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 503, json: {} }) as never,
    );

    await expect(repository.getCollection("token-123")).rejects.toThrow(
      "Failed to load collection from API.",
    );
  });

  it("requires auth to add a scan", async () => {
    await expect(
      repository.addScanToCollection(null, {
        name: "Charizard",
        set: "Base",
        number: "4",
        price: 100,
      }),
    ).rejects.toThrow("Authentication required.");
  });

  it("posts scan additions with auth and payload", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ json: {} }) as never,
    );

    await repository.addScanToCollection("token-123", {
      name: "Charizard",
      set: "Base",
      number: "4",
      price: 100,
      language: "English",
    });

    expect(fetch).toHaveBeenCalledWith("/api/collection/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify({
        name: "Charizard",
        set: "Base",
        number: "4",
        price: 100,
        language: "English",
      }),
    });
  });

  it("throws when scan addition fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 500, json: {} }) as never,
    );

    await expect(
      repository.addScanToCollection("token-123", {
        name: "Charizard",
        set: "Base",
        number: "4",
        price: 100,
      }),
    ).rejects.toThrow("Failed to add scan to collection.");
  });

  it("requires auth to update quantity", async () => {
    await expect(
      repository.updateCollectionQuantity(null, "card-1", 2),
    ).rejects.toThrow("Authentication required.");
  });

  it("clamps quantity and sends patch request", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ json: {} }) as never,
    );

    await repository.updateCollectionQuantity("token-123", "card-1", -4);

    expect(fetch).toHaveBeenCalledWith("/api/collection/card-1/quantity", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify({ quantity: 0 }),
    });
  });

  it("throws when quantity update fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 409, json: {} }) as never,
    );

    await expect(
      repository.updateCollectionQuantity("token-123", "card-1", 3),
    ).rejects.toThrow("Failed to update collection quantity.");
  });

  it("requires auth to remove a card", async () => {
    await expect(repository.removeCollectionCard(null, "card-1")).rejects.toThrow(
      "Authentication required.",
    );
  });

  it("sends delete requests for card removal", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ json: {} }) as never,
    );

    await repository.removeCollectionCard("token-123", "card-1");

    expect(fetch).toHaveBeenCalledWith("/api/collection/card-1", {
      method: "DELETE",
      headers: {
        Authorization: "Bearer token-123",
      },
    });
  });

  it("throws when card removal fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 500, json: {} }) as never,
    );

    await expect(repository.removeCollectionCard("token-123", "card-1")).rejects.toThrow(
      "Failed to remove collection card.",
    );
  });
});
