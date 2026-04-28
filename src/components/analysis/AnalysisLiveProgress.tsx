'use client';

import Link from 'next/link';
import AnalysisProgressBar from '@/components/analysis/AnalysisProgressBar';
import { useMatchStatus } from '@/hooks/useMatchStatus';

export default function AnalysisLiveProgress({
  matchId,
  initialStatus,
  initialStage,
  initialError,
}: {
  matchId: string;
  initialStatus: string | null;
  initialStage: string | null;
  initialError: string | null;
}) {
  const live = useMatchStatus(matchId);
  const status = live.pipelineStage ? live.status : initialStatus;
  const stage = live.pipelineStage ?? initialStage;
  const errorMessage = live.errorMessage ?? initialError;

  return (
    <div className="mx-auto flex min-h-96 max-w-4xl flex-col justify-center gap-6">
      <div>
        <Link
          href="/analysis"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Analysis
        </Link>
        <h2 className="text-3xl font-black tracking-tight text-on-surface">
          Match Analysis In Progress
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          You can leave this page. The sidebar indicator will stay active until the job finishes.
        </p>
      </div>

      <AnalysisProgressBar stage={stage} status={status} errorMessage={errorMessage} />
    </div>
  );
}
