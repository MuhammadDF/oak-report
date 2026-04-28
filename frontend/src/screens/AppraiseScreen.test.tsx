import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppraiseScreen } from "./AppraiseScreen";

const mockUseAppraisal = vi.fn();
const mockUseIsMobile = vi.fn();

vi.mock("../hooks/useAppraisal", () => ({
  useAppraisal: (...args: unknown[]) => mockUseAppraisal(...args),
}));

vi.mock("../hooks/useIsMobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock("../components/appraise/UploadPanel", () => ({
  UploadPanel: ({ onSearchResults }: { onSearchResults: (query: string, results: unknown[]) => void }) => (
    <button
      onClick={() =>
        onSearchResults("pikachu", [
          {
            id: "match-1",
            console_name: "Base Set",
            product_name: "Pikachu #25",
            loose_price: 12.5,
            image_url: "/pikachu.png",
            refreshed_at: "2026-04-26T00:00:00Z",
          },
          {
            id: "match-2",
            console_name: "Jungle",
            product_name: "Bulbasaur #44",
            loose_price: 5.0,
            image_url: "",
            refreshed_at: "2026-04-26T00:00:00Z",
          },
        ])
      }
      type="button"
    >
      Open upload search
    </button>
  ),
}));

vi.mock("../components/appraise/LiveCameraPanel", () => ({
  LiveCameraPanel: ({ onSearchResults }: { onSearchResults: (query: string, results: unknown[]) => void }) => (
    <button
      onClick={() =>
        onSearchResults("charizard", [
          {
            id: "match-cam",
            console_name: "Japanese Neo",
            product_name: "Charizard # 6",
            loose_price: 55,
            image_url: "  ",
            refreshed_at: "2026-04-26T00:00:00Z",
          },
        ])
      }
      type="button"
    >
      Open camera search
    </button>
  ),
}));

vi.mock("../components/appraise/ResultsColumn", () => ({
  ResultsColumn: ({
    result,
    hasBackToSearchPage,
    onClose,
    onBackToSearchPage,
    onSearchPageClick,
  }: {
    result: { card: { name: string } };
    hasBackToSearchPage?: boolean;
    onClose?: () => void;
    onBackToSearchPage?: () => void;
    onSearchPageClick?: () => void;
  }) => (
    <div>
      <button onClick={onClose} type="button">
        Close
      </button>
      <div>Derived result: {result.card.name}</div>
      {hasBackToSearchPage ? (
        <>
          <button onClick={onBackToSearchPage} type="button">
            Back
          </button>
          <button onClick={onSearchPageClick} type="button">
            Search page
          </button>
        </>
      ) : null}
    </div>
  ),
}));

vi.mock("../components/appraise/SearchResultsPanel", () => ({
  SearchResultsPanel: ({
    onResultSelect,
  }: {
    onResultSelect: (card: {
      id: string;
      name: string;
      set: string;
      rarity: string;
      type: string;
      lowest_listing: number;
    }) => void;
  }) => (
    <button
      onClick={() =>
        onResultSelect({
          id: "card-1",
          name: "Pikachu",
          set: "Base",
          rarity: "Common",
          type: "Electric",
          lowest_listing: 12.5,
        })
      }
      type="button"
    >
      Pick result
    </button>
  ),
}));

const charizardResult = {
  processed_at: "2026-04-26T00:00:00Z",
  card: { name: "Charizard", card_number: "4", language: "English" },
  image_url: "/charizard.png",
  set_name: "Base",
  pricing: 120,
};

function defaultAppraisalMock() {
  return {
    error: null,
    handleFileChange: vi.fn(),
    handleFileDirect: vi.fn(),
    loading: false,
    previewUrl: null,
    reportPreviewUrl: "/preview.png",
    resetAppraisal: vi.fn(),
    result: null,
  };
}

/** Click "Open upload search" to open the search-page modal with 2 results. */
function openSearchPage() {
  fireEvent.click(screen.getByRole("button", { name: "Open upload search" }));
}

