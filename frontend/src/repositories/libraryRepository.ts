import { API_BASE_URL } from "../constants/api";
import { LibraryCard } from "../types/app";

export type LibraryRepository = {
  listCards: () => Promise<LibraryCard[]>;
};

const apiLibraryRepository: LibraryRepository = {
  async listCards() {
    const response = await fetch(`${API_BASE_URL}/api/library/cards`);
    if (!response.ok) {
      throw new Error("Failed to load library cards.");
    }

    return (await response.json()) as LibraryCard[];
  },
};

export function getLibraryRepository(): LibraryRepository {
  return apiLibraryRepository;
}
