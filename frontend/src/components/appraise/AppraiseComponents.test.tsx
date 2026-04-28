import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CameraCard } from "./CameraCard";
import { CardSearchBar } from "./CardSearchBar";
import { CollectionSelectionPanel } from "./CollectionSelectionPanel";
import { EmptyReport } from "./EmptyReport";
import { IdentityReport } from "./IdentityReport";
import { LiveCameraPanel } from "./LiveCameraPanel";
import { ResultsColumn } from "./ResultsColumn";
import { SearchResultsPanel } from "./SearchResultsPanel";
import { UploadPanel } from "./UploadPanel";

const { mockAddScanToCollection, mockUseCardSearch } = vi.hoisted(() => ({
  mockAddScanToCollection: vi.fn(),
  mockUseCardSearch: vi.fn(), 
}));

vi.mock("../../repositories/collectionRepository", () => ({
  getCollectionRepository: () => ({
    addScanToCollection: mockAddScanToCollection,
  }),
}));

vi.mock("../../hooks/useCardSearch", () => ({
  useCardSearch: (...args: unknown[]) => mockUseCardSearch(...args),
}));

describe("CameraCard", () => {
  it("renders loading and idle states", () => {
    const { rerender } = render(<CameraCard loading={false} />);
    expect(screen.getByText("Align card within frame")).toBeInTheDocument();

    rerender(<CameraCard loading />);
    expect(screen.getByText("Building appraisal...")).toBeInTheDocument();
  });
});

describe("CardSearchBar", () => {
  it("renders states and forwards form actions", () => {
    const onQueryChange = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(
      <CardSearchBar
        error="Bad search"
        lastSearchTerm="pikachu"
        loading={false}
        onQueryChange={onQueryChange}
        onSubmit={onSubmit}
        query="charizard"
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "mew" } });
    fireEvent.submit(screen.getByRole("searchbox").closest("form")!);

    expect(onQueryChange).toHaveBeenCalledWith("mew");
    expect(onSubmit).toHaveBeenCalled();
    expect(screen.getByText("Bad search")).toBeInTheDocument();
  });

  it("shows loading and success messaging", () => {
    const { rerender } = render(
      <CardSearchBar
        error={null}
        lastSearchTerm=""
        loading
        onQueryChange={vi.fn()}
        onSubmit={vi.fn()}
        query="pikachu"
      />,
    );

    expect(screen.getByText(/Looking for "pikachu"/)).toBeInTheDocument();

    rerender(
      <CardSearchBar
        error={null}
        lastSearchTerm="pikachu"
        loading={false}
        onQueryChange={vi.fn()}
        onSubmit={vi.fn()}
        query=""
      />,
    );

    expect(screen.getByText(/Search page refreshed with matches/)).toBeInTheDocument();
  });
});

describe("EmptyReport", () => {
  it("renders the idle report state", () => {
    render(<EmptyReport />);
    expect(screen.getByRole("heading", { name: "Waiting for a scan" })).toBeInTheDocument();
  });
});

describe("IdentityReport", () => {
  it("renders backend image data", () => {
    render(
      <IdentityReport
        result={{
          processed_at: "2026-04-26T00:00:00Z",
          card: {
            name: "Pikachu",
            card_number: "25",
            language: "English",
          },
          set_name: "Base",
          image_url: "/pikachu.png",
          pricing: 12.5,
        }}
      />,
    );

    expect(screen.getByAltText("Pikachu")).toHaveAttribute("src", "/pikachu.png");
    expect(screen.getByText("$12.50")).toBeInTheDocument();
  });

  it("falls back to preview and pending placeholders", () => {
    render(
      <IdentityReport
        result={{
          processed_at: "2026-04-26T00:00:00Z",
          card: {
            name: "Bulbasaur",
            card_number: null,
            language: null,
          },
          set_name: null,
          image_url: "/preview.png",
          pricing: 2,
        }}
      />,
    );

    expect(screen.getByAltText("Bulbasaur")).toHaveAttribute("src", "/preview.png");
    expect(screen.getAllByText("Pending")).toHaveLength(3);
  });

  it("renders the no-image placeholder when no art is available", () => {
    render(
      <IdentityReport
        result={{
          processed_at: "2026-04-26T00:00:00Z",
          card: {
            name: "Mew",
            card_number: null,
            language: "English",
          },
          set_name: "Promo",
          image_url: null,
          pricing: 50,
        }}
      />,
    );

    expect(screen.getByText("No card image")).toBeInTheDocument();
  });
});

