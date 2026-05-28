import { ThemeMode, SearchTab } from '@/types';
import { 
  TABS_STORAGE_KEY, 
  ACTIVE_TAB_STORAGE_KEY, 
  THEME_STORAGE_KEY, 
  DEFAULT_TABS 
} from './constants';

// --- THEME STORAGE ---

export function loadThemeFromStorage(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
  return 'dark'; // Default
}

export function saveThemeToStorage(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

// --- TABS STORAGE ---

export function loadTabsFromStorage(): { tabs: SearchTab[]; activeTabId: string } {
  if (typeof window === 'undefined') return { tabs: DEFAULT_TABS, activeTabId: 'all' };
  try {
    const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
    const savedActiveTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (savedTabs) {
      const parsed = JSON.parse(savedTabs) as SearchTab[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasAllTab = parsed.some(t => t.id === 'all');
        const validTabs = hasAllTab ? parsed : [DEFAULT_TABS[0], ...parsed];
        const activeId = savedActiveTab && validTabs.some(t => t.id === savedActiveTab)
          ? savedActiveTab : 'all';
        return { tabs: validTabs, activeTabId: activeId };
      }
    }
  } catch (e) {
    console.error('Failed to load tabs:', e);
  }
  return { tabs: DEFAULT_TABS, activeTabId: 'all' };
}

export function saveTabsToStorage(tabs: SearchTab[], activeTabId: string): void {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTabId);
  } catch (e) {
    console.error('Failed to save tabs:', e);
  }
}

// --- DEBOUNCE HELPER ---

export function withDebounce<T extends (...args: unknown[]) => unknown>(
  debounceRef: Record<string, number>,
  actionId: string, 
  action: T, 
  delay = 500
): T | undefined {
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const lastCall = debounceRef[actionId] || 0;
    if (now - lastCall < delay) {
      return undefined;
    }
    debounceRef[actionId] = now;
    return action(...args);
  }) as T | undefined;
}
