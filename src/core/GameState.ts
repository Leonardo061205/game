import characters from '../data/characters.json';
import type { CharacterData } from '../types/characters';
import type { Effect, MetaState, RunState, SaveEnvelope, Stats } from '../types/game';
import { advanceClock, isNight } from './TimeSystem';
import { applyEffectsAtomically, dailyTick } from './ResourceSystem';
import { SaveSystem, createEmptySave } from './SaveSystem';

const characterData = characters as CharacterData[];

export interface StateListener { (state: RunState): void; }

export class GameState {
  private save: SaveEnvelope;
  private readonly listeners = new Set<StateListener>();

  public constructor(private readonly saveSystem: SaveSystem = new SaveSystem()) {
    this.save = saveSystem.load() ?? createEmptySave();
    if (!this.save.runs.c_monitor) this.save.runs.c_monitor = createRun('c_monitor');
    if (!this.save.active) this.save.active = 'c_monitor';
  }

  public get run(): RunState { return this.save.runs[this.save.active ?? 'c_monitor'] ?? this.save.runs.c_monitor!; }
  public get meta(): MetaState { return this.save.meta; }
  public get loadWarning(): boolean { return this.saveSystem.lastLoadError; }

  public subscribe(listener: StateListener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  public startNewRun(characterId = 'c_monitor'): RunState {
    if (!this.save.meta.unlocked.includes(characterId)) throw new Error('角色尚未解锁');
    this.save.runs[characterId] = createRun(characterId);
    this.save.active = characterId;
    this.commit();
    return this.run;
  }

  public restore(): RunState {
    this.save = this.saveSystem.load() ?? this.save;
    if (!this.save.active || !this.save.runs[this.save.active]) this.save.active = 'c_monitor';
    this.emit();
    return this.run;
  }

  public applyEffects(effects: Effect[]): string[] { const messages = applyEffectsAtomically(this.run, effects); this.commit(); return messages; }

  public beginEvent(eventId: string): void { this.run.currentEventId = eventId; this.emit(); }

  public advanceTime(): string[] {
    const state = this.run;
    const before = state.absoluteDay;
    const next = advanceClock({ absoluteDay: state.absoluteDay, slotIndex: state.slotIndex });
    state.absoluteDay = next.absoluteDay;
    state.slotIndex = next.slotIndex;
    const messages: string[] = [];
    if (isNight(state.slotIndex === 0 ? 6 : state.slotIndex - 1)) {
      messages.push(...dailyTick(state));
    }
    if (state.absoluteDay !== before) messages.push(`新的一天：第 ${state.absoluteDay} 天。`);
    this.commit();
    return messages;
  }

  public completeRun(): void {
    this.run.completed = true;
    if (!this.save.meta.completed.includes(this.run.characterId)) this.save.meta.completed.push(this.run.characterId);
    this.commit();
  }

  public saveNow(): void { this.saveSystem.save(this.save); }
  public exportSave(): SaveEnvelope { return structuredClone(this.save); }

  private commit(): void { this.saveSystem.save(this.save); this.emit(); }
  private emit(): void { for (const listener of this.listeners) listener(this.run); }
}

function createRun(characterId: string): RunState {
  const character = characterData.find((entry) => entry.id === characterId) ?? characterData[0]!;
  const stats: Stats = {
    energy: character.energy,
    morale: character.morale,
    suspicion: character.suspicion,
    money: character.money,
    circles: { 学霸圈: 0, 混混圈: 0, 边缘圈: 0, 文艺圈: 0, 怪胎圈: 0 },
  };
  return {
    version: 1,
    characterId,
    absoluteDay: 1,
    slotIndex: 0,
    location: 'classroom',
    stats,
    relationships: { teacher: 0 },
    items: [],
    secrets: [],
    flags: {},
    triggeredEvents: [],
    cooldowns: {},
    logs: ['新周目开始：你决定先做一个看起来很正常的班长。'],
    completed: false,
  };
}
