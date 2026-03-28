import { ResultsColumn } from "../components/appraise/ResultsColumn";
import { UploadPanel } from "../components/appraise/UploadPanel";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { useAppraisal } from "../hooks/useAppraisal";

export function AppraiseScreen() {
  const {
    error,
    handleFileChange,
    handleSubmit,
    loading,
    previewUrl,
    resetAppraisal,
    result,
  } = useAppraisal();

  return (
    <section className="screen screen--appraise">
      <ScreenHeader
        aside={
          <div className="status-chip">
            <span className="status-chip__dot" />
            <span>{loading ? "Analyzing" : "Ready"}</span>
          </div>
        }
        description="The Figma mockup is now wired into the live frontend. This screen keeps the real scan endpoint and wraps it in the mockup's mobile-first shell and report styling."
        eyebrow="Card appraisal"
        title="Upload a card image and generate an Oak Report."
      />

      <div className="appraise-layout">
        <UploadPanel
          error={error}
          loading={loading}
          onFileChange={handleFileChange}
          onReset={resetAppraisal}
          onSubmit={handleSubmit}
          previewUrl={previewUrl}
        />
        <ResultsColumn previewUrl={previewUrl} result={result} />
      </div>
    </section>
  );
}
