import { useState } from "react";
import { getCollectionRepository } from "../../repositories/collectionRepository";
import { ScanResult } from "../../types/app";
import { formatCurrency } from "../../utils/format";
import { EmptyReport } from "./EmptyReport";

type ResultsColumnProps = {
  authToken: string | null;
  hasBackToSearchPage?: boolean;
  onCollectionAdded?: () => void;
  onBackToSearchPage?: () => void;
  onSearchPageClick?: () => void;
  onClose?: () => void;
  reportPreviewUrl: string | null;
  result: ScanResult | null;
};

const collectionRepository = getCollectionRepository();

export function ResultsColumn({
  authToken,
  hasBackToSearchPage,
  onBackToSearchPage,
  onCollectionAdded,
  onClose,
  reportPreviewUrl,
  result,
}: ResultsColumnProps) {
  const [collectionStatus, setCollectionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleAddToCollection() {
    setCollectionStatus("loading");

    try {
      await collectionRepository.addScanToCollection(authToken!, {
        name: result!.card.name,
        set: result!.set_name ?? "Unknown Set",
        number: result!.card.card_number ?? "--",
        price: result!.pricing,
        image: result!.image_url ?? reportPreviewUrl,
        language: result!.card.language,
        pricing_catalog_id: result!.pricing_catalog_id,
      });

      setCollectionStatus("success");
      onCollectionAdded?.();
    } catch (caughtError) {
      console.error(caughtError);
      setCollectionStatus("error");
    }
  }

  const artSrc = result?.image_url ?? reportPreviewUrl;

  return (
    <article className="panel report-modal__panel results-column">
      {result ? (
        <>
          <div className="appraisal-header">
            {onClose ? (
              <button className="report-modal__close" onClick={onClose} type="button">
                Close
              </button>
            ) : null}
          </div>
          <div className="appraisal-art">
            {artSrc ? (
              <img alt={result.card.name} src={artSrc} />
            ) : (
              <div className="appraisal-art__placeholder">Card Art</div>
            )}
          </div>
          <div className="appraisal-details">
            <h2 className="appraisal-name">{result.card.name}</h2>
            <div className="appraisal-separator" />
            <dl className="appraisal-meta">
              <div className="appraisal-meta__row">
                <dt>Set</dt>
                <dd>{result.set_name ?? "Pending"}</dd>
              </div>
              <div className="appraisal-meta__row">
                <dt>Number</dt>
                <dd>{result.card.card_number ?? "Pending"}</dd>
              </div>
              <div className="appraisal-meta__row">
                <dt>Language</dt>
                <dd>{result.card.language ?? "Pending"}</dd>
              </div>
            </dl>
            <div className="appraisal-price">
              <span className="appraisal-price__label">Price</span>
              <strong className="appraisal-price__value">{formatCurrency("USD", result.pricing)}</strong>
            </div>
            <div className="appraisal-actions">
              <div className="appraisal-actions__buttons">
                {hasBackToSearchPage ? (
                  <button className="secondary-button appraisal-cta" onClick={onBackToSearchPage} type="button">
                    Back
                  </button>
                ) : null}
                <button
                  className="primary-button appraisal-cta"
                  disabled={collectionStatus === "loading" || !authToken}
                  onClick={handleAddToCollection}
                  type="button"
                >
                  {collectionStatus === "loading" ? "Adding..." : "Add to collection"}
                </button>
              </div>
              {collectionStatus === "success" ? (
                <span className="report-actions__status report-actions__status--success">
                  Saved to collection.
                </span>
              ) : null}
              {collectionStatus === "error" ? (
                <span className="report-actions__status report-actions__status--error">
                  Could not save to collection.
                </span>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <EmptyReport />
      )}
    </article>
  );
}
