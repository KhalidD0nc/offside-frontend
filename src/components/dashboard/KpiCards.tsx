import type { KpiData } from '@/lib/queries/dashboard';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

function FormPips({ form }: { form: string }) {
  return (
    <div className="flex gap-1 mt-1">
      {form.split('').map((ch, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            ch === 'W' ? 'bg-emerald-500' : ch === 'D' ? 'bg-amber-400' : 'bg-error'
          }`}
        />
      ))}
    </div>
  );
}

interface CardProps {
  label: string;
  icon: string;
  iconColor: string;
  primary: React.ReactNode;
  secondary: React.ReactNode;
}

function Card({ label, icon, iconColor, primary, secondary }: CardProps) {
  return (
    <div className="bg-background rounded-2xl p-6" style={{ boxShadow: NEO_RAISED }}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl bg-background flex items-center justify-center"
          style={{ boxShadow: NEO_INSET }}
        >
          <span
            className={`material-symbols-outlined text-lg ${iconColor}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
      </div>
      <div className="text-3xl font-black text-on-surface tracking-tight">{primary}</div>
      <div className="text-sm text-on-surface-variant mt-1">{secondary}</div>
    </div>
  );
}

export default function KpiCards({ data }: { data: KpiData }) {
  const cleanSheetPct = Math.round((data.cleanSheets / data.matchesPlayed) * 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        label="League Rank"
        icon="emoji_events"
        iconColor="text-amber-500"
        primary={`#${data.rank}`}
        secondary={`${data.points} pts`}
      />
      <Card
        label="Season Record"
        icon="scoreboard"
        iconColor="text-primary"
        primary={`${data.wins}W-${data.draws}D-${data.losses}L`}
        secondary={<FormPips form={data.last5Form} />}
      />
      <Card
        label="Goals / Match"
        icon="sports_score"
        iconColor="text-tertiary"
        primary={data.goalsPerMatch.toFixed(1)}
        secondary={`${data.matchesPlayed} matches played`}
      />
      <Card
        label="Clean Sheets"
        icon="shield"
        iconColor="text-emerald-600"
        primary={data.cleanSheets}
        secondary={`${cleanSheetPct}% of matches`}
      />
    </div>
  );
}