/** Open search page, then click a row to open the report modal. */
async function openReportViaSearchPage() {
  openSearchPage();
  fireEvent.click(screen.getByText("Pikachu #25"));
  await screen.findByText("Derived result: Pikachu");
}

describe("AppraiseScreen", () => {
  beforeEach(() => {
    mockUseAppraisal.mockReturnValue(defaultAppraisalMock());
    mockUseIsMobile.mockReturnValue(false);
    vi.mocked(fetch).mockReset();
  });

  it("opens search-page results from the desktop upload flow and supports row selection", async () => {
    render(<AppraiseScreen authToken="token-123" />);

    openSearchPage();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Pikachu #25"));

    expect(await screen.findByText("Derived result: Pikachu")).toBeInTheDocument();
  });

  it("renders the mobile camera branch", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(<AppraiseScreen authToken="token-123" />);

    expect(screen.getByRole("button", { name: "Open camera search" })).toBeInTheDocument();
  });

  it("auto-opens single-result reports and hides the secondary action", () => {
    mockUseAppraisal.mockReturnValue({
      ...defaultAppraisalMock(),
      result: charizardResult,
    });

    render(<AppraiseScreen authToken="token-123" />);

    expect(screen.getByText("Derived result: Charizard")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("closes the report modal when Close is clicked", () => {
    mockUseAppraisal.mockReturnValue({ ...defaultAppraisalMock(), result: charizardResult });
    render(<AppraiseScreen authToken="token-123" />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the report modal when the backdrop is clicked", () => {
    mockUseAppraisal.mockReturnValue({ ...defaultAppraisalMock(), result: charizardResult });
    render(<AppraiseScreen authToken="token-123" />);

    fireEvent.click(screen.getByRole("dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close the report modal when the inner panel is clicked", () => {
    mockUseAppraisal.mockReturnValue({ ...defaultAppraisalMock(), result: charizardResult });
    render(<AppraiseScreen authToken="token-123" />);

    fireEvent.click(screen.getByText("Derived result: Charizard"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("auto-opens the search page for a multi-result scan and resets appraisal", () => {
    const resetAppraisal = vi.fn();
    mockUseAppraisal.mockReturnValue({
      ...defaultAppraisalMock(),
      resetAppraisal,
      result: {
        ...charizardResult,
        matches: [
          { id: "m1", console_name: "Base Set", product_name: "Charizard #4", loose_price: 100, image_url: "" },
          { id: "m2", console_name: "Base Set", product_name: "Charizard #4 Holo", loose_price: 200, image_url: "" },
        ],
      },
    });

    render(<AppraiseScreen authToken="token-123" />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Derived result: Charizard")).not.toBeInTheDocument();
    expect(screen.getByText("Charizard #4")).toBeInTheDocument();
    expect(resetAppraisal).toHaveBeenCalled();
  });

  it("closes the search page when Close is clicked", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the search page when the backdrop is clicked", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    fireEvent.click(screen.getByRole("dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navigates back from the report to the search page", async () => {
    render(<AppraiseScreen authToken="token-123" />);
    await openReportViaSearchPage();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Derived result: Pikachu")).not.toBeInTheDocument();
    expect(screen.getByText("Pikachu #25")).toBeInTheDocument();
  });

  it("loads results when Search page is clicked", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: "fetched-1",
            console_name: "Fossil",
            product_name: "Gengar #5",
            loose_price: 80,
            image_url: "/gengar.png",
            refreshed_at: "2026-04-26T00:00:00Z",
          },
        ],
      }),
    } as Response);

    render(<AppraiseScreen authToken="token-123" />);
    await openReportViaSearchPage();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(await screen.findByText("Gengar #5")).toBeInTheDocument();
  });

  it("shows loading state and then empty state when Search page fetch returns no results", async () => {
    let resolveFetch!: (r: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise<Response>((res) => { resolveFetch = res; }),
    );

    render(<AppraiseScreen authToken="token-123" />);
    await openReportViaSearchPage();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(screen.getByText("Loading matches...")).toBeInTheDocument();

    resolveFetch({ ok: true, json: async () => ({ results: [] }) } as Response);

    await waitFor(() =>
      expect(screen.queryByText("Loading matches...")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("No matching cards found.")).toBeInTheDocument();
  });

  it("shows an error when Search page is opened without an auth token", async () => {
    render(<AppraiseScreen authToken={null} />);
    await openReportViaSearchPage();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(
      await screen.findByText("Authentication required for search page."),
    ).toBeInTheDocument();
  });

  it("shows an error when the search page fetch returns a non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

    render(<AppraiseScreen authToken="token-123" />);
    await openReportViaSearchPage();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(await screen.findByText("Could not load card matches.")).toBeInTheDocument();
  });

  it("shows an error when the search page fetch throws a network error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<AppraiseScreen authToken="token-123" />);
    await openReportViaSearchPage();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("filters search page results by text input", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    expect(screen.getByText("Pikachu #25")).toBeInTheDocument();
    expect(screen.getByText("Bulbasaur #44")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search current matches"), {
      target: { value: "pikachu" },
    });

    expect(screen.getByText("Pikachu #25")).toBeInTheDocument();
    expect(screen.queryByText("Bulbasaur #44")).not.toBeInTheDocument();
  });

  it("filters search page results by set dropdown", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Jungle" } });

    expect(screen.queryByText("Pikachu #25")).not.toBeInTheDocument();
    expect(screen.getByText("Bulbasaur #44")).toBeInTheDocument();
  });

  it("filters search page results to only cards with images", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByText("Pikachu #25")).toBeInTheDocument();
    expect(screen.queryByText("Bulbasaur #44")).not.toBeInTheDocument();
  });

  it("cycles price sort through none → asc → desc → asc on repeated clicks", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    const sortBtn = screen.getByRole("button", { name: /Price/ });
    expect(sortBtn).toHaveTextContent("↕");

    fireEvent.click(sortBtn);
    expect(sortBtn).toHaveTextContent("↑");

    fireEvent.click(sortBtn);
    expect(sortBtn).toHaveTextContent("↓");

    fireEvent.click(sortBtn);
    expect(sortBtn).toHaveTextContent("↑");
  });

  it("paginates search page results with Next and Previous buttons", async () => {
    const manyResults = Array.from({ length: 11 }, (_, i) => ({
      id: `r-${i}`,
      console_name: "Base Set",
      product_name: `Card ${i + 1}`,
      loose_price: i,
      image_url: "",
      refreshed_at: "2026-04-26T00:00:00Z",
    }));
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: manyResults }),
    } as Response);

    render(<AppraiseScreen authToken="token-123" />);
    await openReportViaSearchPage();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(await screen.findByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Card 11")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("uses the fallback image for search results with blank image URLs", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    const pikachuImg = screen
      .getAllByRole("img")
      .find((img) => img.getAttribute("alt") === "Pikachu #25");
    const bulbasaurImg = screen
      .getAllByRole("img")
      .find((img) => img.getAttribute("alt") === "Bulbasaur #44");

    expect(pikachuImg).toHaveAttribute("src", "/pikachu.png");
    expect(bulbasaurImg).toHaveAttribute("src", "https://images.pokemontcg.io/sv03/203.png");
  });

  it("detects non-English language from mobile camera result console name", async () => {
    mockUseIsMobile.mockReturnValue(true);
    render(<AppraiseScreen authToken="token-123" />);

    fireEvent.click(screen.getByRole("button", { name: "Open camera search" }));

    expect(await screen.findByText("Derived result: Charizard")).toBeInTheDocument();
  });

  it("shows a generic error when the search page fetch throws a non-Error value", async () => {
    vi.mocked(fetch).mockRejectedValueOnce("oops");

    render(<AppraiseScreen authToken="token-123" />);
    await openReportViaSearchPage();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(
      await screen.findByText("Failed to load search page results."),
    ).toBeInTheDocument();
  });

  it("resets text filter page to 1 when input changes", () => {
    render(<AppraiseScreen authToken="token-123" />);
    openSearchPage();

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search current matches"), {
      target: { value: "p" },
    });

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });
});
