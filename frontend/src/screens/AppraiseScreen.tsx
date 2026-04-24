import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../constants/api";
import { ResultsColumn } from "../components/appraise/ResultsColumn";
import { UploadPanel } from "../components/appraise/UploadPanel";
import { LiveCameraPanel } from "../components/appraise/LiveCameraPanel";
import { SearchResultsPanel } from "../components/appraise/SearchResultsPanel";
import { useAppraisal } from "../hooks/useAppraisal";
import { useIsMobile } from "../hooks/useIsMobile";
import {
	CardPricingMatch,
	CardPricingMatchResponse,
	CardSearchResult,
	ScanResult,
} from "../types/app";
import { formatCurrency } from "../utils/format";

const SEARCH_PAGE_SIZE = 10;
const FALLBACK_CARD_IMAGE_URL = "https://images.pokemontcg.io/sv03/203.png";

type AppraiseScreenProps = {
	authToken: string | null;
	onCollectionAdded?: () => void;
};

export function AppraiseScreen({
	authToken,
	onCollectionAdded,
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
	} = useAppraisal(authToken);

	const isMobile = useIsMobile();

	// Whether the result modal is visible. Opened automatically on a successful
	// scan or when the user searches by text.
	const [isReportOpen, setIsReportOpen] = useState(false);
	const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);
	const [searchPageLoading, setSearchPageLoading] = useState(false);
	const [searchPageError, setSearchPageError] = useState<string | null>(null);
	const [searchPageResults, setSearchPageResults] = useState<CardPricingMatch[]>([]);
	const [searchPageInput, setSearchPageInput] = useState("");
	const [searchPageQuery, setSearchPageQuery] = useState("");
	const [searchPagePage, setSearchPagePage] = useState(1);

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
		setIsSearchPageOpen(false);
		setSearchPageError(null);
		resetAppraisal();
		setSearchSummary(null);
		setSearchAppraisal(null);
		setActiveSearchResultId(null);
	}

	async function loadSearchPageResults(card: ScanResult["card"]) {
		setSearchPageLoading(true);
		setSearchPageError(null);

		try {
			if (!authToken) {
				throw new Error("Authentication required for search page.");
			}

			const response = await fetch(`${API_BASE_URL}/api/search/card-info`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					name: card.name,
					card_number: card.card_number,
					language: card.language,
				}),
			});

			if (!response.ok) {
				throw new Error("Could not load card matches.");
			}

			const payload = (await response.json()) as CardPricingMatchResponse;
			setSearchPageResults(payload.results);
		} catch (caughtError) {
			setSearchPageResults([]);
			setSearchPageError(
				caughtError instanceof Error
					? caughtError.message
					: "Failed to load search page results.",
			);
		} finally {
			setSearchPageLoading(false);
		}
	}

	function handleSearchPageOpen() {
		const currentCard = (result ?? searchAppraisal)?.card;
		setSearchPageInput("");
		setSearchPageQuery("");
		setSearchPagePage(1);
		setIsReportOpen(false);
		setIsSearchPageOpen(true);

		if (!currentCard) {
			setSearchPageResults([]);
			setSearchPageError("No card is currently selected.");
			return;
		}

		void loadSearchPageResults(currentCard);
	}

	function handleSearchPageClose() {
		setIsSearchPageOpen(false);
	}

	function handleSearchPageSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSearchPagePage(1);
		setSearchPageQuery(searchPageInput.trim());
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

	const filteredSearchPageResults = useMemo(() => {
		const query = searchPageQuery.trim().toLowerCase();
		if (!query) {
			return searchPageResults;
		}

		return searchPageResults.filter((item) => {
			const haystack = [
				item.product_name,
				item.console_name,
				item.id,
				item.tcg_id ?? "",
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(query);
		});
	}, [searchPageQuery, searchPageResults]);

	const searchPageTotalPages = Math.max(
		1,
		Math.ceil(filteredSearchPageResults.length / SEARCH_PAGE_SIZE),
	);

	useEffect(() => {
		if (searchPagePage > searchPageTotalPages) {
			setSearchPagePage(searchPageTotalPages);
		}
	}, [searchPagePage, searchPageTotalPages]);

	const searchPageStart = (searchPagePage - 1) * SEARCH_PAGE_SIZE;
	const pagedSearchPageResults = filteredSearchPageResults.slice(
		searchPageStart,
		searchPageStart + SEARCH_PAGE_SIZE,
	);

	return (
		<section className="screen screen--appraise">
			<div className="appraise-layout">
				{isMobile ? (
					// Mobile: live camera only, no toggle
					<LiveCameraPanel
						authToken={authToken}
						error={error}
						loading={loading}
						onFileCaptured={handleFileDirect}
						onSearchResults={handleSearchResults}
					/>
				) : (
					// Desktop: upload only, no camera
					<UploadPanel
						authToken={authToken}
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
										onSearchPageClick={handleSearchPageOpen}
										onCollectionAdded={onCollectionAdded}
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

			{isSearchPageOpen ? (
				<div
					aria-modal="true"
					className="report-modal"
					onClick={(event) => {
						if (event.target === event.currentTarget) {
							handleSearchPageClose();
						}
					}}
					role="dialog"
				>
					<div
						className="report-modal__panel"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="report-modal__header">
							<p className="panel__eyebrow">Search page</p>
							<button
								className="report-modal__close"
								onClick={handleSearchPageClose}
								type="button"
							>
								Close
							</button>
						</div>

						<article className="panel admin-panel search-page-panel">
							<form className="admin-controls" onSubmit={handleSearchPageSubmit}>
								<input
									className="admin-input"
									onChange={(event) => setSearchPageInput(event.target.value)}
									placeholder="Search current matches"
									type="search"
									value={searchPageInput}
								/>
								<button className="primary-button" type="submit">
									Search
								</button>
							</form>

							{searchPageError ? <p className="error-banner">{searchPageError}</p> : null}

							<div className="admin-table-wrap" role="region" aria-label="Card matches">
								<table className="admin-table">
									<thead>
										<tr>
											<th>Image</th>
											<th>Product</th>
											<th>Set</th>
											<th>Price</th>
										</tr>
									</thead>
									<tbody>
										{searchPageLoading ? (
											<tr>
												<td colSpan={4}>Loading matches...</td>
											</tr>
										) : null}
										{!searchPageLoading && pagedSearchPageResults.length === 0 ? (
											<tr>
												<td colSpan={4}>No matching cards found.</td>
											</tr>
										) : null}
										{!searchPageLoading
											? pagedSearchPageResults.map((item) => (
												<tr key={item.id}>
													<td className="search-page-thumb-cell">
														<img
															alt={item.product_name}
															className="search-page-thumb"
															src={item.image_url?.trim() ? item.image_url : FALLBACK_CARD_IMAGE_URL}
														/>
													</td>
													<td>{item.product_name}</td>
													<td>{item.console_name}</td>
													<td>{formatCurrency("USD", item.loose_price)}</td>
												</tr>
											))
											: null}
									</tbody>
								</table>
							</div>

							<div className="admin-pagination">
								<button
									className="secondary-button"
									disabled={searchPagePage <= 1}
									onClick={() =>
										setSearchPagePage((current) => Math.max(1, current - 1))
									}
									type="button"
								>
									Previous
								</button>
								<p>
									Page {searchPagePage} of {searchPageTotalPages}
								</p>
								<button
									className="secondary-button"
									disabled={searchPagePage >= searchPageTotalPages}
									onClick={() =>
										setSearchPagePage((current) =>
											Math.min(searchPageTotalPages, current + 1),
										)
									}
									type="button"
								>
									Next
								</button>
							</div>
						</article>
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
		processed_at: new Date().toISOString(),
		card: {
			name: card.name,
			card_number: null,
			language: null,
		},
		set_name: card.set,
		image_url: null,
		pricing: card.lowest_listing,
	};
}
