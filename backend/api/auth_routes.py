from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from ..auth.dependencies import get_current_user
from ..db.dependencies import UserRepositoryDI
from ..auth.google_auth import verify_google_id_token
from ..auth.jwt_service import AuthTokenPayload, issue_auth_token
from ..services.auth_service import get_user_by_id, upsert_google_user

router = APIRouter(tags=["Auth"])


class GoogleAuthRequest(BaseModel):
    id_token: str


class AuthenticatedUser(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    role: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthenticatedUser


@router.post(
    "/google",
    response_model=AuthTokenResponse,
    summary="Exchange a Google ID token for an application bearer token",
)
async def authenticate_with_google(
    payload: GoogleAuthRequest,
    user_repository: UserRepositoryDI,
) -> AuthTokenResponse:
    try:
        identity = verify_google_id_token(payload.id_token)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error

    user = await upsert_google_user(identity, user_repository)
    access_token = issue_auth_token(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role.value,
    )

    return AuthTokenResponse(
        access_token=access_token,
        user=AuthenticatedUser(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            role=user.role.value,
        ),
    )


@router.get("/me", response_model=AuthenticatedUser, summary="Get current authenticated user")
async def get_current_user_profile(
    user_repository: UserRepositoryDI,
    current_user: AuthTokenPayload = Depends(get_current_user),
) -> AuthenticatedUser:
    user = await get_user_by_id(current_user.sub, user_repository)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer available.",
        )

    return AuthenticatedUser(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role.value,
    )


@router.post("/token/refresh", response_model=AuthTokenResponse, summary="Re-issue a JWT with the current DB role")
async def refresh_token(
    user_repository: UserRepositoryDI,
    current_user: AuthTokenPayload = Depends(get_current_user),
) -> AuthTokenResponse:
    user = await get_user_by_id(current_user.sub, user_repository)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer available.",
        )
    access_token = issue_auth_token(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role.value,
    )
    return AuthTokenResponse(
        access_token=access_token,
        user=AuthenticatedUser(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            role=user.role.value,
        ),
    )


@router.post("/logout", summary="Client-side logout helper for stateless JWT flows")
async def logout() -> dict[str, str]:
    return {"message": "Logout is handled client-side by discarding the token."}
