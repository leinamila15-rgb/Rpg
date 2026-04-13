import { ReactElement } from "react";
import { StageBase, InitialData, Message } from "@chub-ai/stages-ts";

interface Stat {
  name: string;
  value: number;
}

const STATS: Stat[] = [
  { name: 'Force', value: 0 },
  { name: 'Agilité', value: 0 },
  { name: 'Habileté', value: 0 },
  { name: 'Intelligence', value: 0 },
  { name: 'Perception', value: 0 },
];

export class Stage extends StageBase<any, any, any, any> {

  private stats: Stat[] = STATS.map(s => ({ ...s }));
  private characterName: string = "Personnage";
  private analysisRequested: boolean = false;
  private maxMessages: number = 25;

  constructor(data: InitialData<any, any, any, any>) {
    super(data);
    
    if (data.characters && Object.keys(data.characters).length > 0) {
      const firstChar = Object.values(data.characters)[0];
      if (firstChar?.name) this.characterName = firstChar.name;
    }

    // Récupère la config du joueur (le nombre de messages)
    if (data.config?.max_messages_to_analyze) {
      this.maxMessages = data.config.max_messages_to_analyze;
    }
  }

  async load() {
    return { success: true };
  }

  render(): ReactElement {
    const tokenEstimate = this.maxMessages * 60; // estimation simple en français

    return (
      <div style={{ 
        padding: '16px', 
        background: '#1e1e2e', 
        color: 'white', 
        borderRadius: '8px',
        fontFamily: 'system-ui',
        border: '1px solid #444'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', textAlign: 'center' }}>
          {this.characterName}
        </h2>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', textAlign: 'center' }}>
          Statistiques (test)
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px' 
        }}>
          {this.stats.map((stat, i) => (
            <div key={i} style={{ 
              background: '#2a2a3a', 
              padding: '12px 14px', 
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{stat.name}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        {/* === BOUTON ANALYSE === */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => {
              this.analysisRequested = true;
              this.forceUpdate(); // rafraîchit l'affichage
              alert("✅ Analyse préparée !\n\nTape simplement un point ( . ) dans le chat et appuie sur Entrée.\nL'IA va analyser et mettre à jour les stats.");
            }}
            style={{
              backgroundColor: this.analysisRequested ? '#22c55e' : '#3b82f6',
              color: 'white',
              padding: '14px 24px',
              fontSize: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 'bold'
            }}
          >
            {this.analysisRequested 
              ? "✅ Analyse préparée – Tape un . dans le chat" 
              : "🔍 Analyser les stats"}
          </button>

          <div style={{ marginTop: '12px', fontSize: '13px', opacity: 0.8 }}>
            Analyser les <strong>{this.maxMessages}</strong> derniers messages 
            (~{tokenEstimate} tokens estimés)
          </div>

          <p style={{ marginTop: '16px', fontSize: '13px', opacity: 0.6 }}>
            Clique sur le bouton → tape un . → l’IA analyse automatiquement
          </p>
        </div>
      </div>
    );
  }
}
