"use client";

import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '@/lib/config';
import { isTauri } from '@/lib/tauri';

type Status = 'connecting' | 'connected' | 'error';

interface Props {
  children: React.ReactNode;
}

export function BackendStatus({ children }: Props) {
  const [status, setStatus] = useState<Status>('connecting');
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch by only checking isTauri after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${CONFIG.API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 90; // 45 seconds at 500ms interval

    const poll = async () => {
      if (cancelled) return;

      const healthy = await checkHealth();
      if (cancelled) return;

      if (healthy) {
        setStatus('connected');
        return;
      }

      attempt++;
      if (attempt >= maxAttempts) {
        setStatus('error');
        setError(
          isTauri()
            ? 'The search engine failed to start. Please close and reopen FindMyJobAI.'
            : 'Cannot connect to the backend server. Please make sure it is running on port 8000.'
        );
        return;
      }

      setTimeout(poll, 500);
    };

    poll();

    // Listen for Tauri sidecar events (only if running in Tauri)
    if (isTauri()) {
      let unlisten1: (() => void) | undefined;
      let unlisten2: (() => void) | undefined;

      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<boolean>('backend-ready', () => {
          if (!cancelled) setStatus('connected');
        }).then(fn => { unlisten1 = fn; });

        listen<string>('backend-error', (event) => {
          if (!cancelled) {
            setStatus('error');
            setError(event.payload);
          }
        }).then(fn => { unlisten2 = fn; });
      }).catch(() => {
        // Not in Tauri — silently ignore
      });

      return () => {
        cancelled = true;
        unlisten1?.();
        unlisten2?.();
      };
    }

    return () => { cancelled = true; };
  }, [checkHealth, retryKey]);

  // ---- Connected → render the app ----
  if (status === 'connected') return <>{children}</>;

  // ---- Loading / Error screen ----
  // Use consistent text during SSR to avoid hydration mismatch
  const loadingText = mounted && isTauri() 
    ? 'Starting the search engine...' 
    : 'Connecting to server...';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-xl border border-gray-200 dark:border-gray-700">
        {status === 'connecting' ? (
          <>
            <div className="text-5xl mb-6">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              FindMyJobAI
            </h1>
            <div className="flex justify-center mb-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {loadingText}
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Connection Failed
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => {
                setStatus('connecting');
                setError('');
                setRetryKey(k => k + 1);
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
