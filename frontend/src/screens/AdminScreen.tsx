import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { getAdminRepository } from "../repositories/adminRepository";
import { AdminUserRecord, AppRole, AuthUser } from "../types/app";

const adminRepository = getAdminRepository();
const PAGE_SIZE = 10;

type AdminScreenProps = {
  authToken: string | null;
  authUser: AuthUser | null;
};

export function AdminScreen({ authToken, authUser }: AdminScreenProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "">("");
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, AppRole>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authToken) {
      setUsers([]);
      setTotal(0);
      return;
    }

    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const payload = await adminRepository.listUsers(authToken, {
          page,
          pageSize: PAGE_SIZE,
          search: searchInput,
          role: roleFilter,
        });
        if (!cancelled) {
          setUsers(payload.items);
          setTotal(payload.total);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load users.");
          setUsers([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [authToken, page, roleFilter, searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const orderedUsers = useMemo(() => {
    const currentUserId = authUser?.id;

    return [...users].sort((left, right) => {
      if (left.id === currentUserId && right.id !== currentUserId) {
        return -1;
      }

      if (right.id === currentUserId && left.id !== currentUserId) {
        return 1;
      }

      return 0;
    });
  }, [authUser?.id, users]);

  function handleRoleFilterChange(nextRole: AppRole | "") {
    setRoleFilter(nextRole);
    setPage(1);
  }

  function getEffectiveRole(user: AdminUserRecord): AppRole {
    return pendingRoles[user.id] ?? user.role;
  }

  function isCurrentUser(userId: string): boolean {
    return authUser?.id === userId;
  }

  async function handleRoleChange(user: AdminUserRecord, nextRole: AppRole) {
    setPendingRoles((current) => ({ ...current, [user.id]: nextRole }));
    setSavingIds((current) => ({ ...current, [user.id]: true }));
    setError(null);

    try {
      const updated = await adminRepository.updateUserRole(authToken!, user.id, nextRole);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setPendingRoles((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
    } catch {
      setError("Failed to save role update.");
      setPendingRoles((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
    } finally {
      setSavingIds((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
    }
  }

  return (
    <section className="screen admin-screen">
      <ScreenHeader
        eyebrow="Admin"
        title="User Access Control"
        description="Search by user name or email, filter by role, and update access roles."
      />

      <article className="panel admin-panel">
        <div className="admin-controls">
          <input
            className="admin-input"
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            type="search"
            value={searchInput}
          />
          <select
            className="admin-select"
            onChange={(event) => handleRoleFilterChange(event.target.value as AppRole | "")}
            value={roleFilter}
          >
            <option value="">All roles</option>
            <option value="na">NA</option>
            <option value="collector">Collector</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <div className="admin-table-wrap" role="region" aria-label="Users">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>Loading users...</td>
                </tr>
              ) : null}
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={3}>No matching users found.</td>
                </tr>
              ) : null}
              {!loading
                ? orderedUsers.map((user) => {
                    const isSaving = Boolean(savingIds[user.id]);
                    const currentUser = isCurrentUser(user.id);

                    return (
                      <tr key={user.id} className="admin-user-row">
                        <td data-label="Name">
                          <div className="admin-user-name">
                            <span>{user.display_name}</span>
                            {currentUser ? <span className="admin-me-badge">You</span> : null}
                          </div>
                        </td>
                        <td data-label="Email">{user.email}</td>
                        <td data-label="Role">
                          <select
                            className="admin-select admin-role-select"
                            disabled={isSaving || currentUser}
                            aria-disabled={currentUser}
                            title={currentUser ? "You cannot change your own role." : undefined}
                            onChange={(event) => {
                              void handleRoleChange(user, event.target.value as AppRole);
                            }}
                            value={getEffectiveRole(user)}
                          >
                            <option value="na">NA</option>
                            <option value="collector">Collector</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <button
            className="secondary-button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            Previous
          </button>
          <p>
            Page {page} of {totalPages}
          </p>
          <button
            className="secondary-button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </article>
    </section>
  );
}
