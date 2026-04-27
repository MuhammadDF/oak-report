import { describe, expect, it, vi } from "vitest";
import { getAdminRepository } from "./adminRepository";
import { mockFetchResponse } from "../test/testUtils";

describe("adminRepository", () => {
  const repository = getAdminRepository();

  it("requires auth to list users", async () => {
    await expect(
      repository.listUsers(null, { page: 1, pageSize: 10 }),
    ).rejects.toThrow("Authentication required.");
  });

  it("builds query params for list requests", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: {
          items: [{ id: "user-1", display_name: "Ash", email: "ash@example.com", role: "collector" }],
          page: 2,
          page_size: 10,
          total: 11,
        },
      }) as never,
    );

    await repository.listUsers("token-123", {
      page: 2,
      pageSize: 10,
      search: " ash ",
      role: "collector",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/users?page=2&page_size=10&search=ash&role=collector",
      {
        headers: {
          Authorization: "Bearer token-123",
        },
      },
    );
  });

  it("throws on failed list responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 500, json: {} }) as never,
    );

    await expect(
      repository.listUsers("token-123", { page: 1, pageSize: 10 }),
    ).rejects.toThrow("Failed to load admin users.");
  });

  it("requires auth to update roles", async () => {
    await expect(
      repository.updateUserRole(null, "user-1", "admin"),
    ).rejects.toThrow("Authentication required.");
  });

  it("sends patch payloads for role updates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        json: { id: "user-1", display_name: "Ash", email: "ash@example.com", role: "admin" },
      }) as never,
    );

    const result = await repository.updateUserRole("token-123", "user-1", "admin");

    expect(fetch).toHaveBeenCalledWith("/api/admin/users/user-1/role", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-123",
      },
      body: JSON.stringify({ role: "admin" }),
    });
    expect(result.role).toBe("admin");
  });

  it("throws on failed role updates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ ok: false, status: 409, json: {} }) as never,
    );

    await expect(
      repository.updateUserRole("token-123", "user-1", "collector"),
    ).rejects.toThrow("Failed to update user role.");
  });
});
