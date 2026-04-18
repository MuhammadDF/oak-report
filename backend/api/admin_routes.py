"""
Placeholder for Alice Admin oversight APIs.

Coverage:
- Alice Admin user stories (system oversight, account recovery, feature toggles)
- FR-10 Admin Overrides (password resets, bad data flags)
- NFR-5 Security (future MFA gate)
- I-3 External API hooks for audit/monitoring feeds

Routes here will expose privileged operations guarded by RBAC/MFA once available.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from ..db.dependencies import PricingCatalogRepositoryDI
from ..services.pricing_catalog_sync_service import get_pricing_catalog_sync_settings

router = APIRouter()


class PricingCatalogStatusResponse(BaseModel):
	enabled: bool
	interval_seconds: int
	run_on_startup: bool
	row_count: int
	last_refreshed_at: str | None


@router.get(
	"/pricing-catalog/status",
	response_model=PricingCatalogStatusResponse,
	summary="Get pricing catalog synchronization status",
)
async def get_pricing_catalog_status(
	repository: PricingCatalogRepositoryDI,
) -> PricingCatalogStatusResponse:
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