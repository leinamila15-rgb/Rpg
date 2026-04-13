import { ReactElement, useState, useEffect } from "react";
import { Stage, Stat, CharacterData } from "./Stage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Retourne une couleur selon la valeur (1-20)
function getStatColor(value: number): string {
  if (value >= 17) return '#22c55e'; // vert   – excellent
  if (value >= 13) return '#38bdf8'; // bleu   – bon
  if (value >= 9)  return '#f59e0b'; // orange – moyen
  return '#ef4444';                  // rouge  – faible
}

// Retourne un label textuel selon la valeur
function getStatLabel(value: number): string {
  if (value >= 17) return 'Excellent';
  if (value >= 13) return 'Bon';
  if (value >= 9)  return 'Moyen';
  return 'Faible';
}

// ─── Sous-composant : carte d'une stat ───────────────────────────────────────

function StatCard({ stat }: { stat: Stat }): ReactElement {
  const color = getStatColor(stat.value);
  const label = getStatLabel(stat.value);

  return (
    <div style={{
      background:   'rgba(17, 24, 39, 0.6)',
      borderRadius: '10px',
      padding:      '14px',
      border:       `1px solid ${color}33`,
      textAlign:    'center',
      transition:   'border-color 0.3s ease',
    }}>
      {/* Nom de la stat */}
      <div style={{
        fontSize:      '11px',
        opacity:       0.6,
        marginBottom:  '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color:         '#e5e7eb',
      }}>
        {stat.name}
      </div>

      {/* Valeur numérique */}
      <div style={{
        fontSize:   '28px',
        fontWeight: 700,
        color:      color,
        lineHeight: 1,
      }}>
        {stat.value}
      </div>

      {/* Label qualitatif */}
      <div style={{
        fontSize:     '10px',
        color:        color,
        opacity:      0.8,
        marginTop:    '4px',
        marginBottom: '8px',
      }}>
        {label}
      </div>

      {/* Barre de progression */}
      <div style={{
        height:       '4px',
        background:   'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow:     'hidden',
      }}>
        <div style={{
          height:       '100%',
          width:        `${(stat.value / 20) * 100}%`,
          background:   color,
          borderRadius: '2px',
          transition:   'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ─── Sous-composant : panneau d'analyse ──────────────────────────────────────

function AnalysisPanel({
  analysisRequested,
  maxMessages,
}: {
  analysisRequested: boolean;
  maxMessages: number;
}): ReactElement {
  const tokenEstimate = maxMessages * 60;

  return (
    <div style={{
      background:   'rgba(2, 6, 23, 0.5)',
      borderRadius: '12px',
      padding:      '16px',
      border:       '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Titre */}
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#f8fafc' }}>
        🔍 Analyse automatique
      </div>

      {/* Instructions */}
      <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '14px', color: '#e5e7eb' }}>
        Envoie{' '}
        <code style={{
          background:   'rgba(255,255,255,0.12)',
          padding:      '1px 7px',
          borderRadius: '4px',
          fontSize:     '12px',
          fontFamily:   'monospace',
          color:        '#38bdf8',
        }}>
          .
        </code>
        {' '}dans le chat pour analyser les{' '}
        <strong style={{ color: '#f8fafc' }}>{maxMessages}</strong> derniers messages
        {' '}(~{tokenEstimate} tokens)
      </div>

      {/* Bandeau de statut */}
      <div style={{
        fontSize:    '12px',
        padding:     '10px 14px',
        borderRadius:'8px',
        marginBottom:'12px',
        background:  analysisRequested
          ? 'rgba(234, 179, 8, 0.12)'
          : 'rgba(34, 197, 94, 0.08)',
        border:      `1px solid ${analysisRequested
          ? 'rgba(234,179,8,0.35)'
          : 'rgba(34,197,94,0.25)'}`,
        color:       analysisRequested ? '#fbbf24' : '#86efac',
        display:     'flex',
        alignItems:  'center',
        gap:         '8px',
      }}>
        {/* Indicateur animé */}
        {analysisRequested && (
          <span style={{
            display:      'inline-block',
            width:        '8px',
            height:       '8px',
            borderRadius: '50%',
            background:   '#fbbf24',
            animation:    'pulse 1s infinite',
            flexShrink:   0,
          }} />
        )}
        {analysisRequested
          ? '⏳ Analyse en cours… attends la réponse du bot.'
          : '✅ Stats à jour — envoie "." pour relancer une analyse.'}
      </div>

      {/* Note de bas de panneau */}
      <div style={{
        fontSize:   '11px',
        opacity:    0.4,
        textAlign:  'center',
        fontStyle:  'italic',
        color:      '#e5e7eb',
      }}>
        Les stats se mettent à jour automatiquement après la réponse du modèle.
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function CharacterStatsUI({ stage }: { stage: Stage }): ReactElement {
  const [, forceUpdate] = useState<object>({});

  // Abonne le composant aux mises à jour du Stage
  useEffect(() => {
    stage.setUpdateCallback(() => forceUpdate({}));
    return () => stage.setUpdateCallback(() => {});
  }, [stage]);

  const data: CharacterData = stage.getCharacterData();
  const { stats, characterName, analysisRequested } = data;
  const maxMessages: number = stage.maxMessages;

  return (
    <>
      {/* Animation CSS pour le point pulsant */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1;   transform: scale(1);    }
          50%       { opacity: 0.4; transform: scale(1.25); }
        }
      `}</style>

      <div style={{
        padding:     '20px',
        background:  'transparent',
        borderRadius:'14px',
        color:       '#e5e7eb',
        fontFamily:  'system-ui, -apple-system, sans-serif',
        boxSizing:   'border-box',
      }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            margin:     0,
            fontSize:   '22px',
            fontWeight: 600,
            color:      '#f8fafc',
          }}>
            {characterName}
          </h2>
          <div style={{ fontSize: '13px', opacity: 0.55, marginTop: '4px' }}>
            Statistiques du personnage
          </div>
        </div>

        {/* ── GRILLE DE STATS ── */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap:                 '10px',
          marginBottom:        '24px',
        }}>
          {stats.map((stat: Stat, i: number) => (
            <StatCard key={`${stat.name}-${i}`} stat={stat} />
          ))}
        </div>

        {/* ── PANNEAU D'ANALYSE ── */}
        <AnalysisPanel
          analysisRequested={analysisRequested}
          maxMessages={maxMessages}
        />

      </div>
    </>
  );
}