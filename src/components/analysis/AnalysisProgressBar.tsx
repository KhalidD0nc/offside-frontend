'use client';

import {
  getStageIndex,
  normalizePipelineStage,
  PIPELINE_STAGES,
  type PipelineStage,
} from '@/components/analysis/pipeline-stages';

const NEO_RAISED = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const NEO_INSET = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

export default function AnalysisProgressBar({
  stage,
  status,
  errorMessage,
  mode = 'full',
}: {
  stage: PipelineStage | string | null;
  status?: string | null;
  errorMessage?: string | null;
  mode?: 'full' | 'compact';
}) {
  const normalizedStage =
    status === 'failed' ? 'failed' : normalizePipelineStage(stage ?? status);
  const currentIndex = getStageIndex(normalizedStage);
  const activeStage =
    normalizedStage === 'failed'
      ? {
          icon: 'error',
          label: 'Stoppage',
          description: errorMessage ?? 'Analysis failed',
        }
      : PIPELINE_STAGES[Math.max(currentIndex, 0)];

  if (mode === 'compact') {
    return (
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-primary">
        <span className="material-symbols-outlined text-[16px]">{activeStage.icon}</span>
        <span className="truncate">{activeStage.label}</span>
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }

  const remaining = Math.max(0, PIPELINE_STAGES.length - currentIndex - 1);

  return (
    <div className="rounded-2xl bg-background p-5 space-y-5" style={{ boxShadow: NEO_RAISED }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Live Pipeline
          </p>
          <h3 className="mt-1 text-xl font-black text-on-surface">{activeStage.label}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{activeStage.description}</p>
        </div>
        {normalizedStage !== 'failed' && normalizedStage !== 'completed' && (
          <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
            ~{Math.max(1, remaining)} min
          </span>
        )}
      </div>

      {normalizedStage === 'failed' ? (
        <div className="rounded-xl border border-error/40 bg-error-container px-4 py-3 text-sm text-on-error-container">
          {errorMessage ?? 'CoachAI could not complete this analysis.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
          {PIPELINE_STAGES.map((item, index) => {
            const complete = index < currentIndex || normalizedStage === 'completed';
            const active = index === currentIndex && normalizedStage !== 'completed';
            return (
              <div key={item.stage} className="flex min-w-0 flex-col items-center gap-2 text-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-background text-primary ${
                    active ? 'animate-pulse' : ''
                  }`}
                  style={{ boxShadow: complete ? NEO_INSET : NEO_RAISED }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={complete || active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className="text-[11px] font-bold leading-tight text-on-surface">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
