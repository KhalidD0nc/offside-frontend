'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { GoalTimingPoint } from '@/lib/queries/dashboard';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

const tooltipStyle = {
  background: '#e8eaf0',
  border: 'none',
  borderRadius: '12px',
  boxShadow: NEO_RAISED,
  fontSize: 12,
};

export default function GoalTimingChart({ data }: { data: GoalTimingPoint[] }) {
  const max = Math.max(...data.map((d) => d.goals));

  return (
    <div className="bg-background rounded-2xl p-8" style={{ boxShadow: NEO_RAISED }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Goal Timing Profile</h3>
          <p className="text-sm text-on-surface-variant">Goals scored by match period</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-tertiary"
          style={{ boxShadow: NEO_INSET }}
        >
          <span className="material-symbols-outlined">timer</span>
        </div>
      </div>

      <div
        className="h-48 w-full bg-background rounded-xl px-2 pt-4 pb-2"
        style={{ boxShadow: NEO_INSET }}
      >
        <ResponsiveContainer width="100%" height={192}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10, fill: '#585a68' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: '#585a68' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
            />
            <Bar dataKey="goals" name="Goals" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.period}
                  fill={entry.goals === max ? '#6366f1' : '#a5b4fc'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
