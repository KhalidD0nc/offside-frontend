export const dynamic = 'force-dynamic';

import { fetchAnalysisPageData } from '@/lib/queries/analysis';
import AnalysisPageClient from '@/components/analysis/AnalysisPageClient';

export default async function AnalysisPage() {
  const matches = await fetchAnalysisPageData();

  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">Analysis</h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Al-Hilal Saudi FC — {matches.length} Matches Available
          </p>
        </div>
      </header>

      <AnalysisPageClient matches={matches} />
    </>
  );
}
