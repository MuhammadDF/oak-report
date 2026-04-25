import { FormEvent } from "react";

// Shared search bar used by both UploadPanel and LiveCameraPanel.
// Handles its own display state (status messages, errors) but delegates
// the actual fetch logic to the parent via onSubmit / onQueryChange.

type CardSearchBarProps = {
  error: string | null;
  lastSearchTerm: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  query: string;
}; 

export function CardSearchBar({
  error,
  lastSearchTerm,
  loading,
  onQueryChange,
  onSubmit,
  query,
}: CardSearchBarProps) {
  return (
    <div className="card-search">
      <form className="search-field" onSubmit={onSubmit}>
        <div className="search-field__control">
          <input
            aria-label="Search reference cards"
            disabled={loading}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search a card or set"
            type="search"
            value={query}
          />
          <button
            className="search-field__action"
            disabled={loading || !query.trim()}
            type="submit"
          >
            {loading ? "Searching" : "Search"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="card-search__status">
          <strong>Looking for "{query.trim() || lastSearchTerm || "your card"}"...</strong>
          <span>
            Broad searches like "Charizard" or "Pikachu" can take longer. Add a card number
            to narrow it down.
          </span>
        </p>
      ) : lastSearchTerm && !error ? (
        <p className="card-search__status card-search__status--success">
          Search page refreshed with matches for "{lastSearchTerm}".
        </p>
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
    </div>
  );
}
