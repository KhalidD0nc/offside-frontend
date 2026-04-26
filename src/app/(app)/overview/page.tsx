export const dynamic = 'force-dynamic';

import { fetchDashboardData } from '@/lib/queries/dashboard';
import KpiCards from '@/components/dashboard/KpiCards';
import TacticalInsights from '@/components/dashboard/TacticalInsights';
import PlayersTable from '@/components/dashboard/PlayersTable';
import MatchPerformanceChart from '@/components/charts/MatchPerformanceChart';
import GoalTimingChart from '@/components/charts/GoalTimingChart';

const AL_HILAL_ID = 2932;

export default async function OverviewPage() {
  const { teamInfo, kpi, trend, goalTiming, players, tactics } = await fetchDashboardData(AL_HILAL_ID);

  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">Overview</h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Al-Hilal Saudi FC — Saudi Pro League
          </p>
        </div>
        <div className="flex items-center gap-6">
          <button
            className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
          <div
            className="w-12 h-12 rounded-full bg-background p-1"
            style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
          >
            {teamInfo?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={teamInfo.logoUrl}
                alt={teamInfo.teamName}
                className="w-full h-full rounded-full object-contain"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  person
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {kpi && <KpiCards data={kpi} />}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {trend && <MatchPerformanceChart data={trend} />}
          {goalTiming && <GoalTimingChart data={goalTiming} />}
        </section>

        {tactics && tactics.length > 0 && <TacticalInsights data={tactics} />}

        {players && players.length > 0 && <PlayersTable players={players} />}
      </div>
    </>
  );
}
