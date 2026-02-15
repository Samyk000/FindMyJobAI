# Plan 2: Codebase Audit & Refactoring

## Executive Summary

This plan addresses architectural issues, code quality problems, and edge cases across the entire FindMyJob codebase. The app is functional but has significant technical debt that needs to be addressed before production deployment.

**Current State Verification:**
- ✅ App is functional end-to-end
- ✅ Frontend recently refactored (~2000 → ~470 lines, 11 components)
- ❌ Backend is 770+ line monolith
- ❌ Duplicate handling broken (saves duplicates instead of skipping)
- ❌ No structured error handling
- ❌ README outdated (mentions Selenium, but uses python-jobspy)

---

## Audit Results

### Critical Issues

| # | Issue | File:Line | Severity |
|---|-------|-----------|----------|
| 1 | Duplicate handling saves duplicate jobs instead of skipping | `backend/main.py:608-650` | Critical |
| 2 | CORS allows all origins - security risk | `backend/main.py:92-97` | Critical |
| 3 | No rate limiting on expensive endpoints | `backend/main.py` | Critical |
| 4 | Backend monolith - all code in one file | `backend/main.py` (770 lines) | High |

### Important Issues

| # | Issue | File:Line | Severity |
|---|-------|-----------|----------|
| 5 | No database indexes on frequently queried columns | `backend/main.py:31-47` | High |
| 6 | No created_at/updated_at timestamps on models | `backend/main.py:31-64` | High |
| 7 | No centralized API client on frontend | `frontend/lib/utils.ts` | High |
| 8 | Inconsistent API response format | `backend/main.py` (various) | High |
| 9 | No input sanitization for job descriptions | `backend/main.py:608-650` | High |
| 10 | README mentions Selenium instead of python-jobspy | `README.md:24,47,83` | Medium |

### Minor Issues

| # | Issue | File:Line | Severity |
|---|-------|-----------|----------|
| 11 | console.error used instead of proper logging | `frontend/lib/utils.ts:17,26,48,58` | Low |
| 12 | Duplicate type definition in JobCard.tsx | `frontend/components/JobCard.tsx:20-33` | Low |
| 13 | No URL normalization for duplicate detection | `backend/main.py:613` | Medium |
| 14 | No debouncing on rapid button clicks | `frontend/app/page.tsx` | Low |
| 15 | Empty state not user-friendly | `frontend/components/EmptyState.tsx` | Low |

---

## Phase 1: Audit & Plan (Current)

**Status:** In Progress

**Deliverables:**
- [x] Analyze all files in the project
- [x] Identify issues categorized by severity
- [x] Document exact files and line numbers
- [x] Create phase breakdown with scope
- [ ] Get user approval on plan

---

## Phase 2: Backend Architecture - Split the Monolith

**Goal:** Split `backend/main.py` into proper modules without breaking any functionality.

### Target Structure

```
backend/
├── main.py              # App initialization, CORS, middleware, router includes ONLY
├── config.py            # Configuration, environment variables, constants
├── database.py          # Database engine, session management, Base
├── models.py            # SQLAlchemy ORM models (JobDB, SettingsDB)
├── schemas.py           # Pydantic request/response models
├── routes/
│   ├── __init__.py
│   ├── jobs.py          # Job CRUD endpoints
│   ├── search.py        # Search and scrape endpoints
│   └── settings.py      # Settings endpoints
├── services/
│   ├── __init__.py
│   ├── scraper.py       # python-jobspy wrapper
│   ├── pipeline.py      # PipelineManager class
│   └── job_service.py   # Business logic (save, duplicate check, status)
└── utils/
    ├── __init__.py
    └── helpers.py       # Shared utility functions
```

### Changes

- [ ] Create `backend/config.py` with all configuration
- [ ] Create `backend/database.py` with engine and session
- [ ] Create `backend/models.py` with JobDB, SettingsDB
- [ ] Create `backend/schemas.py` with all Pydantic models
- [ ] Create `backend/services/pipeline.py` with PipelineManager
- [ ] Create `backend/services/job_service.py` with business logic
- [ ] Create `backend/services/scraper.py` with scraper wrapper
- [ ] Create `backend/routes/jobs.py` with job CRUD
- [ ] Create `backend/routes/search.py` with search endpoints
- [ ] Create `backend/routes/settings.py` with settings endpoints
- [ ] Create `backend/utils/helpers.py` with utilities
- [ ] Update `backend/main.py` to only include app setup and router imports
- [ ] Verify all API endpoints still work

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `backend/main.py` | Rewrite | Reduce to ~50 lines (app setup only) |
| `backend/config.py` | Create | New file |
| `backend/database.py` | Create | New file |
| `backend/models.py` | Create | New file |
| `backend/schemas.py` | Create | New file |
| `backend/routes/*.py` | Create | 3 new files |
| `backend/services/*.py` | Create | 3 new files |
| `backend/utils/*.py` | Create | 1 new file |

