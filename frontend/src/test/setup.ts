import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

const createObjectURLMock = vi.fn(() => "blob:mock-url");
const revokeObjectURLMock = vi.fn();
const fetchMock = vi.fn();
const matchMediaListeners = new Map<
  string,
  Set<(event: MediaQueryListEvent) => void>
>();

vi.stubGlobal("fetch", fetchMock);
vi.stubGlobal("URL", {
  ...URL,
  createObjectURL: createObjectURLMock,
  revokeObjectURL: revokeObjectURLMock,
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => {
    const listeners = matchMediaListeners.get(query) ?? new Set();
    matchMediaListeners.set(query, listeners);

    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      }),
      removeEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      }),
      addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      }),
      removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      }),
      dispatchEvent: vi.fn(),
    };
  }),
});

beforeEach(() => {
  fetchMock.mockReset();
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
  matchMediaListeners.clear();
  window.google = {
    accounts: {
      id: {
        initialize: vi.fn(),
        renderButton: vi.fn(),
        prompt: vi.fn(),
      },
    },
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
