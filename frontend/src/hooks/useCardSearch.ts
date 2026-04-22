import { FormEvent, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import { CardSearchResult } from "../types/app";

/**
 * Encapsulates card search state and the fetch handler.
 * Used by both UploadPanel and LiveCameraPanel to avoid duplicating
 * the same search logic in each component.
 */
export function useCardSearch(
  authToken: string | null,
  onSearchResults: (query: string, results: CardSearchResult[]) => void,
) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchTerm, setLastSearchTerm] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      if (!authToken) {
        throw new Error("Authentication required for search.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/search/cards?query=${encodeURIComponent(trimmed)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Search request failed.");
      }

      const payload = (await response.json()) as {
        query: string;
        results: CardSearchResult[];
      };

      onSearchResults(trimmed, payload.results);
      setLastSearchTerm(trimmed);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Search could not complete.",
      );
    } finally {
      setLoading(false);
    }
  }

  return { query, setQuery, loading, error, lastSearchTerm, handleSubmit };
}