describe("CollectionSelectionPanel", () => {
  it("adjusts quantity, closes, and removes cards", () => {
    const onQuantityChange = vi.fn();
    const onRemove = vi.fn();
    const onClose = vi.fn();

    render(
      <CollectionSelectionPanel
        card={{
          id: "card-1",
          name: "Pikachu",
          set: "Base",
          number: "25",
          price: 12.5,
          image: "/pikachu.png",
          quantity: 1,
          grade: "PSA 9",
        }}
        onClose={onClose}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    fireEvent.click(screen.getByRole("button", { name: "Close collection card" }));
    fireEvent.click(screen.getByRole("button", { name: /Remove card/i }));

    expect(screen.getAllByText("$12.50")).toHaveLength(2);
    expect(onQuantityChange).toHaveBeenNthCalledWith(1, 2);
    expect(onQuantityChange).toHaveBeenNthCalledWith(2, 0);
    expect(onClose).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalled();
  });

  it("renders without optional close and grade content", () => {
    render(
      <CollectionSelectionPanel
        card={{
          id: "card-2",
          name: "Bulbasaur",
          set: "Base",
          number: "1",
          price: 5,
          image: "/bulbasaur.png",
          quantity: 0,
        }}
        onQuantityChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Close collection card" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
  });
});

describe("SearchResultsPanel", () => {
  it("renders results and active selection", () => {
    const onResultSelect = vi.fn();
    render(
      <SearchResultsPanel
        activeCardId="card-1"
        onResultSelect={onResultSelect}
        query="pikachu"
        results={[
          {
            id: "card-1",
            name: "Pikachu",
            set: "Base",
            rarity: "Common",
            type: "Electric",
            lowest_listing: 12.5,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Pikachu/i }));

    expect(screen.getByText("1 match")).toBeInTheDocument();
    expect(onResultSelect).toHaveBeenCalled();
  });

  it("renders an empty state and non-interactive rows", () => {
    render(<SearchResultsPanel query="mew" results={[]} />);
    expect(screen.getByText("No matches returned yet. Try another query.")).toBeInTheDocument();
  });
});

describe("ResultsColumn", () => {
  beforeEach(() => {
    mockAddScanToCollection.mockReset();
  });

  it("renders empty state without a result", () => {
    render(
      <ResultsColumn
        authToken={null}
        reportPreviewUrl={null}
        result={null}
      />,
    );

    expect(screen.getByText("Waiting for a scan")).toBeInTheDocument();
  });

  it("adds cards to the collection and reports errors", async () => {
    const onCollectionAdded = vi.fn();
    mockAddScanToCollection
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("boom"));

    const result = {
      processed_at: "2026-04-26T00:00:00Z",
      card: {
        name: "Pikachu",
        card_number: "25",
        language: "English",
      },
      set_name: "Base",
      image_url: null,
      pricing: 12.5,
    };

    const { rerender } = render(
      <ResultsColumn
        authToken="token-123"
        onCollectionAdded={onCollectionAdded}
        reportPreviewUrl="/preview.png"
        result={result}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to collection" }));

    await waitFor(() => {
      expect(screen.getByText("Saved to collection.")).toBeInTheDocument();
    });

    expect(mockAddScanToCollection).toHaveBeenCalledWith("token-123", {
      name: "Pikachu",
      set: "Base",
      number: "25",
      price: 12.5,
      image: "/preview.png",
      language: "English",
    });
    expect(onCollectionAdded).toHaveBeenCalled();

    expect(screen.queryByRole("button", { name: "Search page" })).not.toBeInTheDocument();

    rerender(
      <ResultsColumn
        authToken="token-123"
        reportPreviewUrl="/preview.png"
        result={result}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to collection" }));
    await waitFor(() => {
      expect(screen.getByText("Could not save to collection.")).toBeInTheDocument();
    });
  });

  it("shows a back button when returning to a multi-match search result", () => {
    const onBackToSearchPage = vi.fn();

    render(
      <ResultsColumn
        authToken="token-123"
        hasBackToSearchPage
        onBackToSearchPage={onBackToSearchPage}
        reportPreviewUrl="/preview.png"
        result={{
          processed_at: "2026-04-26T00:00:00Z",
          card: {
            name: "Pikachu",
            card_number: "25",
            language: "English",
          },
          set_name: "Base",
          image_url: null,
          pricing: 12.5,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBackToSearchPage).toHaveBeenCalled();
  });

  it("falls back to default collection payload values", async () => {
    mockAddScanToCollection.mockResolvedValueOnce(undefined);

    render(
      <ResultsColumn
        authToken="token-123"
        reportPreviewUrl={null}
        result={{
          processed_at: "2026-04-26T00:00:00Z",
          card: {
            name: "Mew",
            card_number: null,
            language: "English",
          },
          set_name: null,
          image_url: "/mew.png",
          pricing: 50,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to collection" }));

    await waitFor(() => {
      expect(mockAddScanToCollection).toHaveBeenCalledWith("token-123", {
        name: "Mew",
        set: "Unknown Set",
        number: "--",
        price: 50,
        image: "/mew.png",
        language: "English",
      });
    });
  });
});

describe("UploadPanel", () => {
  beforeEach(() => {
    mockUseCardSearch.mockReturnValue({
      error: null,
      lastSearchTerm: "pikachu",
      loading: false,
      query: "",
      setQuery: vi.fn(),
      handleSubmit: vi.fn(),
    });
  });

  it("renders desktop upload flow with error banner", () => {
    const onFileChange = vi.fn();
    render(
      <UploadPanel
        authToken="token-123"
        error="Scan failed"
        isMobile={false}
        loading={false}
        onFileChange={onFileChange}
        onSearchResults={vi.fn()}
        previewUrl="/preview.png"
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(["x"], "card.jpg", { type: "image/jpeg" })] },
    });

    expect(onFileChange).toHaveBeenCalled();
    expect(screen.getByText("Scan failed")).toBeInTheDocument();
  });

  it("renders mobile capture flow and resets the input when idle without preview", () => {
    render(
      <UploadPanel
        authToken="token-123"
        error={null}
        isMobile
        loading={false}
        onFileChange={vi.fn()}
        onSearchResults={vi.fn()}
        previewUrl={null}
      />,
    );

    expect(screen.getByText("Use camera")).toBeInTheDocument();
  });

  it("renders desktop loading state", () => {
    render(
      <UploadPanel
        authToken="token-123"
        error={null}
        isMobile={false}
        loading
        onFileChange={vi.fn()}
        onSearchResults={vi.fn()}
        previewUrl={null}
      />,
    );

    expect(screen.getByText("Analyzing upload... building report.")).toBeInTheDocument();
    expect(screen.getByText("Uploading card image...")).toBeInTheDocument();
  });
});

describe("LiveCameraPanel", () => {
  beforeEach(() => {
    mockUseCardSearch.mockReturnValue({
      error: null,
      lastSearchTerm: "",
      loading: false,
      query: "",
      setQuery: vi.fn(),
      handleSubmit: vi.fn(),
    });
  });

  it("reports unavailable camera support", async () => {
    const original = navigator.mediaDevices;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });

    render(
      <LiveCameraPanel
        authToken="token-123"
        error={null}
        loading={false}
        onFileCaptured={vi.fn()}
        onSearchResults={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(/Camera is not available. Make sure the page is loaded over HTTPS./),
    ).toBeInTheDocument();

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: original,
    });
  });

  it("captures images when the camera is ready", async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop }],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    const toBlob = vi.fn((callback: BlobCallback) =>
      callback(new Blob(["image"], { type: "image/jpeg" })),
    );
    const drawImage = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toBlob,
        } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const onFileCaptured = vi.fn();
    const { unmount } = render(
      <LiveCameraPanel
        authToken="token-123"
        error="Scan failed"
        loading={false}
        onFileCaptured={onFileCaptured}
        onSearchResults={vi.fn()}
      />,
    );

    const video = document.querySelector("video")!;
    Object.defineProperty(video, "videoWidth", { configurable: true, value: 640 });
    Object.defineProperty(video, "videoHeight", { configurable: true, value: 480 });
    fireEvent.canPlay(video);
    fireEvent.click(screen.getByRole("button", { name: "Capture" }));

    await waitFor(() => {
      expect(onFileCaptured).toHaveBeenCalled();
    });

    expect(screen.getByText("Scan failed")).toBeInTheDocument();

    unmount();
    expect(stop).toHaveBeenCalled();
  });

  it("falls back when facingMode is unsupported and safely bails without a 2d context", async () => {
    const stop = vi.fn();
    const overconstrained = new DOMException("bad constraint", "OverconstrainedError");
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(overconstrained)
      .mockResolvedValueOnce({
        getTracks: () => [{ stop }],
      });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => null,
          toBlob: vi.fn(),
        } as unknown as HTMLCanvasElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const onFileCaptured = vi.fn();
    render(
      <LiveCameraPanel
        authToken="token-123"
        error={null}
        loading={false}
        onFileCaptured={onFileCaptured}
        onSearchResults={vi.fn()}
      />,
    );

    const video = document.querySelector("video")!;
    fireEvent.canPlay(video);
    fireEvent.click(screen.getByRole("button", { name: "Capture" }));

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    });

    expect(onFileCaptured).not.toHaveBeenCalled();
  });

  it.each([
    ["NotAllowedError", "Camera access was denied. Please allow camera permissions and try again."],
    ["NotFoundError", "No camera was found on this device."],
    ["NotReadableError", "Camera is in use by another app. Close other apps and try again."],
    ["SecurityError", "Camera requires a secure connection (HTTPS)."],
    ["UnknownError", "Could not access camera (UnknownError). Make sure no other app is using it."],
  ])("shows camera error for %s", async (name, expectedMessage) => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException("camera error", name)),
      },
    });

    render(
      <LiveCameraPanel
        authToken="token-123"
        error={null}
        loading={false}
        onFileCaptured={vi.fn()}
        onSearchResults={vi.fn()}
      />,
    );

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
  });

  it("handles cancelled and non-dom getUserMedia failures", async () => {
    let resolveStream = null as ((stream: MediaStream) => void) | null;
    const stop = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(
          () =>
            new Promise((resolve) => {
              resolveStream = resolve as (stream: MediaStream) => void;
            }),
        ),
      },
    });

    const { unmount } = render(
      <LiveCameraPanel
        authToken="token-123"
        error={null}
        loading={false}
        onFileCaptured={vi.fn()}
        onSearchResults={vi.fn()}
      />,
    );

    unmount();
    resolveStream?.({
      getTracks: () => [{ stop }],
    } as unknown as MediaStream);

    await waitFor(() => {
      expect(stop).toHaveBeenCalled();
    });

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("boom")),
      },
    });

    render(
      <LiveCameraPanel
        authToken="token-123"
        error={null}
        loading={false}
        onFileCaptured={vi.fn()}
        onSearchResults={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("Could not access camera. Make sure no other app is using it."),
    ).toBeInTheDocument();
  });
});
