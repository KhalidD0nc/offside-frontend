'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MatchPerformancePoint } from '@/lib/queries/dashboard';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

const tooltipStyle = {
  background: '#e8eaf0',
  border: 'none',
  borderRadius: '12px',
  boxShadow: NEO_RAISED,
  fontSize: 12,
};

export default function MatchPerformanceChart({ data }: { data: MatchPerformancePoint[] }) {
  return (
    <div className="bg-background rounded-2xl p-8" style={{ boxShadow: NEO_RAISED }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Match Performance Trend</h3>
          <p className="text-sm text-on-surface-variant">Possession % and shots on goal</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary"
          style={{ boxShadow: NEO_INSET }}
        >
          <span className="material-symbols-outlined">show_chart</span>
        </div>
      </div>

      <div
        className="h-48 w-full bg-background rounded-xl px-2 pt-4 pb-2"
        style={{ boxShadow: NEO_INSET }}
      >
        <ResponsiveContainer width="100%" height={192}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis
              dataKey="round"
              tick={{ fontSize: 10, fill: '#585a68' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#585a68' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#585a68' }} />
            <Line
              type="monotone"
              dataKey="possession"
              name="Possession %"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#6366f1' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="shotsOnGoal"
              name="Shots on Goal"
              stroke="#7c3aed"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#7c3aed' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
