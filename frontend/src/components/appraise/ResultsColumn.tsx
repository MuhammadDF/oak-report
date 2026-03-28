import { useState } from "react";
import { API_BASE_URL } from "../../constants/api";
import { ScanResult } from "../../types/app";
import { EmptyReport } from "./EmptyReport";
import { IdentityReport } from "./IdentityReport";
import { PricingReport } from "./PricingReport";

type ResultsColumnProps = {
  reportPreviewUrl: string | null;
  result: ScanResult | null;
  collectionCardId?: string | null;
  onRemoveFromCollection?: (cardId: string) => void;
};

export function ResultsColumn({
  collectionCardId,
  onRemoveFromCollection,
  reportPreviewUrl,
  result,
}: ResultsColumnProps) {
  const [collectionStatus, setCollectionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleAddToCollection() {
    if (!result || collectionStatus === "loading") {
      return;
    }

    setCollectionStatus("loading");

    try {
      const response = await fetch(`${API_BASE_URL}/api/collection/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scan_id: result.scan_id }),
      });

      if (!response.ok) {
        throw new Error("Failed to add card");
      }

      setCollectionStatus("success");
    } catch (caughtError) {
      console.error(caughtError);
      setCollectionStatus("error");
    }
  }

  return (
    <section className="results-column">
      {result ? (
        <>
          <IdentityReport previewUrl={reportPreviewUrl} result={result} />
          <PricingReport result={result} />
          <div className="report-actions">
            <button
              className="primary-button"
              disabled={collectionStatus === "loading"}
              onClick={handleAddToCollection}
              type="button"
            >
              {collectionStatus === "loading"
                ? "Adding..."
                : "Add to collection"}
            </button>
            {collectionCardId && onRemoveFromCollection ? (
              <button
                className="secondary-button danger-button"
                onClick={() => onRemoveFromCollection(collectionCardId)}
                type="button"
              >
                Remove from collection
              </button>
            ) : null}
            {collectionStatus === "success" ? (
              <span className="report-actions__status report-actions__status--success">
                Saved to collection placeholder.
              </span>
            ) : null}
            {collectionStatus === "error" ? (
              <span className="report-actions__status report-actions__status--error">
                Could not reach the collection API.
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
