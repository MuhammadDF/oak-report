# Repository Injection Summary

This codebase uses two repository wiring patterns instead of a dedicated IoC container.

## 1) FastAPI Dependency Injection (request-scoped)

Used for database-backed repositories in authenticated/collection flows.

- `SessionDI` is defined with `Depends(get_session)` in `backend/db/dependencies.py`.
- Repository dependency providers call the factory with the current request session:
  - `get_collection_repository_dependency(...)`
  - `get_user_repository_dependency(...)`
- Route handlers request typed DI aliases:
  - `CollectionRepositoryDI` in `backend/api/collection_routes.py`
  - `UserRepositoryDI` in `backend/api/auth_routes.py`

Runtime flow:

1. HTTP request reaches route handler.
2. FastAPI resolves `Depends(...)`.
3. `get_session()` yields an `AsyncSession` for this request.
4. Factory builds a repository with that session.
5. Route passes repository into service functions.

## 2) Direct Factory Calls in Services (module-cached instances)

Used for scan/search/library flows.

- Services call factory functions directly:
  - `backend/services/search_service.py` -> `get_search_repository()`
  - `backend/services/library_service.py` -> `get_library_repository()`
  - `backend/services/scan_service.py` -> `get_scan_catalog_repository()`
- The factory stores these in module globals (`_search_repo`, `_library_repo`, `_scan_catalog_repo`) and reuses them.

### "module-level instance"

A module-level instance is an object saved in a top-level variable in a Python file and reused later.

- In this project, variables like `_search_repo` are defined once at file scope in `backend/repositories/factory.py`.
- On first call, `get_search_repository()` creates and stores the object.
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

- Collection/User repositories:
  - Require `DATA_PROVIDER=postgres`.
  - Require an `AsyncSession` parameter.
  - Raise `ValueError` otherwise.
- Search/Library/Scan repositories:
  - Return mock repository implementations.
  - This is true for both `mock` and `postgres` provider values right now.

## Practical Takeaway

- Auth and collection paths are injected via FastAPI dependencies with per-request DB session scope.
- Search, library, and scan paths are service-level factory lookups with cached mock adapters.
- If you want a single style across the app, the next step is typically to move search/library/scan to explicit FastAPI DI dependencies as well.
