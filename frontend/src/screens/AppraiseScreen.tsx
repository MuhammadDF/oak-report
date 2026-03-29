import { MouseEvent, useEffect, useState } from "react";
import { ResultsColumn } from "../components/appraise/ResultsColumn";
import { UploadPanel } from "../components/appraise/UploadPanel";
import { SearchResultsPanel } from "../components/appraise/SearchResultsPanel";
import { useAppraisal } from "../hooks/useAppraisal";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { CardSearchResult } from "../types/app";

export function AppraiseScreen() {
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
	const [searchSummary, setSearchSummary] = useState<{
		query: string;
		results: CardSearchResult[];
	} | null>(null);
	const isMobile = useMediaQuery("(max-width: 768px)");

	useEffect(() => {
		if (result) {
			setIsReportOpen(true);
			setSearchSummary(null);
		}
	}, [result]);

	function handleReportClose() {
		setIsReportOpen(false);
		resetAppraisal();
		setSearchSummary(null);
	}

	function handleModalBackdropClick(event: MouseEvent<HTMLDivElement>) {
		if (event.target === event.currentTarget) {
			handleReportClose();
		}
	}

	function handleSearchResults(query: string, results: CardSearchResult[]) {
		resetAppraisal();
		setSearchSummary({ query, results });
		setIsReportOpen(true);
	}

	return (
		<section className="screen screen--appraise">
			<div className="appraise-layout">
				<UploadPanel
					error={error}
					isMobile={isMobile}
					loading={loading}
					onFileChange={handleFileChange}
					onSearchResults={handleSearchResults}
					previewUrl={previewUrl}
				/>
			</div>

			{isReportOpen && (result || searchSummary) ? (
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
								reportPreviewUrl={reportPreviewUrl}
								result={result}
							/>
						) : searchSummary ? (
							<SearchResultsPanel
								query={searchSummary.query}
								results={searchSummary.results}
							/>
						) : null}
					</div>
				</div>
			) : null}
		</section>
	);
}
