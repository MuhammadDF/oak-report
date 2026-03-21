"""
Placeholder for collection and library endpoints spanning Cal Collector flows.

Coverage:
- FR-3 Personal Collection CRUD with condition tracking
- FR-4 Searchable Library for cards not yet scanned
- FR-7 Memory Bank pricing trends per scan
- I-1 Mobile GUI data endpoints feeding Dashboard + Library views

Routes added here will simply collect HTTP concerns (auth, pagination, filtering)
before delegating to the underlying services.
"""
from fastapi import APIRouter

router = APIRouter()