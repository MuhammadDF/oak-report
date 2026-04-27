import { vi } from "vitest";

type MockJsonResponse<T> = {
  ok?: boolean;
  status?: number;
  json: T;
};

export function mockFetchJson<T>({
  ok = true,
  status = ok ? 200 : 500,
  json,
}: MockJsonResponse<T>) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(json),
  });
}

export function mockFetchResponse<T>({
  ok = true,
  status = ok ? 200 : 500,
  json,
}: MockJsonResponse<T>) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(json),
  };
}
