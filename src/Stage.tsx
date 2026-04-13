import { ReactElement } from "react";
import { StageBase, InitialData } from "@chub-ai/stages-ts";

interface Stat {
  name: string;
  value: number;
}

const STATS = [
  { name: 'Force', value: 10 },
  { name: 'Agilité', value: 12 },
  { name: 'Habileté', value: 8 },
  { name: 'Intelligence', value: 15 },
  { name: 'Perception', value: 14 },
];

export class Stage extends StageBase<any, any, any, any> {

  private stats = STATS.map(s => ({ ...s }));
  private characterName = "Personnage";
  private analysisRequested = false;

  constructor(data: InitialData<any, any, any, any>) {
    super(data);
    if (data.characters && Object.keys(data.characters).length > 0) {
      const first = Object.values(data.characters)[0];
      if (first?.name) this.characterName = first.name;
    }
  }

  async load() { return { success: true }; }
  async setState() {}
  async beforePrompt() { return {}; }
  async afterResponse() { return {}; }

  private refresh() {
    this.setState({});
  }

  render(): ReactElement {
    return (
      <div style={{
        padding: "20px",
        backgroundColor: "#1a1a2e",        // fond très sombre et opaque
        color: "#ffffff",
        borderRadius: "12px",
        border: "2px solid #334155",
        fontFamily: "system-ui",
        minHeight: "400px",
        boxShadow: "0 0 20px rgba(0,0,0,0.6)"
      }}>

        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#67e8f9" }}>
          {this.characterName}
        </h2>

        <h3 style={{ textAlign: "center", marginBottom: "16px" }}>Statistiques</h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "12px"
        }}>
          {this.stats.map((stat, i) => (
            <div key={i} style={{
              backgroundColor: "#16213e",
              padding: "14px",
              borderRadius: "8px",
              textAlign: "center",
              border: "1px solid #334155"
            }}>
              <div style={{ fontSize: "14px", opacity: 0.8 }}>{stat.name}</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#67e8f9" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Bouton qui doit marcher */}
        <button
          onClick={() => {
            this.analysisRequested = true;
            this.refresh();
            alert("✅ Bouton OK !\n\nLe Stage fonctionne.\nTape un . dans le chat pour la suite.");
          }}
          style={{
            marginTop: "30px",
            width: "100%",
            padding: "16px",
            fontSize: "17px",
            fontWeight: "bold",
            backgroundColor: this.analysisRequested ? "#22c55e" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          {this.analysisRequested ? "✅ Analyse préparée" : "🔍 Analyser les stats"}
        </button>

      </div>
    );
  }
}