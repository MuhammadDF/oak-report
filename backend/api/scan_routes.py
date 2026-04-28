from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..auth.dependencies import require_roles
from ..auth.jwt_service import AuthTokenPayload
from ..models.scan_result_model import ScanResultModel
from ..services.scan_service import identify_card_from_image

router = APIRouter()


@router.post(
	"/scan",
	response_model=ScanResultModel,
	summary="Scan a card image and return an appraisal",
	response_description="Normalized card identity details and pricing snapshot.",
)
async def scan_card(
	image: UploadFile = File(...),
	current_user: AuthTokenPayload = Depends(require_roles("collector", "admin")),
) -> ScanResultModel:
	_ = current_user
	allowed_types = {"image/jpeg", "image/png", "image/webp", "image/heic"}
	if image.content_type not in allowed_types:
		raise HTTPException(
			status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
			detail="Only JPEG, PNG, WebP, or HEIC images are supported.",
		)

	image_bytes = await image.read()
	if not image_bytes:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Uploaded image is empty.",
		)

	return await identify_card_from_image(image_bytes)
