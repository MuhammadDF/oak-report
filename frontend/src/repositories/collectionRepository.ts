import { API_BASE_URL } from "../constants/api";
import { CollectionCard } from "../types/app";

export type AddCollectionInput = {
  scan_id: string;
  name: string;
  set: string;
  number: string;
  price: number;
  image?: string | null;
  grade?: string | null;
};

export type CollectionRepository = {
  getCollection: (authToken: string | null) => Promise<CollectionCard[]>;
  addScanToCollection: (
    authToken: string | null,
    payload: AddCollectionInput,
  ) => Promise<void>;
  updateCollectionQuantity: (
    authToken: string | null,
    cardId: string,
    quantity: number,
  ) => Promise<void>;
  removeCollectionCard: (authToken: string | null, cardId: string) => Promise<void>;
};

const apiCollectionRepository: CollectionRepository = {
  async getCollection(authToken) {
    if (!authToken) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/api/collection/`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load collection from API.");
    }

    const payload = (await response.json()) as {
      owner_id: string;
      items: CollectionCard[];
    };
    return payload.items;
  },
  async addScanToCollection(authToken, payload) {
    if (!authToken) {
      throw new Error("Authentication required.");
    }

    const response = await fetch(`${API_BASE_URL}/api/collection/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to add scan to collection.");
    }
  },
  async updateCollectionQuantity(authToken, cardId, quantity) {
    if (!authToken) {
      throw new Error("Authentication required.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/collection/${encodeURIComponent(cardId)}/quantity`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ quantity: Math.max(0, quantity) }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update collection quantity.");
    }
  },
  async removeCollectionCard(authToken, cardId) {
    if (!authToken) {
      throw new Error("Authentication required.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/collection/${encodeURIComponent(cardId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to remove collection card.");
    }
  },
};

export function getCollectionRepository(): CollectionRepository {
  return apiCollectionRepository;
}
