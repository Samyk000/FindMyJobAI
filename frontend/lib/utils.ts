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

// --- FETCH UTILITIES ---

/**
 * @deprecated Use `apiClient` from '@/lib/api' instead.
 * This function is kept for backward compatibility during migration.
 * See the migration guide in plans3/phase3-code-quality-plan.md
 */
export async function fetchWithError(
  url: string, 
  options: RequestInit | undefined,
  requestCache: Map<string, { data: unknown; timestamp: number }>,
  cacheTtl: number,
  requestTimeout: number
): Promise<unknown> {
  // Check cache for GET requests
  const isGetRequest = !options?.method || options.method === 'GET';
  const cacheKey = isGetRequest ? url : null;
  
  if (cacheKey) {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTtl) {
      return cached.data;
    }
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      
      // Handle specific HTTP status codes
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (response.status === 503) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    // Cache successful GET requests
    if (cacheKey) {
      requestCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }
    
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Handle timeout
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    
    // Handle network errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Cannot connect to backend. Is the server running?');
    }
    throw err;
  }
}

// --- DEBOUNCE HELPER ---

export function withDebounce<T extends (...args: unknown[]) => unknown>(
  debounceRef: Record<string, number>,
  actionId: string, 
  action: T, 
  delay = 500
): T {
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const lastCall = debounceRef[actionId] || 0;
    if (now - lastCall < delay) {
      return; // Skip if called too recently
    }
    debounceRef[actionId] = now;
    return action(...args);
  }) as T;
}
