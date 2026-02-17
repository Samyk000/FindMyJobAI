# Task 3: Fix Tab Switching and Description Truncation Issues

## Overview

Two issues have been identified that need to be addressed:
1. **Tab switching not working properly** after selecting filters
2. **Job description truncation** at 1,200 characters is too short

---

## Issue 1: Tab Switching Not Working After Selecting Filters

### Problem Analysis

After reviewing the code, I've identified the root cause:

**Location:** [`frontend/components/FilterBar.tsx`](frontend/components/FilterBar.tsx:252-265)

The `handleClickOutside` effect uses `mousedown` event listener on the document:

```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (portalContainerRef.current && !portalContainerRef.current.contains(event.target as Node)) {
      setPortalDropdownOpen(false);
    }
    if (locationContainerRef.current && !locationContainerRef.current.contains(event.target as Node)) {
      setLocationDropdownOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [setPortalDropdownOpen, setLocationDropdownOpen]);
```

**The Issue:**
When a dropdown is open and the user clicks on a tab:
1. The `mousedown` event fires first on the document
2. The `handleClickOutside` handler runs and calls `setPortalDropdownOpen(false)` or `setLocationDropdownOpen(false)`
3. This triggers a React state update and re-render
4. The re-render happens BEFORE the `click` event can propagate to the tab
5. The tab's `onClick` handler never fires because the component may have changed during the re-render

**Why the visual selection changes but content doesn't:**
- The CSS for active tab is based on `activeTabId` prop comparison
- But the actual `setActiveTabId` call never happens due to the event being lost

### Proposed Solution

**Option A: Use `click` event instead of `mousedown` for `handleClickOutside`**

Change the event listener from `mousedown` to `click`:

```typescript
document.addEventListener('click', handleClickOutside);
return () => document.removeEventListener('click', handleClickOutside);
```

This ensures the `click` event on the tab fires before the dropdown closes.

**Option B: Add delay to dropdown close**

Add a small delay before closing the dropdown to allow the click event to propagate:

```typescript
const handleClickOutside = (event: MouseEvent) => {
  // Use setTimeout to allow the click event to propagate first
  setTimeout(() => {
    if (portalContainerRef.current && !portalContainerRef.current.contains(event.target as Node)) {
      setPortalDropdownOpen(false);
    }
    if (locationContainerRef.current && !locationContainerRef.current.contains(event.target as Node)) {
      setLocationDropdownOpen(false);
    }
  }, 0);
};
```

**Recommended: Option A** - Using `click` event is cleaner and more reliable.

### Files to Modify

| File | Change |
|------|--------|
| [`frontend/components/FilterBar.tsx`](frontend/components/FilterBar.tsx:263) | Change `mousedown` to `click` in event listener |

---

## Issue 2: Job Description Truncation Too Short

### Problem Analysis

**Location:** [`backend/job_bot.py`](backend/job_bot.py:132-133)

```python
if data_mode == "compact":
    job["description"] = (job["description"] or "")[:1200]
```

The description is truncated to 1,200 characters in `compact` mode, which cuts off important job details.

### User's Question

> "Is removing the truncate limit will be a good idea or just increasing the limit will be a good idea?"

### Analysis

**Option 1: Remove truncation entirely**
- **Pros:** Full job descriptions always available
- **Cons:** 
  - Larger database storage
  - More data transferred over network
  - Some job descriptions can be 10,000+ characters
  - May affect performance with many jobs

**Option 2: Increase truncation limit**
- **Pros:** 
  - Balance between completeness and performance
  - Still limits extreme cases
  - Database size remains manageable
- **Cons:** 
  - Some descriptions may still be cut off

**Option 3: Make it configurable**
- **Pros:** User can choose based on their needs
- **Cons:** More complex implementation

### Recommended Solution

**Increase the truncation limit to 5,000 characters** - This provides a good balance:
- Most job descriptions fit within 5,000 characters
- Still prevents extreme cases (some LinkedIn descriptions can be 20,000+ chars)
- Minimal impact on database size and network transfer
- The full description can still be accessed via the original job URL if needed

### Files to Modify

| File | Change |
|------|--------|
| [`backend/job_bot.py`](backend/job_bot.py:132-133) | Change `[:1200]` to `[:5000]` |
| [`backend/job_bot.py`](backend/job_bot.py:276-277) | Change `[:1200]` to `[:5000]` (second occurrence) |

---

## Implementation Checklist

### Issue 1: Tab Switching Fix
- [ ] Modify `FilterBar.tsx` - Change `mousedown` to `click` in `handleClickOutside` effect

### Issue 2: Description Truncation
- [ ] Modify `job_bot.py` - Update truncation limit from 1200 to 5000 characters (line 133)
- [ ] Modify `job_bot.py` - Update truncation limit from 1200 to 5000 characters (line 277)

---

## Testing Plan

### Tab Switching
1. Open the application
2. Click on Portal dropdown and select a filter
3. With dropdown still open, click on a different tab
4. Verify: Tab switches correctly and content updates
5. Verify: Filters persist when returning to original tab

### Description Truncation
1. Run a new job search
2. Click on a job row to open the detail modal
3. Verify: Description shows more content (up to 5,000 characters)
4. Note: Existing jobs will still have truncated descriptions; only new searches will get longer descriptions

---

## Notes

- **Existing jobs:** Jobs already in the database will have the old 1,200 character limit. To get longer descriptions, users need to run new searches.
- **Data mode:** The `data_mode` setting in Settings controls this. `compact` = truncated, `full` = no truncation. Users who want complete descriptions can switch to `full` mode.
