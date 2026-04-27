import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAppraisal } from "./useAppraisal";
import { mockFetchResponse } from "../test/testUtils";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

describe("useAppraisal", () => {
  it("handles file input changes and stores appraisal results", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          processed_at: "2026-04-26T00:00:00Z",
          card: {
            name: "Pikachu",
            card_number: "25",
            language: "English",
          },
          image_url: "/pikachu.png",
          set_name: "Base Set",
          pricing: 15.5,
        },
      }) as never,
    );

    const { result } = renderHook(() => useAppraisal("token-123"));
    const file = new File(["image-bytes"], "pikachu.jpg", { type: "image/jpeg" });
    const event = {
      target: {
        files: [file],
        value: "pikachu.jpg",
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.handleFileChange(event);
    });

    await waitFor(() => {
      expect(result.current.result?.card.name).toBe("Pikachu");
    });

    expect(event.target.value).toBe("");
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = vi.mocked(fetch).mock.calls[0];
    expect(requestUrl).toBe("/api/scan/scan");
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.headers).toEqual({
      Authorization: "Bearer token-123",
    });
    expect(requestInit?.body).toBeInstanceOf(FormData);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.reportPreviewUrl).toBe("blob:mock-url");
    expect(result.current.error).toBeNull();
  });

  it("supports direct file submission and resets state", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          processed_at: "2026-04-26T00:00:00Z",
          card: {
            name: "Charizard",
            card_number: "4",
          },
          pricing: 200,
        },
      }) as never,
    );

    const { result } = renderHook(() => useAppraisal("token-123"));
    const file = new File(["camera-bytes"], "charizard.jpg", { type: "image/jpeg" });

    await act(async () => {
      result.current.handleFileDirect(file);
    });

    await waitFor(() => {
      expect(result.current.result?.card.name).toBe("Charizard");
    });

    act(() => {
      result.current.resetAppraisal();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.reportPreviewUrl).toBeNull();
  });

  it("surfaces authentication failures", async () => {
    const { result } = renderHook(() => useAppraisal(null));
    const file = new File(["image-bytes"], "mew.jpg", { type: "image/jpeg" });

    await act(async () => {
      result.current.handleFileDirect(file);
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Authentication required for appraisal.");
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("ignores empty file input changes", () => {
    const { result } = renderHook(() => useAppraisal("token-123"));
    const event = {
      target: {
        files: [],
        value: "empty.jpg",
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleFileChange(event);
    });

    expect(event.target.value).toBe("");
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.previewUrl).toBeNull();
  });

  it("surfaces failed scan responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 502, json: {} }) as never,
    );

    const { result } = renderHook(() => useAppraisal("token-123"));
    const file = new File(["image-bytes"], "mewtwo.jpg", { type: "image/jpeg" });

    await act(async () => {
      result.current.handleFileDirect(file);
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Scan failed with status 502");
    });

    expect(result.current.loading).toBe(false);
  });

  it("revokes replaced and cleaned up object urls", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockFetchResponse({
          json: {
            processed_at: "2026-04-26T00:00:00Z",
            card: { name: "Bulbasaur" },
            pricing: 3,
          },
        }) as never,
      )
      .mockResolvedValueOnce(
        mockFetchResponse({
          json: {
            processed_at: "2026-04-26T00:00:01Z",
            card: { name: "Ivysaur" },
            pricing: 6,
          },
        }) as never,
      );

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");

    const { result, unmount } = renderHook(() => useAppraisal("token-123"));
    const firstFile = new File(["one"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["two"], "second.jpg", { type: "image/jpeg" });

    await act(async () => {
      result.current.handleFileDirect(firstFile);
    });

    await waitFor(() => {
      expect(result.current.reportPreviewUrl).toBe("blob:first");
    });

    await act(async () => {
      result.current.handleFileDirect(secondFile);
    });

    await waitFor(() => {
      expect(result.current.reportPreviewUrl).toBe("blob:second");
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:second");
  });

  it("revokes previous previews for file changes and direct captures", async () => {
    const firstUpload = createDeferred<Response>();
    const secondUpload = createDeferred<Response>();
    const thirdUpload = createDeferred<Response>();
    vi.mocked(fetch)
      .mockReturnValueOnce(firstUpload.promise as never)
      .mockReturnValueOnce(secondUpload.promise as never)
      .mockReturnValueOnce(thirdUpload.promise as never);

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:file-one")
      .mockReturnValueOnce("blob:file-two")
      .mockReturnValueOnce("blob:direct");

    const { result } = renderHook(() => useAppraisal("token-123"));

    act(() => {
      result.current.handleFileChange({
        target: {
          files: [new File(["one"], "one.jpg", { type: "image/jpeg" })],
          value: "one.jpg",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleFileChange({
        target: {
          files: [new File(["two"], "two.jpg", { type: "image/jpeg" })],
          value: "two.jpg",
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleFileDirect(new File(["three"], "three.jpg", { type: "image/jpeg" }));
    });

    firstUpload.resolve(
      mockFetchResponse({
        json: {
          processed_at: "2026-04-26T00:00:00Z",
          card: { name: "Eevee" },
          pricing: 8,
        },
      }) as never,
    );
    secondUpload.resolve(
      mockFetchResponse({
        json: {
          processed_at: "2026-04-26T00:00:01Z",
          card: { name: "Vaporeon" },
          pricing: 12,
        },
      }) as never,
    );
    thirdUpload.resolve(
      mockFetchResponse({
        json: {
          processed_at: "2026-04-26T00:00:02Z",
          card: { name: "Jolteon" },
          pricing: 15,
        },
      }) as never,
    );

    await waitFor(() => {
      expect(result.current.result?.card.name).toBe("Jolteon");
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:file-one");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:file-two");
  });

  it("surfaces non-error failures with the fallback message", async () => {
    vi.mocked(fetch).mockRejectedValueOnce("boom" as never);

    const { result } = renderHook(() => useAppraisal("token-123"));

    await act(async () => {
      result.current.handleFileDirect(new File(["x"], "x.jpg", { type: "image/jpeg" }));
    });

    await waitFor(() => {
      expect(result.current.error).toBe("The scan request failed.");
    });
  });
});
