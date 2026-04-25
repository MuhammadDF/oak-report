import { API_BASE_URL } from "../constants/api";
import { LibraryCard } from "../types/app";

export type LibraryRepository = {
  listCards: (authToken: string | null) => Promise<LibraryCard[]>;
};

const apiLibraryRepository: LibraryRepository = {
  async listCards(authToken) {
    if (!authToken) {
      throw new Error("Authentication required.");
    }

    const response = await fetch(`${API_BASE_URL}/api/library/cards`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to load library cards.");
    }

    return (await response.json()) as LibraryCard[];
  },
};

export function getLibraryRepository(): LibraryRepository {
  return apiLibraryRepository;
}
