import { ReactElement } from "react";
import { StageBase, InitialData } from "@chub-ai/stages-ts";

interface Stat {
  name: string;
  value: number;
}

const STATS: Stat[] = [
  { name: 'Force', value: 10 },
  { name: 'Agilité', value: 12 },
  { name: 'Habileté', value: 8 },
  { name: 'Intelligence', value: 15 },
  { name: 'Perception', value: 14 },
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
      <div style={{
        padding: '20px',
        backgroundColor: '#020617', // FULL OPAQUE
        borderRadius: '14px',
        color: '#e5e7eb',
        fontFamily: 'system-ui',
        border: '1px solid #1e293b',
        backdropFilter: 'none' // IMPORTANT
      }}>

        {/* HEADER */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 600,
            color: '#f8fafc'
          }}>
            {this.characterName}
          </h2>

          <div style={{
            fontSize: '13px',
            opacity: 0.7,
            marginTop: '4px'
          }}>
            Statistiques du personnage
          </div>
        </div>

        {/* STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {this.stats.map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#0f172a', // OPAQUE CARD
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid #1f2937'
            }}>
              <div style={{
                fontSize: '12px',
                opacity: 0.6,
                marginBottom: '6px'
              }}>
                {stat.name}
              </div>

              <div style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#38bdf8'
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ANALYSIS PANEL */}
        <div style={{
          backgroundColor: '#020617', // OPAQUE
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #1e293b'
        }}>

          <div style={{
            fontSize: '14px',
            marginBottom: '10px',
            fontWeight: 500
          }}>
            Analyse
          </div>

          <div style={{
            fontSize: '13px',
            opacity: 0.7,
            marginBottom: '16px'
          }}>
            Analyse basée sur les {this.maxMessages} derniers messages (~{tokenEstimate} tokens)
          </div>

          <button
            onClick={() => {
              this.analysisRequested = true;
              this.refresh();
              alert("✅ Analyse prête !\nTape '.' dans le chat.");
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: this.analysisRequested ? '#22c55e' : '#38bdf8',
              color: '#020617'
            }}
          >
            {this.analysisRequested
              ? "✅ Analyse prête"
              : "🔍 Lancer l'analyse"}
          </button>
        </div>

      </div>
    );
  }
}