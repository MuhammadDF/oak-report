import { MouseEvent, useEffect, useState } from "react";
import { ResultsColumn } from "../components/appraise/ResultsColumn";
import { UploadPanel } from "../components/appraise/UploadPanel";
import { SearchResultsPanel } from "../components/appraise/SearchResultsPanel";
import { useAppraisal } from "../hooks/useAppraisal";
import { useMediaQuery } from "../hooks/useMediaQuery";
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
	const [searchAppraisal, setSearchAppraisal] = useState<ScanResult | null>(null);
	const [activeSearchResultId, setActiveSearchResultId] = useState<string | null>(null);
	const isMobile = useMediaQuery("(max-width: 768px)");

	useEffect(() => {
		if (result) {
			setIsReportOpen(true);
			setSearchSummary(null);
			setSearchAppraisal(null);
			setActiveSearchResultId(null);
		}
	}, [result]);

	function handleReportClose() {
		setIsReportOpen(false);
		resetAppraisal();
		setSearchSummary(null);
		setSearchAppraisal(null);
		setActiveSearchResultId(null);
	}

	function handleModalBackdropClick(event: MouseEvent<HTMLDivElement>) {
		if (event.target === event.currentTarget) {
			handleReportClose();
		}
	}

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

	function handleSearchResultSelect(card: CardSearchResult) {
		setSearchAppraisal(createSearchAppraisal(card));
		setActiveSearchResultId(card.id);
	}

	const derivedResult = result ?? searchAppraisal;

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
									{searchAppraisal && searchSummary ? (
										<p className="report-context">
											Showing reference pricing for &ldquo;{searchSummary.query}&rdquo;.
											Tap another match below to switch the view.
										</p>
									) : null}
									<ResultsColumn
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
