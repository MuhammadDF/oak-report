"""FastAPI dependencies for DB sessions and repository adapters."""

from __future__ import annotations

from typing import Annotated, TypeAlias

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from ..repositories.collection_repository import CollectionRepository
from ..repositories.factory import get_collection_repository, get_user_repository
from ..repositories.user_repository import UserRepository
from .session import get_session

SessionDI: TypeAlias = Annotated[AsyncSession, Depends(get_session)]


def get_collection_repository_dependency(session: SessionDI) -> CollectionRepository:
    return get_collection_repository(session)


CollectionRepositoryDI: TypeAlias = Annotated[
    CollectionRepository,
    Depends(get_collection_repository_dependency),
]


def get_user_repository_dependency(session: SessionDI) -> UserRepository:
    return get_user_repository(session)


UserRepositoryDI: TypeAlias = Annotated[
    UserRepository,
    Depends(get_user_repository_dependency),
]
