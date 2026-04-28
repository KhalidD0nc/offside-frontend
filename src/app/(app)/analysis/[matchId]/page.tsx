export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { fetchMatchDetail, fetchMatchStatus } from '@/lib/queries/analysis';
import AnalysisLiveProgress from '@/components/analysis/AnalysisLiveProgress';
import MatchDetailView from '@/components/analysis/MatchDetailView';

interface Props {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function MatchDetailPage({ params, searchParams }: Props) {
  const { matchId } = await params;
  const { key: r2Key } = await searchParams;

  const status = await fetchMatchStatus(matchId);
  if (status && status.status !== 'completed') {
    return (
      <AnalysisLiveProgress
        matchId={matchId}
        initialStatus={status.status}
        initialStage={status.pipelineStage}
        initialError={status.errorMessage}
      />
    );
  }

  const detail = await fetchMatchDetail(matchId, r2Key);

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <span
          className="material-symbols-outlined text-5xl text-on-surface-variant"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          search_off
        </span>
        <p className="text-on-surface-variant text-sm">Match analysis not found.</p>
        <Link
          href="/analysis"
          className="text-xs font-semibold text-primary border border-primary rounded-xl px-4 py-2 hover:opacity-80 transition-opacity"
        >
          ← Back to Analysis
        </Link>
      </div>
    );
  }

  return <MatchDetailView data={detail} />;
}
