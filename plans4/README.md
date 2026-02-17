# Plans4 - UI Enhancement Implementation

This folder contains implementation plans for two UI enhancements:

## Tasks Overview

| Task | Description | Priority |
|------|-------------|----------|
| Task 1 | Job Detail Modal - Click job row to show full details | High |
| Task 2 | Preserve filters when switching tabs | Medium |

## Files

- [`task1-job-detail-modal.md`](./task1-job-detail-modal.md) - Complete implementation plan for job detail modal
- [`task2-preserve-filters.md`](./task2-preserve-filters.md) - Implementation plan for filter persistence

## Implementation Order

1. **Task 1** should be implemented first as it adds significant user value
2. **Task 2** is a quick fix that can be done after Task 1

## Current State Analysis

### What We Have
- Backend already returns `description` field via [`/jobs/{job_id}`](../backend/routes/jobs.py:67) endpoint
- Existing modal patterns in [`SettingsModal.tsx`](../frontend/components/SettingsModal.tsx) and [`ClearConfirmModal.tsx`](../frontend/components/ClearConfirmModal.tsx)
- Focus trap hook in [`useFocusTrap.ts`](../frontend/hooks/useFocusTrap.ts)
- Job card component in [`JobCard.tsx`](../frontend/components/JobCard.tsx)

### What We Need
- Add `description` to frontend `JobRow` type
- Create new `JobDetailModal` component
- Update `JobCard` to trigger modal on click
- Store filter state per tab instead of globally
