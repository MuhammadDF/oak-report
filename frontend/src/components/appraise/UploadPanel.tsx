import { ChangeEventHandler, useEffect, useId, useRef } from "react";
import { CameraCard } from "./CameraCard";
import { CardSearchBar } from "./CardSearchBar";
import { useCardSearch } from "../../hooks/useCardSearch";
import { CardPricingMatch } from "../../types/app";

type UploadPanelProps = {
  authToken: string | null;
  error: string | null;
  isMobile: boolean;
  loading: boolean;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  onSearchResults: (query: string, results: CardPricingMatch[]) => void;
  previewUrl: string | null;
};

export function UploadPanel({
  authToken,
  error,
  isMobile,
  loading,
  onFileChange,
  onSearchResults,
  previewUrl,
}: UploadPanelProps) {
  const uploadInputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const search = useCardSearch(authToken, onSearchResults);
  const acceptTypes = isMobile
    ? "image/*"
    : "image/png,image/jpeg,image/webp,image/heic";
  const panelClass = `panel upload-panel ${isMobile ? "upload-panel--mobile" : "upload-panel--desktop"}`;

  useEffect(() => {
    if (!loading && !previewUrl && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [loading, previewUrl]);

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
        error={search.error}
        lastSearchTerm={search.lastSearchTerm}
        loading={search.loading}
        onQueryChange={search.setQuery}
        onSubmit={search.handleSubmit}
        query={search.query}
      />

      {loading ? (
        <p className="upload-status">Analyzing upload... building report.</p>
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
        Upload or drag a card image to identify and value.
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

