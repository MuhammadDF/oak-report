# Repository Injection Summary

This codebase uses explicit repository wiring instead of a dedicated IoC container.

## 1) FastAPI Dependency Injection (request-scoped)

Used for database-backed repositories in authenticated, collection, admin, and pricing catalog flows.

- `SessionDI` is defined with `Depends(get_session)` in `backend/db/dependencies.py`.
- Repository dependency providers call the factory with the current request session:
  - `get_collection_repository_dependency(...)`
  - `get_user_repository_dependency(...)`
  - `get_pricing_catalog_repository_dependency(...)`
- Route handlers request typed DI aliases:
  - `CollectionRepositoryDI` in `backend/api/collection_routes.py`
  - `UserRepositoryDI` in `backend/api/auth_routes.py`
  - `PricingCatalogRepositoryDI` in `backend/api/admin_routes.py`

Runtime flow:

1. HTTP request reaches route handler.
2. FastAPI resolves `Depends(...)`.
3. `get_session()` yields an `AsyncSession` for this request.
4. Factory builds a repository with that session.
5. Route passes repository into service functions.

## 2) Dormant Library Factory Wiring

The standalone library feature was scratched because appraise-page search covers the current card lookup workflow. Its code remains in the repo for possible future work, but it is not an active product surface.

- Search and scan no longer use repository mock adapters. Search uses pricing catalog lookup, and scan uses Gemini identity extraction plus pricing catalog lookup.
- Leftover library service code calls `get_library_repository()`.
- The factory stores the dormant library adapter in `_library_repo` and reuses it.

### "module-level instance"

A module-level instance is an object saved in a top-level variable in a Python file and reused later.

- In this project, `_library_repo` is defined once at file scope in `backend/repositories/factory.py`.
- On first call, `get_library_repository()` creates and stores the object.
- On later calls, it returns the same stored object.

This is singleton-like behavior per Python process (not globally across all processes).

## Why keep a factory at all?

The factory mainly helps with wiring and consistency:

- Centralized provider selection: one place maps `DATA_PROVIDER` to concrete classes.
- Centralized construction rules: one place enforces requirements like "session required".
- Cleaner service/route code: callers request an interface and avoid direct class construction details.
- Easier swapping in tests or future implementations: update wiring in one file, not many call sites.

Tradeoff: this adds an extra indirection layer, which can feel unnecessary if there is only one implementation and no switching need.

## Provider Selection

Provider selection is environment-driven:

- `DATA_PROVIDER` is read in `backend/repositories/factory.py` (`_provider_name()`).
- Database settings are read in `backend/db/config.py`.

Current behavior in `backend/repositories/factory.py`:

- Collection/User/Pricing catalog repositories:
  - Require `DATA_PROVIDER=postgres`.
  - Require an `AsyncSession` parameter.
  - Raise `ValueError` otherwise.
- Dormant library repository:
  - Returns `MockLibraryRepository` for `mock` or `postgres`.
  - Is retained only for possible future work.

## Practical Takeaway

- Auth, collection, admin user management, and pricing catalog paths are injected via FastAPI dependencies with per-request DB session scope.
- Search and scan are real service flows rather than mock repository lookups.
- Standalone library code is dormant; do not treat it as an active feature unless product scope explicitly reinstates it.
