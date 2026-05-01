"""Administrative endpoints protected by role-based access control."""

"""
Placeholder for Alice Admin oversight APIs.

Coverage:
- Alice Admin user stories (system oversight, account recovery, feature toggles)
- FR-10 Admin Overrides (password resets, bad data flags)
- NFR-5 Security (future MFA gate)
- I-3 External API hooks for audit/monitoring feeds

Routes here will expose privileged operations guarded by RBAC/MFA once available.
"""

import os

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from ..auth.dependencies import require_admin
from ..auth.jwt_service import AuthTokenPayload
from ..db.dependencies import PricingCatalogRepositoryDI
from ..db.dependencies import UserRepositoryDI
from ..models.user_profile import UserRole
from ..services.admin_service import (
	AdminUserPage,
	AdminUserRecord,
	UpdateUserRoleInput,
	list_users_page,
	update_user_role,
)
from ..services.pricing_catalog_sync_service import get_pricing_catalog_sync_settings

router = APIRouter()
scheduler_bearer_scheme = HTTPBearer(auto_error=True)


class PricingCatalogStatusResponse(BaseModel):
	enabled: bool
	interval_seconds: int
	run_on_startup: bool
	row_count: int
	last_refreshed_at: str | None


class PricingCatalogRefreshResponse(BaseModel):
	rows_loaded: int


def _require_scheduler_identity(
	credentials: HTTPAuthorizationCredentials = Depends(scheduler_bearer_scheme),
) -> None:
	expected_email = os.getenv("PRICING_CATALOG_REFRESH_SERVICE_ACCOUNT_EMAIL")
	expected_audience = os.getenv("PRICING_CATALOG_REFRESH_AUDIENCE")
	if not expected_email or not expected_audience:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="Pricing catalog refresh identity is not configured.",
		)

	try:
		claims = id_token.verify_oauth2_token(
			credentials.credentials,
			google_requests.Request(),
			expected_audience,
		)
	except Exception as error:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid Cloud Scheduler token.",
		) from error

	if claims.get("email") != expected_email:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid Cloud Scheduler service account.",
		)


@router.get(
	"/pricing-catalog/status",
	response_model=PricingCatalogStatusResponse,
	summary="Get pricing catalog synchronization status",
	tags=["Admin - Pricing Catalog"],
)
async def get_pricing_catalog_status(
	repository: PricingCatalogRepositoryDI,
	current_user: AuthTokenPayload = Depends(require_admin()),
) -> PricingCatalogStatusResponse:
	_ = current_user
	settings = get_pricing_catalog_sync_settings()
	row_count = await repository.count_rows()
	last_refreshed_at = await repository.get_last_refreshed_at()

	return PricingCatalogStatusResponse(
		enabled=settings.enabled,
		interval_seconds=settings.interval_seconds,
		run_on_startup=settings.run_on_startup,
		row_count=row_count,
		last_refreshed_at=last_refreshed_at.isoformat() if last_refreshed_at else None,
	)


@router.post(
	"/pricing-catalog/refresh",
	response_model=PricingCatalogRefreshResponse,
	summary="Refresh the pricing catalog",
	tags=["Admin - Pricing Catalog"],
)
async def refresh_pricing_catalog_now(
	_: None = Depends(_require_scheduler_identity),
) -> PricingCatalogRefreshResponse:
	from ..main import _run_pricing_catalog_refresh_once

	result = await _run_pricing_catalog_refresh_once()
	return PricingCatalogRefreshResponse(rows_loaded=result.rows_loaded)


@router.get(
	"/users",
	response_model=AdminUserPage,
	summary="List users with pagination, search, and role filtering",
	tags=["Admin - Users"],
)
async def get_users(
	repository: UserRepositoryDI,
	page: int = Query(default=1, ge=1),
	page_size: int = Query(default=20, ge=1, le=100),
	search: str | None = Query(default=None, min_length=1),
	role: UserRole | None = Query(default=None),
	current_user: AuthTokenPayload = Depends(require_admin()),
) -> AdminUserPage:
	_ = current_user
	return await list_users_page(
		page=page,
		page_size=page_size,
		search=search,
		role=role,
		repository=repository,
	)


@router.patch(
	"/users/{user_id}/role",
	response_model=AdminUserRecord,
	summary="Update a user's role",
	tags=["Admin - Users"],
)
async def patch_user_role(
	user_id: str,
	payload: UpdateUserRoleInput,
	repository: UserRepositoryDI,
	current_user: AuthTokenPayload = Depends(require_admin()),
) -> AdminUserRecord:
	if current_user.sub == user_id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="You cannot change your own role.",
		)

	updated = await update_user_role(
		user_id=user_id,
		role=payload.role,
		repository=repository,
	)
	if updated is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="User not found.",
		)

	return updated