### Edge Cases Handled

- Circular imports: Use explicit imports, avoid cross-module dependencies
- Existing database: Migration continues to work
- API paths: All endpoints remain exactly the same

### Verification

1. Run `python -m uvicorn main:app --reload`
2. Test each endpoint with curl/Postman
3. Run frontend and verify all functionality works

---

## Phase 3: Fix Duplicate Handling ✅

**Goal:** Skip duplicates at save time instead of marking them.

**Status:** Completed

### Previous Broken Behavior

```
Search 1: Job A found → saved (is_duplicate=False)
Search 2: Job A found → saved AGAIN (is_duplicate=True)
Result: 2 rows for same job, UI cluttered
```

### New Behavior

```
Search 1: Job A found → saved
Search 2: Job A found → SKIPPED (not saved)
Result: 1 row per unique job
```

### Changes Completed

#### Backend

- [x] Remove `is_duplicate` column from `JobDB` model
- [x] Update `save_job_callback` to skip if URL exists
- [x] Add URL normalization before duplicate check:
  - Strip trailing slashes
  - Remove tracking params (utm_*, ref, source)
  - Convert to lowercase
- [x] Remove `is_duplicate` from all Pydantic schemas
- [x] Remove `is_duplicate` from API responses
- [x] Handle edge case: null/empty URL → save anyway
- [x] Create migration script to drop `is_duplicate` column

#### Frontend

- [x] Remove `is_duplicate` from `frontend/types/index.ts`
- [x] Remove duplicate badge from `frontend/components/JobCard.tsx`
- [x] Remove duplicate type definition from JobCard.tsx (use central types)

### Files Modified

| File | Action |
|------|--------|
| `backend/models.py` | Removed is_duplicate column |
| `backend/schemas.py` | Removed is_duplicate from schemas |
| `backend/services/job_service.py` | Added URL normalization, skip duplicates |
| `backend/services/scraper.py` | Updated to skip duplicates |
| `backend/routes/jobs.py` | Removed is_duplicate from responses |
| `backend/utils/helpers.py` | Added normalize_job_url function |
| `backend/database.py` | Removed is_duplicate migration |
| `backend/migrate_remove_is_duplicate.py` | Created migration script |
| `frontend/types/index.ts` | Removed is_duplicate field |
| `frontend/components/JobCard.tsx` | Removed duplicate badge, use central types |

### Edge Cases Handled

