'use client';

import { useState } from 'react';
import type { TacticalInsightCard } from '@/lib/queries/dashboard';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

const perspectiveConfig = {
  opportunity: {
    heading: 'Opportunities',
    headingColor: 'text-emerald-600',
    border: 'border-l-4 border-emerald-500',
    dot: 'bg-emerald-500',
    icon: 'trending_up',
    iconColor: 'text-emerald-600',
  },
  threat: {
    heading: 'Threats',
    headingColor: 'text-red-600',
    border: 'border-l-4 border-red-500',
    dot: 'bg-red-500',
    icon: 'warning',
    iconColor: 'text-red-600',
  },
  neutral: {
    heading: 'Neutral',
    headingColor: 'text-on-surface-variant',
    border: 'border-l-4 border-outline',
    dot: 'bg-outline',
    icon: 'info',
    iconColor: 'text-on-surface-variant',
  },
};

function InsightCard({ card }: { card: TacticalInsightCard }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = perspectiveConfig[card.perspective];

  return (
    <div
      className="bg-background rounded-xl p-4 cursor-pointer select-none"
      style={{ boxShadow: NEO_RAISED }}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          {card.phaseOfPlay} / {card.eventType}
        </p>
      </div>
      <p className="text-sm text-on-surface leading-relaxed">{card.insight}</p>
      {expanded && card.advice && (
        <div
          className="mt-3 p-3 rounded-lg bg-background text-xs text-on-surface-variant leading-relaxed"
          style={{ boxShadow: NEO_INSET }}
        >
          <span className="font-semibold text-primary block mb-1">Coach Advice</span>
          {card.advice}
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <span className="material-symbols-outlined text-sm text-on-surface-variant opacity-50">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>
    </div>
  );
}

function Column({
  perspective,
  cards,
}: {
  perspective: TacticalInsightCard['perspective'];
  cards: TacticalInsightCard[];
}) {
  const cfg = perspectiveConfig[perspective];
  return (
    <div>
      <div className={`pl-3 mb-4 ${cfg.border}`}>
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-base ${cfg.iconColor}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {cfg.icon}
          </span>
          <h4 className={`text-sm font-bold uppercase tracking-wider ${cfg.headingColor}`}>
            {cfg.heading} ({cards.length})
          </h4>
        </div>
      </div>
      <div className="space-y-3">
        {cards.length > 0 ? (
          cards.map((card, i) => <InsightCard key={i} card={card} />)
        ) : (
          <p className="text-xs text-on-surface-variant italic px-2">None identified</p>
        )}
      </div>
    </div>
  );
}

export default function TacticalInsights({ data }: { data: TacticalInsightCard[] }) {
  const opportunities = data.filter((c) => c.perspective === 'opportunity');
  const threats = data.filter((c) => c.perspective === 'threat');
  const neutral = data.filter((c) => c.perspective === 'neutral');

  return (
    <section>
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-on-surface">AI Tactical Insights</h3>
        <p className="text-sm text-on-surface-variant mt-1">
          From last match analysis — click a card to reveal coach advice
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column perspective="opportunity" cards={opportunities} />
        <Column perspective="threat" cards={threats} />
        <Column perspective="neutral" cards={neutral} />
      </div>
    </section>
  );
}
