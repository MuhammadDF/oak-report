import { CardSearchResult } from "../../types/app";
import { formatCurrency } from "../../utils/format";

type SearchResultsPanelProps = {
	query: string;
	results: CardSearchResult[];
};

export function SearchResultsPanel({ query, results }: SearchResultsPanelProps) {
	return (
		<section className="results-column">
			<article className="panel report-panel">
				<div className="report-panel__header">
					<div>
						<p className="panel__eyebrow">Search results</p>
						<h2>&ldquo;{query}&rdquo;</h2>
					</div>
					<span className="report-badge">
						{results.length} match{results.length === 1 ? "" : "es"}
					</span>
				</div>

				{results.length ? (
					<ul className="search-results-list">
						{results.map((card) => (
							<li key={card.id}>
								<div>
									<strong>{card.name}</strong>
									<span>
										{card.set} &middot; {card.rarity} &middot; {card.type}
									</span>
								</div>
								<strong>{formatCurrency("USD", card.lowest_listing)}</strong>
							</li>
						))}
					</ul>
				) : (
					<p className="card-search__status">No matches returned yet. Try another query.</p>
				)}
			</article>
		</section>
	);
}
