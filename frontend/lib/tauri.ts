/**
 * Detect whether the app is running inside a Tauri desktop window.
 * Returns false in regular browser (web mode).
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window;
}

/**
 * Open a URL in the default browser.
 * In Tauri, uses the shell plugin to open in the system browser.
 * In web mode, uses window.open with _blank.
 */
export async function openUrl(url: string): Promise<void> {
  if (isTauri()) {
    // Dynamic import to avoid bundling issues in web mode
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
