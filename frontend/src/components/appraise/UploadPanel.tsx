import {
  ChangeEventHandler,
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { CameraCard } from "./CameraCard";
import { API_BASE_URL } from "../../constants/api";
import { CardSearchResult } from "../../types/app";

type UploadPanelProps = {
  error: string | null;
  isMobile: boolean;
  loading: boolean;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  onSearchResults: (query: string, results: CardSearchResult[]) => void;
  previewUrl: string | null;
};

export function UploadPanel({
  error,
  isMobile,
  loading,
  onFileChange,
  onSearchResults,
  previewUrl,
}: UploadPanelProps) {
  const uploadInputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const acceptTypes = isMobile
    ? "image/*"
    : "image/png,image/jpeg,image/webp,image/heic";
  const panelClass = `panel upload-panel ${isMobile ? "upload-panel--mobile" : "upload-panel--desktop"}`;

  useEffect(() => {
    if (!loading && !previewUrl && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [loading, previewUrl]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery || searchLoading) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search/cards?query=${encodeURIComponent(trimmedQuery)}`,
      );

      if (!response.ok) {
        throw new Error("Search request failed.");
      }

      const payload = (await response.json()) as {
        query: string;
        results: CardSearchResult[];
      };

      onSearchResults(trimmedQuery, payload.results);
      setLastSearchTerm(trimmedQuery);
    } catch (caughtError) {
      setSearchError(
        caughtError instanceof Error ? caughtError.message : "Search could not complete.",
      );
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <section className={panelClass}>
      <input
        accept={acceptTypes}
        capture={isMobile ? "environment" : undefined}
        className="sr-only"
        id={uploadInputId}
        ref={inputRef}
        onChange={onFileChange}
        type="file"
      />

      {isMobile ? (
        <div className="mobile-capture">
          <CameraCard loading={loading} />
          <label
            aria-disabled={loading}
            className={`primary-button camera-button ${loading ? "camera-button--disabled" : ""}`}
            htmlFor={uploadInputId}
          >
            {loading ? "Capturing..." : "Use camera"}
          </label>
        </div>
      ) : (
        <DesktopDropzone inputId={uploadInputId} loading={loading} />
      )}

      <CardSearchBar
        error={searchError}
        lastSearchTerm={lastSearchTerm}
        loading={searchLoading}
        onQueryChange={setSearchQuery}
        onSubmit={handleSearchSubmit}
        query={searchQuery}
      />

      {loading ? (
        <p className="upload-status">Analyzing upload... building report.</p>
      ) : null}

      {previewUrl ? (
        <div className="preview-card">
          <img alt="Selected card preview" src={previewUrl} />
        </div>
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
    </section>
  );
}

type DesktopDropzoneProps = {
  inputId: string;
  loading: boolean;
};

function DesktopDropzone({ inputId, loading }: DesktopDropzoneProps) {
  return (
    <div className={`desktop-dropzone ${loading ? "desktop-dropzone--loading" : ""}`}>
      <h2>Card Appraisal</h2>
      <p className="desktop-dropzone__copy">
        Upload or drag a card image to authenticate and value.
      </p>
      <label className="desktop-dropzone__field" htmlFor={inputId}>
        {loading ? (
          <>
            <div className="desktop-dropzone__spinner" aria-hidden="true" />
            <p>Uploading card image...</p>
            <span>We'll open the report as soon as it's ready.</span>
          </>
        ) : (
          <>
            <div className="desktop-dropzone__icon" aria-hidden="true">
              ↥
            </div>
            <p>Drag & drop your card image here</p>
            <span>PNG, JPG up to 10MB</span>
            <span className="desktop-dropzone__button">Select File</span>
          </>
        )}
      </label>
    </div>
  );
}

type CardSearchBarProps = {
  error: string | null;
  lastSearchTerm: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  query: string;
};

function CardSearchBar({
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
          Looking for "{query.trim() || lastSearchTerm || "your card"}"...
        </p>
      ) : lastSearchTerm && !error ? (
        <p className="card-search__status card-search__status--success">
          Appraisal window refreshed with matches for "{lastSearchTerm}".
        </p>
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
    </div>
  );
}
