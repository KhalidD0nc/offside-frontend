export type PipelineStage =
  | 'queued'
  | 'downloading'
  | 'inferencing'
  | 'cleaning'
  | 'analysing'
  | 'saving'
  | 'completed'
  | 'failed';

export const PIPELINE_STAGES: Array<{
  stage: Exclude<PipelineStage, 'failed'>;
  icon: string;
  label: string;
  description: string;
}> = [
  {
    stage: 'queued',
    icon: 'sports_soccer',
    label: 'Pre-Match',
    description: 'Warming up the engine...',
  },
  {
    stage: 'downloading',
    icon: 'video_file',
    label: 'Video Feed',
    description: 'Fetching match footage',
  },
  {
    stage: 'inferencing',
    icon: 'visibility',
    label: 'Scouting',
    description: 'AI scanning every frame',
  },
  {
    stage: 'cleaning',
    icon: 'auto_fix_high',
    label: 'VAR Review',
    description: 'Verifying detected events',
  },
  {
    stage: 'analysing',
    icon: 'psychology',
    label: 'Coach Debrief',
    description: 'Building tactical report',
  },
  {
    stage: 'saving',
    icon: 'save',
    label: 'Filing Report',
    description: 'Storing to team memory',
  },
  {
    stage: 'completed',
    icon: 'emoji_events',
    label: 'Full Time',
    description: 'Analysis complete',
  },
];

export function normalizePipelineStage(value: string | null | undefined): PipelineStage {
  if (
    value === 'queued' ||
    value === 'downloading' ||
    value === 'inferencing' ||
    value === 'cleaning' ||
    value === 'analysing' ||
    value === 'saving' ||
    value === 'completed' ||
    value === 'failed'
  ) {
    return value;
  }
  return 'queued';
}

export function getStageIndex(stage: PipelineStage) {
  if (stage === 'failed') return -1;
  return PIPELINE_STAGES.findIndex((item) => item.stage === stage);
}
