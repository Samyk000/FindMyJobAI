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
  const [progress, setProgress] = useState(0);

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
    const maxAttempts = 90;

    const poll = async () => {
      if (cancelled) return;

      const healthy = await checkHealth();
      if (cancelled) return;

      if (healthy) {
        setProgress(100);
        setTimeout(() => setStatus('connected'), 400);
        return;
      }

      attempt++;
      setProgress(Math.min(90, (attempt / maxAttempts) * 100));

      if (attempt >= maxAttempts) {
        setStatus('error');
        setError(
          isTauri()
            ? 'The search engine failed to start. Please close and reopen Jobify.'
            : 'Cannot connect to the backend server. Please make sure it is running on port 8000.'
        );
        return;
      }

      setTimeout(poll, 500);
    };

    poll();

    if (isTauri()) {
      let unlisten1: (() => void) | undefined;
      let unlisten2: (() => void) | undefined;

      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<boolean>('backend-ready', () => {
          if (!cancelled) {
            setProgress(100);
            setTimeout(() => setStatus('connected'), 400);
          }
        }).then(fn => { unlisten1 = fn; });

        listen<string>('backend-error', (event) => {
          if (!cancelled) {
            setStatus('error');
            setError(event.payload);
          }
        }).then(fn => { unlisten2 = fn; });
      }).catch(() => {});

      return () => {
        cancelled = true;
        unlisten1?.();
        unlisten2?.();
      };
    }

    return () => { cancelled = true; };
  }, [checkHealth, retryKey]);

  if (status === 'connected') return <>{children}</>;

  const loadingText = mounted && isTauri() 
    ? 'Starting the search engine...' 
    : 'Connecting to server...';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/10 animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-teal-500/10 via-transparent to-cyan-500/10 animate-pulse" 
             style={{ animationDuration: '4s', animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full" />
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="animate-[fadeIn_0.8s_ease-out]">
              <rect width="80" height="80" rx="20" fill="url(#logo-gradient)" />
              <path d="M24 52V28h6v18h10v6H24z" fill="white" />
              <path d="M46 52V28h6v18h10v6H46z" fill="white" opacity="0.7" />
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="80" y2="80">
                  <stop stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
          Jobify
        </h1>
        <p className="text-zinc-500 text-sm mb-10 tracking-wide uppercase animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
          Smart Job Search
        </p>

        {status === 'connecting' ? (
          <div className="flex flex-col items-center gap-6 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
            {/* Progress bar */}
            <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Loading dots */}
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-[bounce_1.4s_infinite_0s]" />
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-[bounce_1.4s_infinite_0.16s]" />
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-[bounce_1.4s_infinite_0.32s]" />
            </div>
            
            <p className="text-zinc-500 text-xs">
              {loadingText}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-[fadeInUp_0.6s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">
              Connection Failed
            </h2>
            <p className="text-zinc-400 text-sm max-w-xs text-center leading-relaxed">
              {error}
            </p>
            <button type="button"
              onClick={() => {
                setStatus('connecting');
                setError('');
                setProgress(0);
                setRetryKey(k => k + 1);
              }}
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:from-teal-400 hover:to-cyan-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
