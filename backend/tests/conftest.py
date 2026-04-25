from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path
import sys
from unittest.mock import MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.auth.dependencies import get_current_user
from backend.auth.jwt_service import AuthTokenPayload
from backend.db.dependencies import (
    get_collection_repository_dependency,
    get_pricing_catalog_repository_dependency,
    get_user_repository_dependency,
)
from backend.main import app


@pytest.fixture(autouse=True)
def override_auth_dependency() -> AsyncIterator[None]:
    def _mock_current_user() -> AuthTokenPayload:
        return AuthTokenPayload(
            sub="test-user",
            email="tester@example.com",
            display_name="Test User",
            role="admin",
            exp=4_102_444_800,
        )

    app.dependency_overrides[get_current_user] = _mock_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def repository_mocks() -> AsyncIterator[dict[str, MagicMock]]:
    user_repository = MagicMock(name="user_repository")
    collection_repository = MagicMock(name="collection_repository")
    pricing_repository = MagicMock(name="pricing_repository")

    app.dependency_overrides[get_user_repository_dependency] = lambda: user_repository
    app.dependency_overrides[get_collection_repository_dependency] = lambda: collection_repository
    app.dependency_overrides[get_pricing_catalog_repository_dependency] = lambda: pricing_repository

    yield {
        "user_repository": user_repository,
        "collection_repository": collection_repository,
        "pricing_repository": pricing_repository,
    }

    app.dependency_overrides.pop(get_user_repository_dependency, None)
    app.dependency_overrides.pop(get_collection_repository_dependency, None)
    app.dependency_overrides.pop(get_pricing_catalog_repository_dependency, None)


@pytest_asyncio.fixture
async def async_client(repository_mocks: dict[str, MagicMock]) -> AsyncIterator[AsyncClient]:
    _ = repository_mocks
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client