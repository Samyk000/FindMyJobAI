# Task 2: Preserve Filters When Switching Tabs

## Overview

Currently, when users select filters (Portals, Location) and switch tabs, the filters get reset. This task ensures filters persist when switching between tabs.

## Current Behavior

### Problem Location

**File:** [`frontend/app/page.tsx`](../frontend/app/page.tsx:266-269)

```typescript
useEffect(() => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab?.type === 'new') {
    if (inputTitle === settings?.titles) setInputTitle("");
    if (inputLocation === settings?.locations) setInputLocation("");
  }
  // Reset multi-select filters when switching tabs
  setFilterPortal([]);
  setFilterLocation([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTabId]);
```

The `useEffect` that runs on `activeTabId` change explicitly resets the filter states.

## Solution Options

### Option A: Remove Reset (Simplest)

Just remove the filter reset lines. Filters will persist globally across all tabs.

**Pros:**
- Simple one-line change
- Filters persist across all tabs

**Cons:**
- Filters are global, not per-tab
- User might want different filters for different tabs

### Option B: Per-Tab Filter Storage (Better UX)

Store filter state per tab, similar to how `query` is stored per tab.

**Pros:**
- Each tab can have its own filter state
- Better UX for users who search different job types

**Cons:**
- More complex implementation
- Need to update `SearchTab` type

## Recommended Solution: Option A (Simplest)

For this use case, Option A is recommended because:
1. Users typically want to see the same filtered view across tabs
2. Simpler implementation with less code
3. Lower memory footprint

## Implementation Plan

### Step 1: Remove Filter Reset

**File:** [`frontend/app/page.tsx`](../frontend/app/page.tsx)

Remove lines 267-268:

```typescript
// BEFORE
useEffect(() => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab?.type === 'new') {
    if (inputTitle === settings?.titles) setInputTitle("");
    if (inputLocation === settings?.locations) setInputLocation("");
  }
  // Reset multi-select filters when switching tabs  <-- REMOVE
  setFilterPortal([]);                                  <-- REMOVE
  setFilterLocation([]);                                <-- REMOVE
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTabId]);

// AFTER
useEffect(() => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab?.type === 'new') {
    if (inputTitle === settings?.titles) setInputTitle("");
    if (inputLocation === settings?.locations) setInputLocation("");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTabId]);
```

### Step 2: Verify No Other Reset Points

Search for any other places where filters might be reset:

| Location | Current Behavior | Action |
|----------|-----------------|--------|
| Tab switch | Resets filters | Remove reset |
| View status change | Should NOT reset | Verify |
| Fetch complete | Should NOT reset | Verify |
| Clear data | Should reset | Keep as-is |

## Testing Checklist

- [ ] Select Portal filter (e.g., LinkedIn)
- [ ] Switch between tabs - filter should persist
- [ ] Select Location filter
- [ ] Switch between tabs - filter should persist
- [ ] Change view status (new/saved/rejected) - filter should persist
- [ ] Clear all data - filters should reset
- [ ] Refresh page - filters should reset (expected)

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `frontend/app/page.tsx` | Modify | Remove filter reset lines |

## Optional Enhancement: Per-Tab Filters

If per-tab filter storage is desired in the future, here's the implementation plan:

### Update SearchTab Type

**File:** [`frontend/types/index.ts`](../frontend/types/index.ts)

```typescript
export type SearchTab = {
  id: string;
  label: string;
  type: 'static' | 'new' | 'result';
  query?: {
    title: string;
    location: string;
    country: string;
    keywordsInc: string;
    keywordsExc: string;
  };
  batchIds?: string[];
  filters?: {                    // ADD THIS
    portals: string[];
    locations: string[];
  };
};
```

### Update Tab Switch Logic

Store current filters to current tab before switching, then load filters from new tab.

This is more complex and should only be implemented if users specifically request it.