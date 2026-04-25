import { API_BASE_URL } from "../constants/api";
import { AdminUserPage, AdminUserRecord, AppRole } from "../types/app";

export type ListAdminUsersParams = {
  page: number;
  pageSize: number;
  search?: string;
  role?: AppRole | "";
};

export type AdminRepository = {
  listUsers: (
    authToken: string | null,
    params: ListAdminUsersParams,
  ) => Promise<AdminUserPage>;
  updateUserRole: (
    authToken: string | null,
    userId: string,
    role: AppRole,
  ) => Promise<AdminUserRecord>;
};

const apiAdminRepository: AdminRepository = {
  async listUsers(authToken, params) {
    if (!authToken) {
      throw new Error("Authentication required.");
    }

    const query = new URLSearchParams();
    query.set("page", String(params.page));
    query.set("page_size", String(params.pageSize));
    if (params.search?.trim()) {
      query.set("search", params.search.trim());
    }
    if (params.role) {
      query.set("role", params.role);
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/users?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load admin users.");
    }

    return (await response.json()) as AdminUserPage;
  },

  async updateUserRole(authToken, userId, role) {
    if (!authToken) {
      throw new Error("Authentication required.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update user role.");
    }

    return (await response.json()) as AdminUserRecord;
  },
};

export function getAdminRepository(): AdminRepository {
  return apiAdminRepository;
}
