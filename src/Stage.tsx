import { ReactElement } from "react";
import { StageBase, StageResponse, InitialData, Message } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { CharacterStatsUI } from "./CharacterStatsUI";

// ✅ Interface typée et extensible
export interface Stat {
  id: string;
  name: string;
  value: number;
  max?: number; // valeur max optionnelle (ex: 15/20)
}

export interface CharacterData {
  name: string;
  stats: Stat[];
  analysisRequested: boolean;
  maxMessages: number;
}

type MessageStateType = CharacterData;
type ConfigType = any;
type InitStateType = any;
type ChatStateType = any;

// ✅ Stats par défaut séparées des données d'instance
const DEFAULT_STATS: Stat[] = [
  { id: '1', name: 'Force',        value: 10, max: 20 },
  { id: '2', name: 'Agilité',      value: 12, max: 20 },
  { id: '3', name: 'Habileté',     value: 8,  max: 20 },
  { id: '4', name: 'Intelligence', value: 15, max: 20 },
  { id: '5', name: 'Perception',   value: 14, max: 20 },
];

function defaultData(name = "Personnage", maxMessages = 25): CharacterData {
  return {
    name,
    stats: DEFAULT_STATS.map(s => ({ ...s })),
    analysisRequested: false,
    maxMessages,
  };
}

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
  private characterData: CharacterData;
  private updateUICallback?: () => void; // ✅ Callback pour déclencher re-render React

  // ✅ Storage scopé au chatId (comme Party Tracker)
  private getChatId(): string | null {
    const match = window.location.pathname.match(/\/chats\/(\d+)/);
    return match ? match[1] : null;
  }

  private getStorageKey(): string {
    const chatId = this.getChatId();
    return chatId
      ? `character-stats-chat-${chatId}`
      : 'character-stats-global';
  }

  constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
    super(data);
    const { messageState, characters, config } = data;

    const charName =
      characters && Object.keys(characters).length > 0
        ? Object.values(characters)[0]?.name || "Personnage"
        : "Personnage";
    const maxMessages = config?.max_messages_to_analyze ?? 25;

    if (messageState?.stats) {
      // ✅ messageState est la source la plus fiable (swipe/jump)
      this.characterData = messageState;
    } else {
      // ✅ Fallback vers localStorage
      const saved = localStorage.getItem(this.getStorageKey());
      if (saved) {
        try {
          this.characterData = JSON.parse(saved);
        } catch {
          this.characterData = defaultData(charName, maxMessages);
        }
      } else {
        this.characterData = defaultData(charName, maxMessages);
      }
    }
  }

  async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
    return { success: true, error: null, initState: null, chatState: null };
  }

  // ✅ Gère les mises à jour lors des swipes / sauts de message
  async setState(state: MessageStateType): Promise<void> {
    if (state?.stats) {
      this.characterData = state;
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.characterData));
      } catch (e) {
        console.error('[CharacterStats] Échec sauvegarde localStorage:', e);
      }
      this.updateUICallback?.(); // ✅ Déclenche re-render React
    }
  }

  // ✅ Injection des stats dans le prompt IA
  async beforePrompt(
    userMessage: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const { name, stats, analysisRequested, maxMessages } = this.characterData;
    const parts: string[] = [];

    // Injecte toujours les stats du personnage
    if (name.trim() || stats.length > 0) {
      let info = `[PERSONNAGE - ${name || 'Inconnu'}`;
      const statsStr = stats
        .filter(s => s.name.trim())
        .map(s => (s.max !== undefined ? `${s.name}: ${s.value}/${s.max}` : `${s.name}: ${s.value}`))
        .join(', ');
      if (statsStr) info += `. Stats: ${statsStr}`;
      info += ']';
      parts.push(info);
    }

    // ✅ Directive d'analyse injectée UNE seule fois puis réinitialisée
    if (analysisRequested) {
      parts.push(
        `[ANALYSE DEMANDÉE: En te basant sur les ${maxMessages} derniers messages, ` +
        `fournis une analyse brève des performances de ${name} et propose ` +
        `d'éventuels ajustements de statistiques. Intègre cela naturellement dans ta réponse.]`
      );
      // ✅ Réinitialise le flag après injection
      this.characterData = { ...this.characterData, analysisRequested: false };
    }

    return {
      stageDirections: parts.length > 0 ? parts.join('\n') : null,
      messageState: this.characterData,
      modifiedMessage: null,
      systemMessage: null,
      error: null,
      chatState: null,
    };
  }

  async afterResponse(
    botMessage: Message
  ): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    return {
      stageDirections: null,
      messageState: this.characterData,
      modifiedMessage: null,
      error: null,
      systemMessage: null,
      chatState: null,
    };
  }

  // ✅ API publique pour l'UI
  getCharacterData(): CharacterData {
    return this.characterData;
  }

  updateCharacterData(newData: CharacterData): void {
    this.characterData = newData;
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.characterData));
    } catch (e) {
      console.error('[CharacterStats] Échec sauvegarde:', e);
    }
  }

  setUpdateCallback(callback: () => void): void {
    this.updateUICallback = callback;
  }

  render(): ReactElement {
    return <CharacterStatsUI stage={this} />;
  }
}