import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminScreen } from "./AdminScreen";

const { mockListUsers, mockUpdateUserRole } = vi.hoisted(() => ({
  mockListUsers: vi.fn(),
  mockUpdateUserRole: vi.fn(),
}));

vi.mock("../repositories/adminRepository", () => ({
  getAdminRepository: () => ({
    listUsers: mockListUsers,
    updateUserRole: mockUpdateUserRole,
  }),
}));

const authUser = {
  id: "user-1",
  display_name: "Oak",
  email: "oak@example.com",
  role: "admin" as const,
};

describe("AdminScreen", () => {
  beforeEach(() => {
    mockListUsers.mockReset();
    mockUpdateUserRole.mockReset();
  });

  it("loads users, supports filters, ordering, pagination, and saving roles", async () => {
    mockListUsers.mockResolvedValue({
      items: [
        authUser,
        {
          id: "user-2",
          display_name: "Ash",
          email: "ash@example.com",
          role: "collector",
        },
      ],
      page: 1,
      page_size: 10,
      total: 11,
    });
    mockUpdateUserRole.mockResolvedValueOnce({
      id: "user-2",
      display_name: "Ash",
      email: "ash@example.com",
      role: "admin",
    });

    render(<AdminScreen authToken="token-123" authUser={authUser} />);

    await waitFor(() => {
      expect(screen.getByText("Ash")).toBeInTheDocument();
    });

    expect(screen.getAllByText("You")[0]).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search by name or email"), {
      target: { value: "ash" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "collector" },
    });

    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith("token-123", {
        page: 1,
        pageSize: 10,
        search: "ash",
        role: "collector",
      });
    });

    const ashRow = screen.getByText("Ash").closest("tr");
    expect(ashRow).not.toBeNull();
    fireEvent.change(within(ashRow as HTMLElement).getByRole("combobox"), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockUpdateUserRole).toHaveBeenCalledWith("token-123", "user-2", "admin");
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
  });

  it("handles missing auth and repository failures", async () => {
    const { rerender, unmount } = render(<AdminScreen authToken={null} authUser={authUser} />);
    expect(screen.getByText("No matching users found.")).toBeInTheDocument();

    mockListUsers.mockRejectedValueOnce(new Error("boom"));
    rerender(<AdminScreen authToken="token-123" authUser={authUser} />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load users.")).toBeInTheDocument();
    });

    unmount();

    mockListUsers.mockResolvedValueOnce({
      items: [
        {
          id: "user-2",
          display_name: "Ash",
          email: "ash@example.com",
          role: "collector",
        },
      ],
      page: 1,
      page_size: 10,
      total: 1,
    });
    mockUpdateUserRole.mockRejectedValueOnce(new Error("boom"));

    render(<AdminScreen authToken="token-123" authUser={authUser} />);

    await waitFor(() => {
      expect(screen.getByText("Ash")).toBeInTheDocument();
    });

    const ashRow = screen.getByText("Ash").closest("tr");
    expect(ashRow).not.toBeNull();
    fireEvent.change(within(ashRow as HTMLElement).getByRole("combobox"), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to save role update.")).toBeInTheDocument();
    });
  });

  it("orders users without a current-user context", async () => {
    mockListUsers.mockResolvedValueOnce({
      items: [
        {
          id: "user-2",
          display_name: "Ash",
          email: "ash@example.com",
          role: "collector",
        },
      ],
      page: 1,
      page_size: 10,
      total: 1,
    });

    render(<AdminScreen authToken="token-123" authUser={null} />);

    await waitFor(() => {
      expect(screen.getByText("Ash")).toBeInTheDocument();
    });
  });

  it("keeps the current user first and skips unchanged saves", async () => {
    mockListUsers.mockResolvedValueOnce({
      items: [
        {
          id: "user-2",
          display_name: "Ash",
          email: "ash@example.com",
          role: "collector",
        },
        authUser,
        {
          id: "user-3",
          display_name: "Misty",
          email: "misty@example.com",
          role: "collector",
        },
      ],
      page: 1,
      page_size: 10,
      total: 20,
    });
    mockListUsers.mockResolvedValueOnce({
      items: [
        authUser,
      ],
      page: 2,
      page_size: 10,
      total: 1,
    });

    render(<AdminScreen authToken="token-123" authUser={authUser} />);

    await waitFor(() => {
      expect(screen.getByText("Oak")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Oak")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    });
  });
});
