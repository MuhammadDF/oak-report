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
    onSearchPageClick,
  }: {
    result: { card: { name: string } };
    onSearchPageClick?: () => void;
  }) => (
    <div>
      <div>Derived result: {result.card.name}</div>
      <button onClick={onSearchPageClick} type="button">
        Search page
      </button>
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

  it("auto-opens result modals for scan results and supports search-page loading, filtering, sorting, pagination, and selection", async () => {
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
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: Array.from({ length: 11 }, (_, index) => ({
          id: `match-${index}`,
          console_name: index === 0 ? "Japanese Neo" : "Base Set",
          product_name: index === 0 ? "Charizard # 6" : `Pikachu # ${index}`,
          loose_price: index,
          tcg_id: null,
          image_url: index === 0 ? "" : `/card-${index}.png`,
          refreshed_at: "2026-04-26T00:00:00Z",
        })),
      }),
    } as never);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: Array.from({ length: 11 }, (_, index) => ({
          id: `match-${index}`,
          console_name: index === 0 ? "Japanese Neo" : "Base Set",
          product_name: index === 0 ? "Charizard # 6" : `Pikachu # ${index}`,
          loose_price: index,
          tcg_id: null,
          image_url: index === 0 ? "" : `/card-${index}.png`,
          refreshed_at: "2026-04-26T00:00:00Z",
        })),
      }),
    } as never);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        results: Array.from({ length: 11 }, (_, index) => ({
          id: `match-${index}`,
          console_name: index === 0 ? "Japanese Neo" : "Base Set",
          product_name: index === 0 ? "Charizard # 6" : `Pikachu # ${index}`,
          loose_price: index,
          tcg_id: null,
          image_url: index === 0 ? "" : `/card-${index}.png`,
          refreshed_at: "2026-04-26T00:00:00Z",
        })),
      }),
    } as never);

    const { unmount } = render(<AppraiseScreen authToken="token-123" />);

    expect(screen.getByText("Derived result: Charizard")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    unmount();
    render(<AppraiseScreen authToken="token-123" />);
    expect(screen.getByText("Derived result: Charizard")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    await waitFor(() => {
      expect(screen.getByText("Charizard # 6")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Search current matches"), {
      target: { value: "charizard" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Japanese Neo" },
    });
    fireEvent.click(screen.getByLabelText(/Only show cards with images/i));
    expect(screen.getByText("No matching cards found.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Only show cards with images/i));
    await waitFor(() => {
      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText("Search current matches"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Price ↕/ }));
    fireEvent.click(screen.getByRole("button", { name: /Price ↑/ }));
    fireEvent.click(screen.getByText("Pikachu # 1"));
    await waitFor(() => {
      expect(screen.getByText("Derived result: Pikachu")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Search page" }));
    await waitFor(() => {
      expect(screen.getByText("Charizard # 6")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Charizard # 6"));

    await waitFor(() => {
      expect(screen.getByText("Derived result: Charizard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Search page" }));
    await waitFor(() => {
      expect(screen.getByText("Charizard # 6")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("dialog"));

    await waitFor(() => {
      expect(screen.queryByText("Charizard # 6")).not.toBeInTheDocument();
    });
  });

  it("handles missing auth and failed search-page loads", async () => {
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
          name: "Pikachu",
          card_number: "25",
          language: "English",
        },
        image_url: "/pikachu.png",
        set_name: "Base",
        pricing: 12.5,
      },
    });

    const { unmount } = render(<AppraiseScreen authToken={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));
    expect(await screen.findByText("Authentication required for search page.")).toBeInTheDocument();

    unmount();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    } as never);

    render(<AppraiseScreen authToken="token-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(await screen.findByText("Could not load card matches.")).toBeInTheDocument();
  });

  it("handles generic non-error search-page failures", async () => {
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
          name: "Mew",
          card_number: "8",
          language: "English",
        },
        image_url: "/mew.png",
        set_name: "Promo",
        pricing: 50,
      },
    });
    vi.mocked(fetch).mockRejectedValueOnce("boom" as never);

    render(<AppraiseScreen authToken="token-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Search page" }));

    expect(await screen.findByText("Failed to load search page results.")).toBeInTheDocument();
  });
});
