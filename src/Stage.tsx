import { ReactElement } from "react";
import { StageBase, InitialData, Message, StageResponse } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { CharacterStatsUI } from "./CharacterStatsUI";

// ─── Interfaces exportées ────────────────────────────────────────────────────

export interface Stat {
  name: string;
  value: number;
}

export interface CharacterData {
  stats: Stat[];
  characterName: string;
  analysisRequested: boolean;
}

// ─── Types internes ──────────────────────────────────────────────────────────

type MessageState = CharacterData;

type ConfigType = {
  max_messages_to_analyze?: number;
};

// ─── Stats par défaut ────────────────────────────────────────────────────────

const DEFAULT_STATS: Stat[] = [
  { name: 'Force',        value: 10 },
  { name: 'Agilité',      value: 12 },
  { name: 'Habileté',     value: 8  },
  { name: 'Intelligence', value: 15 },
  { name: 'Perception',   value: 14 },
];

// ─── Classe principale Stage ─────────────────────────────────────────────────

export class Stage extends StageBase<any, any, MessageState, ConfigType> {

  private stats: Stat[] = DEFAULT_STATS.map(s => ({ ...s }));
  private characterName: string = "Personnage";
  private analysisRequested: boolean = false;
  public  maxMessages: number = 25;
  private updateUICallback?: () => void;

  constructor(data: InitialData<any, any, MessageState, ConfigType>) {
    super(data);

    // Récupère le nom du personnage depuis les données Chub
    if (data.characters && Object.keys(data.characters).length > 0) {
      const firstChar = Object.values(data.characters)[0] as any;
      if (firstChar?.name) this.characterName = firstChar.name;
    }

    // Récupère la config max_messages
    if (data.config?.max_messages_to_analyze) {
      this.maxMessages = data.config.max_messages_to_analyze;
    }

    // Restaure l'état depuis messageState (swipes / navigation)
    const { messageState } = data;
    if (messageState?.stats) {
      this.stats            = messageState.stats;
      this.characterName    = messageState.characterName    ?? this.characterName;
      this.analysisRequested = messageState.analysisRequested ?? false;
    }
  }

  // ── Chargement initial ─────────────────────────────────────────────────────

  async load(): Promise<Partial<LoadResponse<any, any, MessageState>>> {
    return { success: true };
  }

  // ── Swipes / navigation entre messages ────────────────────────────────────

  async setState(state: MessageState): Promise<void> {
    if (state?.stats) {
      this.stats             = state.stats;
      this.characterName     = state.characterName    ?? this.characterName;
      this.analysisRequested = state.analysisRequested ?? false;
      this.updateUICallback?.();
    }
  }

  // ── Détecte le "." et injecte le prompt d'analyse ─────────────────────────

  async beforePrompt(
    userMessage: Message
  ): Promise<Partial<StageResponse<any, MessageState>>> {

    const content = userMessage.content?.trim();

    if (content === '.') {
      const statsNames = this.stats.map(s => s.name).join(', ');

      const analysisPrompt = `[SYSTEM – STAT ANALYSER]
Tu es un moteur d'analyse de personnage pour un jeu de rôle narratif.
En te basant UNIQUEMENT sur l'historique de la conversation ci-dessus (les ${this.maxMessages} derniers messages), analyse les actions, comportements et capacités démontrées par ${this.characterName}.

Retourne OBLIGATOIREMENT un bloc JSON valide avec exactement ce format, et rien d'autre avant ou après le bloc JSON :

\`\`\`json
{
  "stats": [
    { "name": "Force",        "value": <entier 1-20> },
    { "name": "Agilité",      "value": <entier 1-20> },
    { "name": "Habileté",     "value": <entier 1-20> },
    { "name": "Intelligence", "value": <entier 1-20> },
    { "name": "Perception",   "value": <entier 1-20> }
  ],
  "reasoning": "<explication courte en 2-3 phrases>"
}
\`\`\`

Les stats à évaluer sont : ${statsNames}.
Chaque valeur doit être un entier entre 1 et 20 basé sur les preuves narratives.
Si tu n'as pas assez d'information pour une stat, garde la valeur par défaut (10).`;

      this.analysisRequested = true;
      this.updateUICallback?.();

      return {
        stageDirections: analysisPrompt,
        messageState:    this.buildMessageState(),
        modifiedMessage: null,
        systemMessage:   null,
        error:           null,
        chatState:       null,
      };
    }

    return {
      stageDirections: null,
      messageState:    this.buildMessageState(),
      modifiedMessage: null,
      systemMessage:   null,
      error:           null,
      chatState:       null,
    };
  }

  // ── Parse la réponse du bot et met à jour les stats ───────────────────────

  async afterResponse(
    botMessage: Message
  ): Promise<Partial<StageResponse<any, MessageState>>> {

    if (this.analysisRequested) {
      const content = botMessage.content ?? '';

      // Cherche un bloc ```json ... ``` ou un objet JSON brut
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)```/i) ??
        content.match(/(\{[\s\S]*"stats"[\s\S]*\})/);

      if (jsonMatch) {
        try {
          const raw    = jsonMatch[1] ?? jsonMatch[0];
          const parsed = JSON.parse(raw.trim());

          if (Array.isArray(parsed.stats)) {
            this.stats = this.stats.map((existingStat: Stat) => {
              const newStat = parsed.stats.find(
                (s: Stat) => s.name.toLowerCase() === existingStat.name.toLowerCase()
              );
              if (newStat && typeof newStat.value === 'number') {
                return {
                  ...existingStat,
                  value: Math.min(20, Math.max(1, Math.round(newStat.value))),
                };
              }
              return existingStat;
            });

            this.analysisRequested = false;
            this.updateUICallback?.();
          }
        } catch (e) {
          console.error('[StatStage] Échec du parsing JSON:', e);
        }
      }
    }

    return {
      stageDirections: null,
      messageState:    this.buildMessageState(),
      modifiedMessage: null,
      error:           null,
      systemMessage:   null,
      chatState:       null,
    };
  }

  // ── Méthodes publiques pour le composant UI ────────────────────────────────

  getCharacterData(): CharacterData {
    return {
      stats:             this.stats,
      characterName:     this.characterName,
      analysisRequested: this.analysisRequested,
    };
  }

  updateCharacterData(newData: Partial<CharacterData>): void {
    if (newData.stats             !== undefined) this.stats             = newData.stats;
    if (newData.characterName     !== undefined) this.characterName     = newData.characterName;
    if (newData.analysisRequested !== undefined) this.analysisRequested = newData.analysisRequested;
    this.updateUICallback?.();
  }

  setUpdateCallback(callback: () => void): void {
    this.updateUICallback = callback;
  }

  // ── Helpers privés ─────────────────────────────────────────────────────────

  private buildMessageState(): MessageState {
    return {
      stats:             this.stats,
      characterName:     this.characterName,
      analysisRequested: this.analysisRequested,
    };
  }

  // ── Rendu React ────────────────────────────────────────────────────────────

  render(): ReactElement {
    return <CharacterStatsUI stage={this} />;
  }
}