| Edge Case | Solution |
|-----------|----------|
| Same URL, different search queries | Skip - it's the same job |
| Null/empty URL | Save anyway (can't dedupe) |
| URL with trailing slashes | Normalize before comparison |
| URL with tracking params | Strip utm_*, ref, source params |
| URL case differences | Compare lowercase |

### Verification

- [x] Backend imports work correctly
- [x] Frontend builds successfully
- [x] URL normalization tested (tracking params removed)

---

## Phase 4: Comprehensive Error Handling

### Backend Error Handling

#### 4.1 Global Exception Handler

- [ ] Create `backend/utils/exceptions.py` with custom exceptions
- [ ] Add global exception handler in `main.py`
- [ ] Return consistent error format: `{ "success": false, "error": "...", "detail": "..." }`

#### 4.2 Scraping Errors

- [ ] Wrap jobspy calls in try/except per platform
- [ ] Handle network timeout → log, continue with other platforms
- [ ] Handle empty results → return empty list with message
- [ ] Handle malformed data → use defaults for missing fields
- [ ] All platforms fail → return error with clear message

#### 4.3 Database Errors

- [ ] Add retry logic for SQLite locked (max 3 retries, exponential backoff)
- [ ] Handle write failure → log, return 500
- [ ] Handle read failure → log, return 500

#### 4.4 Input Validation

- [ ] Empty search title → 400 "Job title is required"
- [ ] Empty search location → 400 "Location is required"
- [ ] Title/location too long (>200 chars) → 400
- [ ] Invalid job ID → 404 "Job not found"
- [ ] Invalid status value → 400 with allowed values
- [ ] Negative pagination → 400
- [ ] Non-existent batch_id → 404

### Frontend Error Handling

#### 4.5 Centralized API Client

- [ ] Create `frontend/lib/api.ts` with ApiClient class
- [ ] Add timeout handling (30s default, 120s for search)
- [ ] Add response parsing with proper types
- [ ] Add error normalization

#### 4.6 Error Display

- [ ] API unreachable → "Cannot connect to server" banner
- [ ] API 500 → "Something went wrong, please try again"
- [ ] API 400 → Show specific validation message
- [ ] API 404 → "Not found" message
- [ ] Timeout → "Request timed out" with retry button
- [ ] Empty results → Friendly "No jobs found" with suggestions

#### 4.7 UI Edge Cases

- [ ] Search while running → Disable button, show "Search in progress"
- [ ] Rapid save/reject clicks → Debounce or disable until response
- [ ] Browser close during search → Backend continues, frontend recovers on reload

#### 4.8 localStorage Edge Cases

- [ ] localStorage unavailable → Use in-memory fallback
- [ ] Corrupted data → Catch JSON.parse errors, reset to defaults
- [ ] SSR mismatch → Use useEffect for localStorage reads

### Files Modified

| File | Action |
|------|--------|
| `backend/utils/exceptions.py` | Create |
| `backend/main.py` | Add global exception handler |
| `backend/services/scraper.py` | Add error handling |
| `backend/routes/*.py` | Add input validation |
| `frontend/lib/api.ts` | Create API client |
| `frontend/lib/utils.ts` | Update error handling |
| `frontend/components/ErrorToast.tsx` | Enhance error display |
| `frontend/components/EmptyState.tsx` | Improve empty state |

---

## Phase 5: Frontend Code Quality

### 5.1 URL Normalization Utility

- [ ] Add `normalizeJobUrl()` to `frontend/lib/utils.ts`

### 5.2 Constants Audit

- [ ] Move all magic strings to `frontend/lib/constants.ts`
- [ ] Move all magic numbers to constants
- [ ] Use `NEXT_PUBLIC_API_URL` environment variable

### 5.3 Type Safety Audit

- [ ] Remove all `any` types
- [ ] Type all API responses
- [ ] Type all component props with interfaces
- [ ] Type all event handlers
- [ ] Add explicit types where inference isn't obvious

### 5.4 Component Audit

- [ ] Every component handles loading state
- [ ] Every component handles error state
- [ ] Every component handles empty state
- [ ] Remove all console.log statements
- [ ] Add cleanup functions to useEffect hooks
- [ ] Fix useEffect dependency arrays

### 5.5 Accessibility Basics

- [ ] All buttons have aria-labels or visible text
- [ ] All icons have alt text or aria-hidden
- [ ] All interactive elements keyboard accessible
- [ ] Form inputs have labels

### Files Modified

| File | Action |
|------|--------|
| `frontend/lib/utils.ts` | Add URL normalization |
| `frontend/lib/constants.ts` | Add missing constants |
| `frontend/types/index.ts` | Ensure complete types |
| `frontend/components/*.tsx` | Type and accessibility fixes |
| `frontend/app/page.tsx` | Remove console.log, fix deps |

---

## Phase 6: Backend Code Quality

### 6.1 Logging

- [ ] Replace all print() with logging module
- [ ] Use appropriate levels: DEBUG, INFO, WARNING, ERROR
- [ ] Format: `timestamp | level | module | message`
- [ ] Log every API request (method, path, status, duration)
- [ ] Log every scrape operation (platform, query, count, duration)

### 6.2 Configuration Management

- [ ] Use Pydantic BaseSettings in `config.py`
- [ ] Environment variables with defaults
- [ ] No hardcoded values in business logic

### 6.3 Database Best Practices

- [ ] Use context managers for DB sessions
- [ ] Proper session cleanup on error
- [ ] Add indexes on: `job_url`, `status`, `batch_id`, `source_site`
- [ ] Add `created_at` and `updated_at` to all models

### 6.4 API Response Consistency

- [ ] All endpoints return same structure
- [ ] Success: `{ "success": true, "data": ..., "message": "..." }`
- [ ] Error: `{ "success": false, "error": "...", "detail": "..." }`
- [ ] List endpoints: `{ "success": true, "data": [...], "total": 42 }`

### 6.5 Security Basics

- [ ] CORS: Restrict origins (not wildcard)
- [ ] Rate limiting: Max 5 searches per minute
- [ ] Input sanitization: Strip HTML from descriptions
- [ ] SQL injection: Verify parameterized queries

### 6.6 Scraping Resilience

- [ ] Configurable delay between batches
- [ ] Retry logic for transient failures
- [ ] Timeout for individual operations
- [ ] Graceful handling when platform is down

### Files Modified

| File | Action |
|------|--------|
| `backend/config.py` | Use Pydantic BaseSettings |
| `backend/database.py` | Add indexes, context managers |
| `backend/models.py` | Add timestamps |
| `backend/routes/*.py` | Consistent responses |
| `backend/services/*.py` | Logging, error handling |
| `backend/main.py` | CORS config, rate limiting |

---

## Phase 7: README & Documentation Update

### 7.1 README Updates

- [ ] Remove Selenium from tech stack
- [ ] Add python-jobspy to tech stack
- [ ] Remove Chrome browser requirement
- [ ] Remove CHROME_PROFILE_PATH from environment variables
- [ ] Update project structure to reflect new backend
- [ ] Update API endpoints table
- [ ] Add troubleshooting section

### 7.2 Inline Documentation

- [ ] Add docstrings to all Python functions
- [ ] Add JSDoc to complex TypeScript functions
- [ ] No over-documentation of obvious code

### Files Modified

| File | Action |
|------|--------|
| `README.md` | Complete rewrite of outdated sections |
| `backend/*.py` | Add docstrings |
| `frontend/lib/*.ts` | Add JSDoc where needed |

---

## Summary of Changes

### Files Count

| Category | Count |
|----------|-------|
| Files modified | ~20 |
| Files created | ~12 |
| Files deleted | 0 |

### Line Count Estimates

| File | Before | After |
|------|--------|-------|
| `backend/main.py` | 770 | ~50 |
| `backend/` total | 800 | ~1200 (better organized) |
| `frontend/` total | ~3000 | ~3100 |

### Edge Cases Handled

- Duplicate URL detection with normalization
- Null/empty job URLs
- Network timeouts and failures
- Database locked scenarios
- Invalid user input
- Missing localStorage
- Rapid button clicks
- Empty search results
- Platform-specific scraping failures

### Remaining Known Issues

- No automated tests (out of scope)
- No Docker setup (out of scope)
- No CI/CD pipeline (out of scope)

### Future Recommendations

1. Add unit tests for services
2. Add integration tests for API
3. Add E2E tests for critical flows
4. Set up Docker for easier deployment
5. Add CI/CD pipeline
6. Consider PostgreSQL for production

---

## Risk Assessment

| Phase | Risk Level | Mitigation |
|-------|------------|------------|
| Phase 2 | Medium | Test each endpoint after split |
| Phase 3 | Low | Simple logic change, easy to verify |
| Phase 4 | Medium | Many files touched, test thoroughly |
| Phase 5 | Low | Frontend-only, no API changes |
| Phase 6 | Medium | Database changes, backup first |
| Phase 7 | Low | Documentation only |

---

## Global Rules (Apply to ALL Phases)

1. **DO NOT** add tests, Docker, or CI/CD — out of scope
2. **DO NOT** change the core functionality or features
3. **DO NOT** add new features
4. **DO NOT** change the UI design/layout
5. **DO NOT** upgrade major dependencies
6. **DO NOT** push to GitHub until explicitly asked by the user ⚠️
7. **DO** preserve all existing API endpoint paths and response shapes
8. **DO** ensure the app runs successfully after EACH phase
9. **DO** document every change in plan2.md as you complete each phase
10. **DO** handle EVERY edge case mentioned above
11. **DO** follow DRY principle — if you see repeated code, extract it
12. **DO** follow consistent naming conventions:
    - Python: snake_case for functions/variables, PascalCase for classes
    - TypeScript: camelCase for functions/variables, PascalCase for components/types

---

## Execution Order

1. **Phase 2** - Backend split (foundation for all other changes)
2. **Phase 3** - Duplicate handling (fixes critical bug)
3. **Phase 4** - Error handling (improves reliability)
4. **Phase 5** - Frontend quality (polish)
5. **Phase 6** - Backend quality (polish)
6. **Phase 7** - Documentation (cleanup)

Each phase is designed to be completed independently without breaking the app. After each phase, the app must be fully functional before proceeding to the next.
