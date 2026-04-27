from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scan_route_rejects_unsupported_media_type(async_client: AsyncClient) -> None:
    response = await async_client.post(
        "/api/scan/scan",
        files={"image": ("card.txt", b"raw-bytes", "text/plain")},
    )

    assert response.status_code == 415
    assert response.json()["detail"] == "Only JPEG, PNG, WebP, or HEIC images are supported."


@pytest.mark.asyncio
async def test_scan_route_rejects_empty_image(async_client: AsyncClient) -> None:
    response = await async_client.post(
        "/api/scan/scan",
        files={"image": ("card.png", b"", "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded image is empty."


@pytest.mark.asyncio
async def test_scan_route_success_returns_scan_result(async_client: AsyncClient) -> None:
    async def _mock_identify_card_from_image(image_bytes: bytes):
        _ = image_bytes
        return {
            "processed_at": datetime(2026, 4, 25, 0, 0, 0, tzinfo=UTC),
            "card": {
                "name": "Charizard",
                "card_number": "4",
                "language": "English",
            },
            "pricing": 249.99,
            "image_url": "https://example.com/cards/charizard.jpg",
            "set_name": "Base Set",
        }

    mock_identify_card_from_image = MagicMock(side_effect=_mock_identify_card_from_image)

    with patch(
        "backend.api.scan_routes.identify_card_from_image",
        new=mock_identify_card_from_image,
    ):
        response = await async_client.post(
            "/api/scan/scan",
            files={"image": ("card.png", b"image-bytes", "image/png")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["card"]["name"] == "Charizard"
    assert isinstance(body["pricing"], float)
    mock_identify_card_from_image.assert_called_once_with(b"image-bytes")