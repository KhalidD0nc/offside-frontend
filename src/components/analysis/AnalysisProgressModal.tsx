'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AnalysisProgressBar from '@/components/analysis/AnalysisProgressBar';
import { useMatchStatus } from '@/hooks/useMatchStatus';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';

export default function AnalysisProgressModal({
  matchId,
  r2Key,
  onDismiss,
}: {
  matchId: string | null;
  r2Key: string | null;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const { status, pipelineStage, errorMessage } = useMatchStatus(matchId);

  useEffect(() => {
    if (status === 'completed' && matchId) {
      const query = r2Key ? `?key=${encodeURIComponent(r2Key)}` : '';
      router.push(`/analysis/${matchId}${query}`);
    }
  }, [matchId, r2Key, router, status]);

  if (!matchId) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-on-surface/20 px-4 pb-6 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl rounded-2xl bg-background p-5"
        style={{ boxShadow: NEO_RAISED }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Analysis Started
            </p>
            <h2 className="text-2xl font-black text-on-surface">CoachAI is reading the match</h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-on-surface-variant"
            style={{ boxShadow: NEO_RAISED }}
            aria-label="Dismiss progress"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <AnalysisProgressBar
          stage={pipelineStage}
          status={status}
          errorMessage={errorMessage}
        />

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={onDismiss}
            className="font-semibold text-on-surface-variant hover:text-primary"
          >
            Dismiss - I&apos;ll check back later
          </button>
          <Link
            href={`/analysis/${matchId}${r2Key ? `?key=${encodeURIComponent(r2Key)}` : ''}`}
            className="font-bold text-primary hover:opacity-80"
          >
            Open progress
          </Link>
        </div>
      </div>
    </div>
  );
}
