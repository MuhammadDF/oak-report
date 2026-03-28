import { MouseEvent, useEffect, useState } from "react";
import { ResultsColumn } from "../components/appraise/ResultsColumn";
import { UploadPanel } from "../components/appraise/UploadPanel";
import { CollectionSelectionPanel } from "../components/appraise/CollectionSelectionPanel";
import { useAppraisal } from "../hooks/useAppraisal";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { CollectionCard } from "../types/app";

type AppraiseScreenProps = {
  selectedCollectionCard: CollectionCard | null;
  onClearCollectionSelection: () => void;
  onRemoveCollectionCard: (cardId: string) => void;
};

export function AppraiseScreen({
  onClearCollectionSelection,
  onRemoveCollectionCard,
  selectedCollectionCard,
}: AppraiseScreenProps) {
  const {
    error,
    handleFileChange,
    loading,
    previewUrl,
    reportPreviewUrl,
    resetAppraisal,
    result,
  } = useAppraisal();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (result) {
      setIsReportOpen(true);
    }
  }, [result]);

  useEffect(() => {
    if (selectedCollectionCard) {
      setIsReportOpen(true);
    }
  }, [selectedCollectionCard]);

  function handleReportClose() {
    setIsReportOpen(false);
    resetAppraisal();
    onClearCollectionSelection();
  }

  function handleModalBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleReportClose();
    }
  }

  function handleRemoveFromCollection(cardId: string) {
    onRemoveCollectionCard(cardId);
    resetAppraisal();
    setIsReportOpen(false);
    onClearCollectionSelection();
  }

  return (
    <section className="screen screen--appraise">
      <div className="appraise-layout">
        <UploadPanel
          error={error}
          isMobile={isMobile}
          loading={loading}
          onFileChange={handleFileChange}
          previewUrl={previewUrl}
        />
      </div>

      {isReportOpen && (result || selectedCollectionCard) ? (
        <div
          aria-modal="true"
          className="report-modal"
          onClick={handleModalBackdropClick}
          role="dialog"
        >
          <div
            className="report-modal__panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="report-modal__header">
              <p className="panel__eyebrow">Card overview</p>
              <button
                className="report-modal__close"
                onClick={handleReportClose}
                type="button"
              >
                Close
              </button>
            </div>
            {result ? (
              <ResultsColumn
                collectionCardId={selectedCollectionCard?.id ?? null}
                onRemoveFromCollection={
                  selectedCollectionCard
                    ? () => handleRemoveFromCollection(selectedCollectionCard.id)
                    : undefined
                }
                reportPreviewUrl={reportPreviewUrl}
                result={result}
              />
            ) : selectedCollectionCard ? (
              <CollectionSelectionPanel
                card={selectedCollectionCard}
                onRemove={() => handleRemoveFromCollection(selectedCollectionCard.id)}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
