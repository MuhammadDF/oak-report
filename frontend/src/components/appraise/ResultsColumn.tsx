import { useState } from "react";
import { getCollectionRepository } from "../../repositories/collectionRepository";
import { ScanResult } from "../../types/app";
import { EmptyReport } from "./EmptyReport";
import { IdentityReport } from "./IdentityReport";
import { PricingReport } from "./PricingReport";

type ResultsColumnProps = {
  authToken: string | null;
  onCollectionAdded?: () => void;
  reportPreviewUrl: string | null;
  result: ScanResult | null;
};

const collectionRepository = getCollectionRepository();

export function ResultsColumn({
  authToken,
  onCollectionAdded,
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
      await collectionRepository.addScanToCollection(authToken, {
        scan_id: result.scan_id,
        name: result.card.name,
        set: result.card.set_name ?? "Unknown Set",
        number: result.card.card_number ?? "--",
        price: result.pricing.estimated_market_value,
        image: result.card.image_url ?? reportPreviewUrl,
        grade: result.condition.condition_label,
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
