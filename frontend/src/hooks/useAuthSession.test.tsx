import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthSession } from "./useAuthSession";
import type { Screen } from "../types/app";
import { mockFetchResponse } from "../test/testUtils";

// Minimal JWT-like tokens where the payload encodes the role, so getJwtRole()
// returns a matching role and the token-refresh branch is not triggered.
const TOKEN_COLLECTOR = "fake." + btoa('{"role":"collector"}') + ".sig";
const TOKEN_NA = "fake." + btoa('{"role":"na"}') + ".sig";

describe("useAuthSession", () => {
  const setScreen = vi.fn();

  beforeEach(() => {
    setScreen.mockReset();
    localStorage.clear();
  });

  it("boots without a token and keeps users on sign-in", async () => {
    const { result } = renderHook(() =>
      useAuthSession({ screen: "signin", setScreen }),
    );

    await waitFor(() => {
      expect(result.current.isAuthLoading).toBe(false);
    });

    expect(result.current.authToken).toBeNull();
    expect(result.current.authUser).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("restores a valid session from local storage", async () => {
    localStorage.setItem("oak_report_auth_token", TOKEN_COLLECTOR);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-1",
          email: "ash@example.com",
          display_name: "Ash",
          role: "collector",
        },
      }) as never,
    );

    const { result } = renderHook(() =>
      useAuthSession({ screen: "signin", setScreen }),
    );

    await waitFor(() => {
      expect(result.current.authUser?.display_name).toBe("Ash");
    });

    expect(fetch).toHaveBeenCalledWith("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${TOKEN_COLLECTOR}`,
      },
    });
    expect(setScreen).toHaveBeenCalledWith("profile");
  });

  it("clears invalid stored sessions", async () => {
    localStorage.setItem("oak_report_auth_token", "expired-token");
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 401, json: {} }) as never,
    );

    const { result } = renderHook(() =>
      useAuthSession({ screen: "profile", setScreen }),
    );

    await waitFor(() => {
      expect(result.current.isAuthLoading).toBe(false);
    });

    expect(result.current.authToken).toBeNull();
    expect(localStorage.getItem("oak_report_auth_token")).toBeNull();
    expect(setScreen).toHaveBeenCalledWith("signin");
  });

  it("handles successful credential exchange", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        mockFetchResponse({
          json: {
            access_token: TOKEN_NA,
            token_type: "bearer",
            user: {
              id: "user-1",
              email: "misty@example.com",
              display_name: "Misty",
              role: "na",
            },
          },
        }) as never,
      )
      .mockResolvedValueOnce(
        mockFetchResponse({
          json: {
            id: "user-1",
            email: "misty@example.com",
            display_name: "Misty",
            role: "na",
          },
        }) as never,
      );

    const { result } = renderHook(() =>
      useAuthSession({ screen: "signin", setScreen }),
    );

    await act(async () => {
      await result.current.handleCredentialReceived("google-id-token");
    });

    expect(fetch).toHaveBeenCalledWith("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_token: "google-id-token" }),
    });
    expect(localStorage.getItem("oak_report_auth_token")).toBe(TOKEN_NA);
    expect(setScreen).toHaveBeenCalledWith("access_required");
  });

  it("surfaces sign-in failures", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 500, json: {} }) as never,
    );

    const { result } = renderHook(() =>
      useAuthSession({ screen: "signin", setScreen }),
    );

    await act(async () => {
      await result.current.handleCredentialReceived("bad-token");
    });

    expect(result.current.authError).toBe(
      "Sign-in failed. Confirm backend auth configuration and retry.",
    );
    expect(result.current.isAuthSubmitting).toBe(false);
  });

  it("supports sign-out and guarded screen transitions", async () => {
    localStorage.setItem("oak_report_auth_token", TOKEN_COLLECTOR);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-1",
          email: "oak@example.com",
          display_name: "Oak",
          role: "collector",
        },
      }) as never,
    );

    const { result, rerender } = renderHook(
      ({ screen }) => useAuthSession({ screen, setScreen }),
      { initialProps: { screen: "admin" as Screen } },
    );

    await waitFor(() => {
      expect(result.current.authUser?.role).toBe("collector");
    });

    expect(setScreen).toHaveBeenCalledWith("profile");

    act(() => {
      result.current.handleScreenChange("library");
      result.current.handleScreenChange("signin");
    });

    expect(setScreen).toHaveBeenCalledWith("profile");

    rerender({ screen: "appraise" });
    act(() => {
      result.current.handleSignOut();
    });

    expect(localStorage.getItem("oak_report_auth_token")).toBeNull();
    expect(setScreen).toHaveBeenCalledWith("signin");
  });

  it("routes restricted and custom screen changes correctly", async () => {
    localStorage.setItem("oak_report_auth_token", TOKEN_NA);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-1",
          email: "misty@example.com",
          display_name: "Misty",
          role: "na",
        },
      }) as never,
    );

    const { result } = renderHook(() =>
      useAuthSession({ screen: "profile", setScreen }),
    );

    await waitFor(() => {
      expect(result.current.authUser?.role).toBe("na");
    });

    act(() => {
      result.current.handleScreenChange("collection");
      result.current.handleScreenChange("library");
      result.current.handleScreenChange("access_required");
    });

    expect(setScreen).toHaveBeenCalledWith("access_required");
  });

  it("redirects restricted initial screens for na users", async () => {
    localStorage.setItem("oak_report_auth_token", TOKEN_NA);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-1",
          email: "misty@example.com",
          display_name: "Misty",
          role: "na",
        },
      }) as never,
    );

    renderHook(() =>
      useAuthSession({ screen: "appraise", setScreen }),
    );

    await waitFor(() => {
      expect(setScreen).toHaveBeenCalledWith("access_required");
    });
  });

  it("redirects library and access-required screens based on role", async () => {
    localStorage.setItem("oak_report_auth_token", TOKEN_COLLECTOR);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-1",
          email: "ash@example.com",
          display_name: "Ash",
          role: "collector",
        },
      }) as never,
    );

    renderHook(() =>
      useAuthSession({ screen: "library", setScreen }),
    );

    await waitFor(() => {
      expect(setScreen).toHaveBeenCalledWith("profile");
    });

    localStorage.setItem("oak_report_auth_token", TOKEN_COLLECTOR);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-2",
          email: "gary@example.com",
          display_name: "Gary",
          role: "collector",
        },
      }) as never,
    );

    renderHook(() =>
      useAuthSession({ screen: "access_required", setScreen }),
    );

    await waitFor(() => {
      expect(setScreen).toHaveBeenCalledWith("profile");
    });
  });

  it("redirects collectors away from access-required on initial load", async () => {
    localStorage.setItem("oak_report_auth_token", TOKEN_COLLECTOR);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-1",
          email: "ash@example.com",
          display_name: "Ash",
          role: "collector",
        },
      }) as never,
    );

    renderHook(() =>
      useAuthSession({ screen: "access_required", setScreen }),
    );

    await waitFor(() => {
      expect(setScreen).toHaveBeenCalledWith("profile");
    });
  });

  it("guards unauthenticated and non-admin navigation", async () => {
    const { result, unmount } = renderHook(
      ({ screen }) => useAuthSession({ screen, setScreen }),
      { initialProps: { screen: "signin" as const } },
    );

    await waitFor(() => {
      expect(result.current.isAuthLoading).toBe(false);
    });

    act(() => {
      result.current.handleScreenChange("collection");
    });
    expect(setScreen).toHaveBeenCalledWith("signin");
    unmount();

    localStorage.setItem("oak_report_auth_token", TOKEN_COLLECTOR);
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          id: "user-2",
          email: "brock@example.com",
          display_name: "Brock",
          role: "collector",
        },
      }) as never,
    );

    const { result: authenticatedResult } = renderHook(
      ({ screen }) => useAuthSession({ screen, setScreen }),
      { initialProps: { screen: "profile" as const } },
    );

    await waitFor(() => {
      expect(authenticatedResult.current.authUser?.display_name).toBe("Brock");
    });

    act(() => {
      authenticatedResult.current.handleScreenChange("admin");
      authenticatedResult.current.handleScreenChange("profile");
    });

    expect(setScreen).toHaveBeenCalledWith("profile");
  });
});
