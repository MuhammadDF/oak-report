import { ScanResult } from "../../types/app";
import { AuthenticityReport } from "./AuthenticityReport";
import { EmptyReport } from "./EmptyReport";
import { IdentityReport } from "./IdentityReport";
import { PricingReport } from "./PricingReport";

type ResultsColumnProps = {
  previewUrl: string | null;
  result: ScanResult | null;
};

export function ResultsColumn({
  previewUrl,
  result,
}: ResultsColumnProps) {
  return (
    <section className="results-column">
      {result ? (
        <>
          <IdentityReport previewUrl={previewUrl} result={result} />
          <AuthenticityReport result={result} />
          <PricingReport result={result} />
        </>
      ) : (
        <EmptyReport />
      )}
    </section>
  );
}
