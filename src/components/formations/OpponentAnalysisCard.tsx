'use client';

import { useState } from 'react';
import type { OpponentAnalysisReport } from '@/lib/ai/opponent-analyst';
import type { OpponentSeasonProfile, OpponentKeyPlayer, HeadToHeadMatch, OpponentFormationStats } from '@/lib/queries/opponent-analysis';

interface Props {
  opponentName: string;
  seasonProfile: OpponentSeasonProfile | null;
  keyPlayers: OpponentKeyPlayer[];
  headToHead: HeadToHeadMatch[];
  formations: OpponentFormationStats[];
  analysis: OpponentAnalysisReport | null;
  isAnalyzing?: boolean;
  analysisError?: string | null;
}

export default function OpponentAnalysisCard({
  opponentName,
  seasonProfile,
  keyPlayers,
  headToHead,
  formations,
  analysis,
  isAnalyzing = false,
  analysisError = null,
}: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const abbrev = opponentName.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <section
      className="bg-surface rounded-xl flex flex-col max-h-[800px] overflow-hidden"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}
    >
      {/* Header */}
      <div className="p-5 border-b border-outline-variant">
        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base">analytics</span>
          Opponent Analysis ({abbrev})
        </h3>
        {analysis && (
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{analysis.summary}</p>
        )}
        {isAnalyzing && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-on-surface p-4 text-white">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Opponent room</p>
                <p className="text-sm font-black">Agent is building the match plan</p>
              </div>
              <span className="h-3 w-3 animate-ping rounded-full bg-lime-300" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-white/80">
              {['Recent form', 'Threat map', 'Bench levers'].map((label) => (
                <div key={label} className="rounded-xl bg-white/10 px-2 py-2 text-center">
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
        {analysisError && (
          <p className="mt-3 rounded-2xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
            {analysisError}
          </p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1">
        {/* AI Recommendations */}
        {analysis && (
          <div className="p-5 border-b border-outline-variant">
            <button
              onClick={() => toggleSection('ai-recommendations')}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">psychology</span>
                AI Recommendations
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                {expandedSection === 'ai-recommendations' ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSection === 'ai-recommendations' && (
              <div className="mt-4 space-y-4">
                {/* Recommended Formation */}
                <div
                  className="p-3 rounded-lg bg-surface"
                  style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                >
                  <p className="text-xs text-on-surface-variant mb-1">Recommended Formation</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">{analysis.recommendedFormation}</span>
                    <p className="text-xs text-on-surface-variant flex-1">{analysis.formationReasoning}</p>
                  </div>
                </div>

                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-2">Strengths</p>
                    <ul className="space-y-1">
                      {analysis.strengths.map((s, idx) => (
                        <li key={idx} className="text-xs text-on-surface flex items-start gap-2">
                          <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-2">Exploitable Weaknesses</p>
                    <ul className="space-y-1">
                      {analysis.weaknesses.map((w, idx) => (
                        <li key={idx} className="text-xs text-on-surface flex items-start gap-2">
                          <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            target
                          </span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Season Overview */}
        {seasonProfile && (
          <div className="p-5 border-b border-outline-variant">
            <button
              onClick={() => toggleSection('overview')}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">emoji_events</span>
                Season Overview
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                {expandedSection === 'overview' ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSection === 'overview' && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-lg bg-surface text-center"
                    style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                  >
                    <p className="text-xs text-on-surface-variant">League Position</p>
                    <p className="text-xl font-bold text-primary">
                      {seasonProfile.leaguePosition ?? '—'}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg bg-surface text-center"
                    style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                  >
                    <p className="text-xs text-on-surface-variant">Points</p>
                    <p className="text-xl font-bold text-on-surface">
                      {seasonProfile.points ?? '—'}
                    </p>
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg bg-surface"
                  style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                >
                  <p className="text-xs text-on-surface-variant mb-1">Record</p>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-lg font-bold text-tertiary">{seasonProfile.wins ?? 0}</p>
                      <p className="text-xs text-on-surface-variant">W</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-on-surface-variant">{seasonProfile.draws ?? 0}</p>
                      <p className="text-xs text-on-surface-variant">D</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-error">{seasonProfile.losses ?? 0}</p>
                      <p className="text-xs text-on-surface-variant">L</p>
                    </div>
                  </div>
                </div>

                {seasonProfile.last5Form && (
                  <div
                    className="p-3 rounded-lg bg-surface"
                    style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                  >
                    <p className="text-xs text-on-surface-variant mb-1">Form (Last 5)</p>
                    <div className="flex gap-1">
                      {seasonProfile.last5Form.split('').map((result, idx) => (
                        <span
                          key={idx}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            result === 'W' ? 'bg-tertiary' : result === 'D' ? 'bg-on-surface-variant' : 'bg-error'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Key Threats */}
        {keyPlayers.length > 0 && (
          <div className="p-5 border-b border-outline-variant">
            <button
              onClick={() => toggleSection('threats')}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-sm">sports_martial_arts</span>
                Key Threats
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                {expandedSection === 'threats' ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSection === 'threats' && (
              <div className="mt-4 space-y-3">
                {keyPlayers.slice(0, 3).map((player) => (
                  <div
                    key={player.playerId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface"
                    style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden flex-shrink-0">
                      {player.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-error text-xl">sports_martial_arts</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface leading-tight truncate">
                        {player.name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {player.position} · {player.avgRating?.toFixed(1)} rating · {player.goals ?? 0} goals
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Typical Formations */}
        {formations.length > 0 && (
          <div className="p-5 border-b border-outline-variant">
            <button
              onClick={() => toggleSection('formations')}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">grid_view</span>
                Typical Formations
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                {expandedSection === 'formations' ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSection === 'formations' && (
              <div className="mt-4 space-y-2">
                {formations.slice(0, 3).map((f) => (
                  <div
                    key={f.formation}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface"
                    style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                  >
                    <span className="text-sm font-bold text-primary">{f.formation}</span>
                    <div className="flex gap-4 text-xs text-on-surface-variant">
                      <span>{f.timesUsed} matches</span>
                      <span>{f.winRate}% WR</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Head-to-Head */}
        {headToHead.length > 0 && (
          <div className="p-5">
            <button
              onClick={() => toggleSection('h2h')}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">history</span>
                Head-to-Head
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                {expandedSection === 'h2h' ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {expandedSection === 'h2h' && (
              <div className="mt-4 space-y-2">
                {headToHead.map((match) => {
                  const date = new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div
                      key={match.fixtureId}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface"
                      style={{ boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }}
                    >
                      <div className="flex-1">
                        <p className="text-xs text-on-surface-variant">{date}</p>
                        <p className="text-xs text-on-surface mt-1">
                          {match.homeTeam} {match.homeGoals} - {match.awayGoals} {match.awayTeam}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          match.winner === 'Al Hilal'
                            ? 'bg-tertiary/10 text-tertiary'
                            : match.winner
                            ? 'bg-error/10 text-error'
                            : 'bg-on-surface-variant/10 text-on-surface-variant'
                        }`}
                      >
                        {match.winner === 'Al Hilal' ? 'Win' : match.winner ? 'Loss' : 'Draw'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
