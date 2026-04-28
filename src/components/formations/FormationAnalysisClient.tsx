'use client';

import { useEffect, useState, useTransition } from 'react';
import FormationPanel from './FormationPanel';
import OpponentAnalysisCard from './OpponentAnalysisCard';
import type { FormationCandidate, MatchLineup } from '@/lib/queries/formations';
import type { OpponentAnalysisReport } from '@/lib/ai/opponent-analyst';
import type { OpponentFormationStats, OpponentKeyPlayer, OpponentSeasonProfile, HeadToHeadMatch } from '@/lib/queries/opponent-analysis';

interface Props {
  opponentName: string;
  myLineup: MatchLineup | null;
  oppLineup: MatchLineup | null;
  seasonProfile: OpponentSeasonProfile | null;
  keyPlayers: OpponentKeyPlayer[];
  headToHead: HeadToHeadMatch[];
  formations: OpponentFormationStats[];
  formationCandidates: FormationCandidate[];
}

export default function FormationAnalysisClient({
  opponentName,
  myLineup,
  oppLineup,
  seasonProfile,
  keyPlayers,
  headToHead,
  formations,
  formationCandidates,
}: Props) {
  const [analysis, setAnalysis] = useState<OpponentAnalysisReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    startTransition(() => {
      setAnalysis(null);
      setAnalysisError(null);
    });

    async function loadAnalysis() {
      try {
        const response = await fetch('/api/opponent-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opponentName }),
        });

        if (!response.ok) {
          throw new Error('Opponent analysis failed');
        }

        const data = (await response.json()) as { analysis?: OpponentAnalysisReport };

        if (active) {
          startTransition(() => setAnalysis(data.analysis ?? null));
        }
      } catch (error) {
        console.error(error);
        if (active) {
          startTransition(() => setAnalysisError('AI opponent room is unavailable. Showing data-driven defaults.'));
        }
      }
    }

    void loadAnalysis();

    return () => {
      active = false;
    };
  }, [opponentName]);

  const isAnalyzing = !analysis && !analysisError;

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
      <aside className="xl:col-span-4">
        <OpponentAnalysisCard
          opponentName={opponentName}
          seasonProfile={seasonProfile}
          keyPlayers={keyPlayers}
          headToHead={headToHead}
          formations={formations}
          analysis={analysis}
          isAnalyzing={isAnalyzing || isPending}
          analysisError={analysisError}
        />
      </aside>

      <section className="xl:col-span-8">
        <FormationPanel
          myLineup={myLineup}
          oppLineup={oppLineup}
          analysis={analysis}
          formationCandidates={formationCandidates}
        />
      </section>
    </div>
  );
}
