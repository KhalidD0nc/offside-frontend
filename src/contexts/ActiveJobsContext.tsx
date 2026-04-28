'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase/client';

const STORAGE_KEY = 'offside-active-analysis-jobs';
const JOB_TTL_MS = 6 * 60 * 60 * 1000;
const TERMINAL_STATUSES = new Set(['completed', 'failed']);

export type ActiveJob = {
  matchId: string;
  r2Key: string;
  homeTeam: string;
  awayTeam: string;
  submittedAt: string;
};

type ActiveJobsContextValue = {
  jobs: ActiveJob[];
  addJob: (job: ActiveJob) => void;
  removeJob: (matchId: string) => void;
};

const ActiveJobsContext = createContext<ActiveJobsContextValue | null>(null);

function readStoredJobs(): ActiveJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isActiveJob) : [];
  } catch {
    return [];
  }
}

function isActiveJob(value: unknown): value is ActiveJob {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.matchId === 'string' &&
    typeof candidate.r2Key === 'string' &&
    typeof candidate.homeTeam === 'string' &&
    typeof candidate.awayTeam === 'string' &&
    typeof candidate.submittedAt === 'string'
  );
}

function isFresh(job: ActiveJob) {
  const submitted = Date.parse(job.submittedAt);
  return Number.isFinite(submitted) && Date.now() - submitted < JOB_TTL_MS;
}

export function ActiveJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<ActiveJob[]>(() => {
    if (typeof window === 'undefined') return [];
    return readStoredJobs().filter(isFresh);
  });

  const removeJob = useCallback((matchId: string) => {
    setJobs((current) => current.filter((job) => job.matchId !== matchId));
  }, []);

  const addJob = useCallback((job: ActiveJob) => {
    setJobs((current) => {
      const withoutDuplicate = current.filter((item) => item.matchId !== job.matchId);
      return [job, ...withoutDuplicate].filter(isFresh);
    });
  }, []);

  useEffect(() => {
    const stored = readStoredJobs().filter(isFresh);

    if (stored.length === 0) return;

    supabase
      .from('matches')
      .select('id, status')
      .in(
        'id',
        stored.map((job) => job.matchId),
      )
      .then(({ data }) => {
        const terminalIds = new Set(
          (data ?? [])
            .filter((row) => TERMINAL_STATUSES.has(row.status ?? ''))
            .map((row) => row.id as string),
        );
        setJobs((current) =>
          current.filter((job) => isFresh(job) && !terminalIds.has(job.matchId)),
        );
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.filter(isFresh)));
  }, [jobs]);

  useEffect(() => {
    if (jobs.length === 0) return;

    const channels = jobs.map((job) =>
      supabase
        .channel(`active-job:${job.matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${job.matchId}`,
          },
          (payload) => {
            const next = payload.new as { status?: string | null };
            if (TERMINAL_STATUSES.has(next.status ?? '')) removeJob(job.matchId);
          },
        )
        .subscribe(),
    );

    return () => {
      for (const channel of channels) {
        supabase.removeChannel(channel);
      }
    };
  }, [jobs, removeJob]);

  const value = useMemo(
    () => ({ jobs, addJob, removeJob }),
    [jobs, addJob, removeJob],
  );

  return <ActiveJobsContext.Provider value={value}>{children}</ActiveJobsContext.Provider>;
}

export function useActiveJobs() {
  const context = useContext(ActiveJobsContext);
  if (!context) {
    throw new Error('useActiveJobs must be used inside ActiveJobsProvider');
  }
  return context;
}
