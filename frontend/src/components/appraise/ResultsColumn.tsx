import { useState } from "react";
import { getCollectionRepository } from "../../repositories/collectionRepository";
import { ScanResult } from "../../types/app";
import { EmptyReport } from "./EmptyReport";
import { IdentityReport } from "./IdentityReport";

type ResultsColumnProps = {
  authToken: string | null;
  hasBackToSearchPage?: boolean;
  onCollectionAdded?: () => void;
  onBackToSearchPage?: () => void;
  onSearchPageClick?: () => void;
  reportPreviewUrl: string | null;
  result: ScanResult | null;
};

const collectionRepository = getCollectionRepository();

export function ResultsColumn({
  authToken,
  hasBackToSearchPage,
  onBackToSearchPage,
  onCollectionAdded,
  onSearchPageClick,
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
      });

      setCollectionStatus("success");
      onCollectionAdded?.();
    } catch (caughtError) {
      console.error(caughtError);
      setCollectionStatus("error");
    }
  }

  return (
    <section className="results-column">
      {result ? (
        <>
          <IdentityReport result={result} />
          <div className="report-actions">
            <button
              className="primary-button"
              disabled={collectionStatus === "loading" || !authToken}
              onClick={handleAddToCollection}
              type="button"
            >
              {collectionStatus === "loading"
                ? "Adding..."
                : "Add to collection"}
            </button>
            {hasBackToSearchPage ? (
              <button
                className="secondary-button"
                onClick={onBackToSearchPage}
                type="button"
              >
                Back
              </button>
            ) : null}
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
        </>
      ) : (
        <EmptyReport />
      )}
    </section>
  );
}
