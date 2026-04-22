"""
Domain service placeholder for administrative oversight.

Scope:
- Alice Admin stories (system oversight, account recovery, feature toggles, user data visibility)
- FR-10 Admin Overrides for password resets and data corrections
- NFR-5 Security aspirations (MFA, audit logging)

This service will coordinate privileged data workflows, RBAC enforcement, and support tooling hooks.
"""



"""Admin domain service operations."""

from pydantic import BaseModel, Field

from ..models.user_profile import UserRole
from ..repositories.user_repository import UserRepository


class AdminUserRecord(BaseModel):
	id: str
	display_name: str
	email: str
	role: UserRole


class AdminUserPage(BaseModel):
	items: list[AdminUserRecord]
	page: int
	page_size: int
	total: int


class UpdateUserRoleInput(BaseModel):
	role: UserRole = Field(description="Target role for the selected user")


async def list_users_page(
	*,
	page: int,
	page_size: int,
	search: str | None,
	role: UserRole | None,
	repository: UserRepository,
) -> AdminUserPage:
	users, total = await repository.list_users(
		page=page,
		page_size=page_size,
		search=search,
		role=role.value if role else None,
	)
	return AdminUserPage(
		items=[
			AdminUserRecord(
				id=user.id,
				display_name=user.display_name,
				email=str(user.email),
				role=user.role,
			)
			for user in users
		],
		page=page,
		page_size=page_size,
		total=total,
	)


async def update_user_role(
	*,
	user_id: str,
	role: UserRole,
	repository: UserRepository,
) -> AdminUserRecord | None:
	updated = await repository.update_user_role(user_id=user_id, role=role)
	if updated is None:
		return None

	return AdminUserRecord(
		id=updated.id,
		display_name=updated.display_name,
		email=str(updated.email),
		role=updated.role,
	)
