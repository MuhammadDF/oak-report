"""Scan orchestration for the first appraisal vertical slice."""

from datetime import datetime, timezone
import hashlib

from ..models.card_model import CardCondition
from ..models.scan_result_model import ScanResultModel
from ..repositories.factory import get_scan_catalog_repository
from .pricing_service import get_pricing_snapshot


async def identify_card_from_image(image_bytes: bytes) -> ScanResultModel:
    """Analyze an uploaded image and return an appraisal payload."""

    catalog_repo = get_scan_catalog_repository()
    card = await catalog_repo.select_card_identity(image_bytes)
    pricing = await get_pricing_snapshot(card)

    return ScanResultModel(
        scan_id=_build_scan_id(image_bytes),
        processed_at=datetime.now(timezone.utc),
        card=card,
        condition=CardCondition(condition_label="Near Mint"),
        pricing=pricing,
    )


def _build_scan_id(image_bytes: bytes) -> str:
    digest = hashlib.sha256(image_bytes).hexdigest()[:12]
    return f"scan-{digest}"
