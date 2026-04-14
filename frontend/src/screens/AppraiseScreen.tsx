import { MouseEvent, useEffect, useState } from "react";
import { ResultsColumn } from "../components/appraise/ResultsColumn";
import { UploadPanel } from "../components/appraise/UploadPanel";
import { LiveCameraPanel } from "../components/appraise/LiveCameraPanel";
import { SearchResultsPanel } from "../components/appraise/SearchResultsPanel";
import { useAppraisal } from "../hooks/useAppraisal";
import { useIsMobile } from "../hooks/useIsMobile";
import { CardSearchResult, ScanResult } from "../types/app";

type AppraiseScreenProps = {
	authToken: string | null;
	onCollectionChanged?: () => void;
};

export function AppraiseScreen({
	authToken,
	onCollectionChanged,
}: AppraiseScreenProps) {
	const {
		error,
		handleFileChange,
		handleFileDirect,
		loading,
		previewUrl,
		reportPreviewUrl,
		resetAppraisal,
		result,
	} = useAppraisal();

	const isMobile = useIsMobile();

	// Whether the result modal is visible. Opened automatically on a successful
	// scan or when the user searches by text.
	const [isReportOpen, setIsReportOpen] = useState(false);

	// Set when the user submits a text search. Holds the query string and the
	// list of matched cards so SearchResultsPanel can render them.
	const [searchSummary, setSearchSummary] = useState<{
		query: string;
		results: CardSearchResult[];
	} | null>(null);

	// A synthetic ScanResult built from a selected search result so it can be
	// displayed in ResultsColumn without a real image scan.
	const [searchAppraisal, setSearchAppraisal] = useState<ScanResult | null>(null);

	// Tracks which card row in SearchResultsPanel is currently highlighted.
	const [activeSearchResultId, setActiveSearchResultId] = useState<string | null>(null);

	// Auto-open the result modal whenever a real scan completes.
	// Also clears any leftover search state so the modal shows only the scan.
	useEffect(() => {
		if (result) {
			setIsReportOpen(true);
			setSearchSummary(null);
			setSearchAppraisal(null);
			setActiveSearchResultId(null);
		}
	}, [result]);

	// Closes the modal and resets all scan + search state back to idle.
	function handleReportClose() {
		setIsReportOpen(false);
		resetAppraisal();
		setSearchSummary(null);
		setSearchAppraisal(null);
		setActiveSearchResultId(null);
	}

	// Closes the modal when the user clicks the semi-transparent backdrop
	// (i.e. outside the panel). Clicks inside the panel are stopped from
	// bubbling up so they don't trigger this.
	function handleModalBackdropClick(event: MouseEvent<HTMLDivElement>) {
		if (event.target === event.currentTarget) {
			handleReportClose();
		}
	}

	// Called by UploadPanel when a card text search returns results.
	// Clears any real scan result, stores the search summary, and opens the
	// modal pre-populated with the first match.
	function handleSearchResults(query: string, results: CardSearchResult[]) {
		resetAppraisal();
		setSearchSummary({ query, results });
		const firstMatch = results[0] ?? null;
		if (firstMatch) {
			setSearchAppraisal(createSearchAppraisal(firstMatch));
			setActiveSearchResultId(firstMatch.id);
		} else {
			setSearchAppraisal(null);
			setActiveSearchResultId(null);
		}
		setIsReportOpen(true);
	}

	// Called when the user taps a different row in SearchResultsPanel.
	// Swaps out the displayed appraisal without closing the modal.
	function handleSearchResultSelect(card: CardSearchResult) {
		setSearchAppraisal(createSearchAppraisal(card));
		setActiveSearchResultId(card.id);
	}

	// The result shown in ResultsColumn: prefer a real scan result; fall back
	// to the synthetic appraisal built from a search selection.
	const derivedResult = result ?? searchAppraisal;

	return (
		<section className="screen screen--appraise">
			<div className="appraise-layout">
				{isMobile ? (
					// Mobile: live camera only, no toggle
					<LiveCameraPanel
						error={error}
						loading={loading}
						onFileCaptured={handleFileDirect}
						onSearchResults={handleSearchResults}
					/>
				) : (
					// Desktop: upload only, no camera
					<UploadPanel
						error={error}
						isMobile={false}
						loading={loading}
						onFileChange={handleFileChange}
						onSearchResults={handleSearchResults}
						previewUrl={previewUrl}
					/>
				)}
			</div>

			{/* Result modal — shared by both tabs and the text search flow.
			    Rendered outside appraise-layout so it overlays the full screen. */}
			{isReportOpen && (derivedResult || searchSummary) ? (
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

							{derivedResult ? (
								<>
									{/* Context line shown only for search-based results, not real scans */}
									{searchAppraisal && searchSummary ? (
										<p className="report-context">
											Showing reference pricing for &ldquo;{searchSummary.query}&rdquo;.
											Tap another match below to switch the view.
										</p>
									) : null}
									<ResultsColumn
										// Don't show the scanned image preview for search results
										// since we never captured a physical card image.
										authToken={authToken}
										onCollectionAdded={onCollectionChanged}
										reportPreviewUrl={searchAppraisal ? null : reportPreviewUrl}
										result={derivedResult}
									/>
								</>
							) : null}

							{searchSummary ? (
								<SearchResultsPanel
									activeCardId={activeSearchResultId}
									onResultSelect={handleSearchResultSelect}
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

// Builds a synthetic ScanResult from a CardSearchResult so that text-search
// matches can be displayed in ResultsColumn without going through the scan API.
// Pricing is limited to the single lowest listing available from the search payload.
function createSearchAppraisal(card: CardSearchResult): ScanResult {
	return {
		scan_id: `search-${card.id}`,
		processed_at: new Date().toISOString(),
		card: {
			card_id: card.id,
			name: card.name,
			supertype: "Pokémon",
			set_name: card.set,
			card_number: null,
			set_size: null,
			rarity: card.rarity,
			types: card.type ? [card.type] : [],
			is_holo: null,
			image_url: null,
		},
		condition: {
			condition_label: "Reference catalog result",
		},
		pricing: {
			currency: "USD",
			estimated_market_value: card.lowest_listing,
			price_points: [
				{
					source: "Marketplace",
					label: "Lowest listing",
					price: card.lowest_listing,
					url: `https://www.google.com/search?q=${encodeURIComponent(`${card.name} ${card.set}`)}`,
				},
			],
		},
	};
}
