import { ReactElement } from "react";
import { StageBase, InitialData } from "@chub-ai/stages-ts";

interface Stat {
  name: string;
  value: number;
  color?: string;
}

const STATS: Stat[] = [
  { name: 'Force', value: 10, color: '#f87171' },
  { name: 'Agilité', value: 12, color: '#4ade80' },
  { name: 'Habileté', value: 8, color: '#60a5fa' },
  { name: 'Intelligence', value: 15, color: '#c084fc' },
  { name: 'Perception', value: 14, color: '#fbbf24' },
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

    if (data.config?.max_messages_to_analyze) {
      this.maxMessages = data.config.max_messages_to_analyze;
    }
  }

  async load() { return { success: true }; }
  async setState(state: any): Promise<void> {}
  async beforePrompt(userMessage: any) { return {}; }
  async afterResponse(botMessage: any) { return {}; }

  private refresh() {
    this.setState({});
  }

  render(): ReactElement {
    const tokenEstimate = this.maxMessages * 60;

    return (
      <div className="stage-container" style={{
        padding: '20px',
        backgroundColor: '#0f0f17',
        color: '#e2e8f0',
        borderRadius: '12px',
        border: '1px solid #1e2937',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
      }}>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #334155'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: 600,
            color: '#f1f5f9'
          }}>
            {this.characterName}
          </h2>
          <p style={{ margin: '6px 0 0 0', opacity: 0.6, fontSize: '14px' }}>
            RPG Stats Tracker
          </p>
        </div>

        {/* Stats Grid - style proche du Party Tracker */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {this.stats.map((stat, index) => (
            <div key={index} style={{
              backgroundColor: '#1e2937',
              borderRadius: '10px',
              padding: '16px 14px',
              border: '1px solid #334155',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                {stat.name.toUpperCase()}
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: stat.color || '#67e8f9',
                lineHeight: 1
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Analyse Section */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              this.analysisRequested = true;
              this.refresh();
              alert("✅ Analyse préparée !\n\nTape un point ( . ) dans le chat puis appuie sur Entrée.");
            }}
            style={{
              background: this.analysisRequested ? '#22c55e' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '15px 32px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '10px',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '12px',
              boxShadow: this.analysisRequested 
                ? '0 0 15px rgba(34, 197, 94, 0.5)' 
                : '0 0 15px rgba(59, 130, 246, 0.4)'
            }}
          >
            {this.analysisRequested 
              ? "✅ Analyse prête — Tape un . dans le chat" 
              : "🔍 Lancer l'analyse des stats"}
          </button>

          <div style={{ fontSize: '13.5px', opacity: 0.7 }}>
            {this.maxMessages} derniers messages • ~{tokenEstimate} tokens estimés
          </div>
        </div>

      </div>
    );
  }
}