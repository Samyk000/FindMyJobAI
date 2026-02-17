# Task 4: Per-Tab Filter Persistence

## Overview

Each tab should maintain its own filter state (Portal and Location filters). When switching between tabs, the filters should be preserved per-tab, not global.

## Current Behavior

- `filterPortal` and `filterLocation` are global state variables in `page.tsx`
- Changing filters affects all tabs
- Switching tabs shows the same filter selections

## Desired Behavior

| Tab | Jobs Shown | Filter State |
|-----|------------|--------------|
| All History | All 500 jobs | Own filter state |
| Tab 1 | 20 jobs (batch-specific) | Own filter state |
| Tab 2 | 5 jobs (batch-specific) | Own filter state |

When switching from Tab 1 (with filters) to Tab 2:
- Tab 2 shows its 5 jobs with NO filters applied (or its own saved filters)
- Tab 1 remembers its filter selections
- Returning to Tab 1 restores its filter selections

## Implementation Plan

### Step 1: Update SearchTab Type

**File:** [`frontend/types/index.ts`](frontend/types/index.ts:30-42)

Add filter state to the `SearchTab` type:

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
  // NEW: Per-tab filter state
  filters?: {
    portal: string[];
    location: string[];
  };
};
```

### Step 2: Update page.tsx State Management

**File:** [`frontend/app/page.tsx`](frontend/app/page.tsx)

#### 2a. Remove global filter state (or keep as current tab's filter)

The global `filterPortal` and `filterLocation` state will now represent the **current tab's** filter state.

#### 2b. Add effect to load/save filters when switching tabs

```typescript
// Load filters from current tab when switching
useEffect(() => {
  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab?.filters) {
    setFilterPortal(currentTab.filters.portal || []);
    setFilterLocation(currentTab.filters.location || []);
  } else {
    // New tabs start with no filters
    setFilterPortal([]);
    setFilterLocation([]);
  }
}, [activeTabId, tabs]);

// Save filters to current tab when they change
useEffect(() => {
  setTabs(prev => prev.map(t => {
    if (t.id === activeTabId) {
      return {
        ...t,
        filters: {
          portal: filterPortal,
          location: filterLocation
        }
      };
    }
    return t;
  }));
}, [filterPortal, filterLocation, activeTabId]);
```

### Step 3: Update FilterBar Props (Optional Optimization)

The FilterBar component can remain unchanged since it receives/sets the global filter state, which now represents the current tab's filters.

### Step 4: Handle Tab Storage

The `saveTabsToStorage` function already saves the entire `tabs` array, so filter state will be persisted automatically.

## Files to Modify

| File | Changes |
|------|---------|
| [`frontend/types/index.ts`](frontend/types/index.ts:30-42) | Add `filters` property to `SearchTab` type |
| [`frontend/app/page.tsx`](frontend/app/page.tsx) | Add effects to load/save per-tab filters |

## Edge Cases

1. **"All History" tab:** Should have its own filter state
2. **New tabs:** Start with empty filters
3. **Closed tabs:** Filter state is lost (acceptable)
4. **Page refresh:** Filters persist via localStorage (tabs are saved)

## Testing Plan

1. Open app, go to "All History"
2. Apply Portal filter (e.g., "LinkedIn")
3. Switch to a different tab → Filters should reset (or show that tab's saved filters)
4. Apply different filters on Tab 2
5. Switch back to "All History" → LinkedIn filter should be restored
6. Refresh page → Filters should persist per tab

## Implementation Checklist

- [ ] Update `SearchTab` type with `filters` property
- [ ] Add effect to load filters when `activeTabId` changes
- [ ] Add effect to save filters when `filterPortal`/`filterLocation` change
- [ ] Test filter persistence across tabs
- [ ] Test filter persistence after page refresh
