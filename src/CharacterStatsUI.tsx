import { ReactElement, useState, useEffect } from "react";
import { Stage, Stat, CharacterData } from "./Stage";

// ─────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────
export function CharacterStatsUI({ stage }: { stage: Stage }): ReactElement {
  // ✅ Même pattern forceUpdate que Party Tracker
  const [, forceUpdate] = useState({});
  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [analysisFeedback, setAnalysisFeedback] = useState(false);

  // ✅ Enregistre le callback de re-render auprès du Stage
  useEffect(() => {
    stage.setUpdateCallback(() => forceUpdate({}));
  }, [stage]);

  const data = stage.getCharacterData();

  // ✅ Fonction centralisée de mise à jour (comme updatePartyData)
  const update = (newData: CharacterData) => {
    stage.updateCharacterData(newData);
    forceUpdate({});
  };

  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const updateStat = (id: string, field: keyof Stat, value: any) => {
    update({
      ...data,
      stats: data.stats.map(s => (s.id === id ? { ...s, [field]: value } : s)),
    });
  };

  const addStat = () => {
    update({
      ...data,
      stats: [...data.stats, { id: generateId(), name: '', value: 10, max: 20 }],
    });
  };

  const removeStat = (id: string) => {
    update({ ...data, stats: data.stats.filter(s => s.id !== id) });
  };

  // ✅ Injecte dans beforePrompt au prochain message (plus d'alert !)
  const requestAnalysis = () => {
    update({ ...data, analysisRequested: true });
    setAnalysisFeedback(true);
    setTimeout(() => setAnalysisFeedback(false), 3000);
  };

  const tokenEstimate = data.maxMessages * 60;

  return (
    <div style={styles.container}>
      {/* ── EN-TÊTE ── */}
      <div style={{ marginBottom: '20px' }}>
        {/* ✅ Nom éditable directement dans l'UI */}
        <input
          value={data.name}
          onChange={e => update({ ...data, name: e.target.value })}
          style={styles.nameInput}
          placeholder="Nom du personnage"
        />
        <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
          Statistiques du personnage
        </div>
      </div>

      {/* ── GRILLE DES STATS ── */}
      <div style={styles.grid}>
        {data.stats.map(stat => (
          <StatCard
            key={stat.id}
            stat={stat}
            isEditing={editingStatId === stat.id}
            onToggleEdit={() =>
              setEditingStatId(prev => (prev === stat.id ? null : stat.id))
            }
            onUpdate={(field, val) => updateStat(stat.id, field, val)}
            onRemove={() => {
              removeStat(stat.id);
              setEditingStatId(null);
            }}
          />
        ))}
      </div>

      {/* ✅ Bouton ajout stat */}
      <button
        onClick={addStat}
        style={styles.addButton}
        onMouseOver={e => (e.currentTarget.style.borderColor = '#38bdf8')}
        onMouseOut={e => (e.currentTarget.style.borderColor = '#334155')}
      >
        + Ajouter une statistique
      </button>

      {/* ── PANNEAU D'ANALYSE ── */}
      <div style={styles.analysisPanel}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
          🔬 Analyse IA
        </div>
        <div style={{ fontSize: '13px', opacity: 0.65, marginBottom: '16px' }}>
          Basée sur les{' '}
          <strong style={{ color: '#38bdf8' }}>{data.maxMessages}</strong> derniers
          messages (~{tokenEstimate} tokens)
        </div>

        {/* ✅ Feedback inline à la place de l'alert() */}
        {analysisFeedback && (
          <div style={styles.feedbackBox}>
            ✅ Directive injectée — envoie ton prochain message pour déclencher
            l'analyse !
          </div>
        )}

        <button
          onClick={requestAnalysis}
          disabled={data.analysisRequested}
          style={{
            ...styles.analysisButton,
            background: data.analysisRequested ? '#22c55e' : '#38bdf8',
            opacity: data.analysisRequested ? 0.8 : 1,
            cursor: data.analysisRequested ? 'default' : 'pointer',
          }}
          onMouseOver={e => {
            if (!data.analysisRequested)
              e.currentTarget.style.background = '#7dd3fc';
          }}
          onMouseOut={e => {
            if (!data.analysisRequested)
              e.currentTarget.style.background = '#38bdf8';
          }}
        >
          {data.analysisRequested
            ? '✅ En attente du prochain message…'
            : "🔍 Lancer l'analyse"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sous-composant StatCard
// ─────────────────────────────────────────────
function StatCard({
  stat,
  isEditing,
  onToggleEdit,
  onUpdate,
  onRemove,
}: {
  stat: Stat;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (field: keyof Stat, value: any) => void;
  onRemove: () => void;
}): ReactElement {
  const pct =
    stat.max !== undefined && stat.max > 0
      ? Math.min((stat.value / stat.max) * 100, 100)
      : null;

  // ✅ Couleur dynamique selon le pourcentage
  const barColor =
    pct === null
      ? '#38bdf8'
      : pct > 66
      ? '#22c55e'
      : pct > 33
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div
      onClick={onToggleEdit}
      style={{
        ...styles.card,
        border: `1px solid ${isEditing ? '#38bdf8' : '#1f2937'}`,
        cursor: 'pointer',
      }}
    >
      {isEditing ? (
        /* ── MODE ÉDITION ── */
        <>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={styles.removeBtn}
            title="Supprimer"
          >
            ×
          </button>
          <input
            value={stat.name}
            onChange={e => onUpdate('name', e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Nom"
            style={{ ...styles.input, marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="number"
              value={stat.value}
              onChange={e => onUpdate('value', Number(e.target.value))}
              onClick={e => e.stopPropagation()}
              placeholder="Val."
              style={{ ...styles.input, width: '50%' }}
            />
            <input
              type="number"
              value={stat.max ?? ''}
              onChange={e =>
                onUpdate('max', e.target.value ? Number(e.target.value) : undefined)
              }
              onClick={e => e.stopPropagation()}
              placeholder="Max"
              style={{ ...styles.input, width: '50%' }}
            />
          </div>
        </>
      ) : (
        /* ── MODE AFFICHAGE ── */
        <>
          <div style={{ fontSize: '11px', opacity: 0.55, marginBottom: '6px', letterSpacing: '0.05em' }}>
            {stat.name || '—'}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: barColor, lineHeight: 1 }}>
            {stat.value}
            {stat.max !== undefined && (
              <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.45 }}>
                /{stat.max}
              </span>
            )}
          </div>
          {/* ✅ Barre de progression */}
          {pct !== null && (
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${pct}%`,
                  background: barColor,
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Styles centralisés
// ─────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    background: '#0f172a',
    borderRadius: '14px',
    color: '#e5e7eb',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    border: '1px solid #1e293b',
    overflowY: 'auto',
    maxHeight: '100vh',
    boxSizing: 'border-box',
    scrollbarWidth: 'thin',
    scrollbarColor: '#334155 #0f172a',
  },
  nameInput: {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #334155',
    color: '#f8fafc',
    fontSize: '22px',
    fontWeight: 700,
    width: '100%',
    outline: 'none',
    padding: '4px 0',
    boxSizing: 'border-box',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '14px',
  },
  card: {
    background: '#111827',
    borderRadius: '10px',
    padding: '14px',
    position: 'relative',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  addButton: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    color: '#64748b',
    border: '1px dashed #334155',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    marginBottom: '20px',
    transition: 'border-color 0.2s, color 0.2s',
  },
  analysisPanel: {
    background: '#020617',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #1e293b',
  },
  feedbackBox: {
    padding: '10px 14px',
    background: '#14532d',
    border: '1px solid #16a34a',
    borderRadius: '8px',
    color: '#86efac',
    fontSize: '13px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  analysisButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    color: '#020617',
    transition: 'all 0.2s ease',
  },
  input: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#e5e7eb',
    fontSize: '13px',
    padding: '5px 8px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  },
  removeBtn: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    padding: '2px',
  },
  barTrack: {
    marginTop: '8px',
    background: '#1f2937',
    borderRadius: '4px',
    height: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease, background 0.3s ease',
  },
};