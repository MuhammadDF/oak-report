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
            id: "match-2",
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
    onBackToSearchPage,
  }: {
    result: { card: { name: string } };
    hasBackToSearchPage?: boolean;
    onBackToSearchPage?: () => void;
  }) => (
    <div>
      <div>Derived result: {result.card.name}</div>
      {hasBackToSearchPage ? (
        <button onClick={onBackToSearchPage} type="button">
          Back
        </button>
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

describe("AppraiseScreen", () => {
  beforeEach(() => {
    mockUseAppraisal.mockReturnValue({
      error: null,
      handleFileChange: vi.fn(),
      handleFileDirect: vi.fn(),
      loading: false,
      previewUrl: null,
      reportPreviewUrl: "/preview.png",
      resetAppraisal: vi.fn(),
      result: null,
    });
    mockUseIsMobile.mockReturnValue(false);
    vi.mocked(fetch).mockReset();
  });

  it("opens search-page results from the desktop upload flow and supports row selection", async () => {
    render(<AppraiseScreen authToken="token-123" />);

    fireEvent.click(screen.getByRole("button", { name: "Open upload search" }));

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
      error: null,
      handleFileChange: vi.fn(),
      handleFileDirect: vi.fn(),
      loading: false,
      previewUrl: null,
      reportPreviewUrl: "/preview.png",
      resetAppraisal: vi.fn(),
      result: {
        processed_at: "2026-04-26T00:00:00Z",
        card: {
          name: "Charizard",
          card_number: "4",
          language: "English",
        },
        image_url: "/charizard.png",
        set_name: "Base",
        pricing: 120,
      },
    });

    render(<AppraiseScreen authToken="token-123" />);

    expect(screen.getByText("Derived result: Charizard")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Search page" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });
});
