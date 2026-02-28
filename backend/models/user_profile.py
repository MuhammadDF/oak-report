"""Pydantic schema describing user identities and feature access controls."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
	"""Supported role identifiers."""

	COLLECTOR = "collector"
	ADMIN = "admin"


class FeatureFlags(BaseModel):
	"""Feature toggles exposed through admin overrides."""

	memory_bank_enabled: bool = True
	proxy_check_enabled: bool = True
	instant_appraisal_enabled: bool = True
	library_search_enabled: bool = True
	admin_dashboard_enabled: bool = False
	bulk_scan_enabled: bool = False
	user_management_enabled: bool = False  # Allows viewing all user accounts
	account_disable_enabled: bool = False  # Allows disabling other users


class UserProfile(BaseModel):
	"""User record spanning authentication, recovery, and entitlement data."""

	id: str  # Stable identifier from the auth provider
	email: EmailStr
	display_name: str
	role: UserRole = UserRole.COLLECTOR
	created_at: datetime
	hashed_password: str  # Password hash (e.g., bcrypt) stored in the auth DB
	last_login_at: Optional[datetime] = None

	mfa_enabled: bool = False
	recovery_email: Optional[EmailStr] = None
	recovery_phone: Optional[str] = None

	feature_flags: FeatureFlags = Field(default_factory=FeatureFlags)
	disabled: bool = False
	notes: Optional[str] = None

