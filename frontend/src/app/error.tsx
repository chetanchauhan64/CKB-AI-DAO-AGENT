'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Global Error:', error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0b0f] p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl border border-red-500/30 bg-red-500/5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Application Error</h2>
        <p className="text-sm text-gray-400 mb-6 font-mono break-all bg-black/40 p-4 rounded-xl border border-white/5">
          {error.message || 'An unexpected error occurred in the DAO Agent UI.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
