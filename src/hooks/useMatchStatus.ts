'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  normalizePipelineStage,
  type PipelineStage,
} from '@/components/analysis/pipeline-stages';

type MatchStatusState = {
  status: string;
  pipelineStage: PipelineStage | null;
  errorMessage: string | null;
  isLoading: boolean;
};

type MatchStatusRow = {
  status?: string | null;
  pipeline_stage?: string | null;
  error_message?: string | null;
};

const INITIAL_STATE: MatchStatusState = {
  status: 'not_started',
  pipelineStage: null,
  errorMessage: null,
  isLoading: false,
};

function toState(row: MatchStatusRow, isLoading = false): MatchStatusState {
  return {
    status: row.status ?? 'not_started',
    pipelineStage: normalizePipelineStage(row.pipeline_stage ?? row.status),
    errorMessage: row.error_message ?? null,
    isLoading,
  };
}

export function useMatchStatus(matchId: string | null): MatchStatusState {
  const [state, setState] = useState<MatchStatusState>(INITIAL_STATE);

  useEffect(() => {
    if (!matchId) return;

    let cancelled = false;

    async function fetchInitialStatus() {
      try {
        const { data } = await supabase
          .from('matches')
          .select('status, pipeline_stage, error_message')
          .eq('id', matchId)
          .single();
        if (!cancelled && data) setState(toState(data, false));
      } catch {
        if (!cancelled) setState((current) => ({ ...current, isLoading: false }));
      }
    }

    fetchInitialStatus();

    const channel = supabase
      .channel(`match-status:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          const next = payload.new as MatchStatusRow;
          setState(toState(next, false));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  return matchId ? state : INITIAL_STATE;
}
