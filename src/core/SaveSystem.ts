import type { MetaState, RunState, SaveEnvelope } from '../types/game';

export const SAVE_KEY = 'campus-trouble-rpg-save-v1';
export const SAVE_VERSION = 1;

const defaultMeta: MetaState = { unlocked: ['c_monitor'], completed: [], endings: [], flags: {} };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SaveSystem {
  public lastLoadError = false;

  public constructor(private readonly storage: StorageLike | undefined = typeof localStorage === 'undefined' ? undefined : localStorage) {}

  public load(): SaveEnvelope | null {
    this.lastLoadError = false;
    if (!this.storage) return null;
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return migrateSave(parsed);
    } catch {
      this.lastLoadError = true;
      return null;
    }
  }

  public save(save: SaveEnvelope): void {
    if (!this.storage) return;
    this.storage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  public clear(): void {
    this.storage?.removeItem(SAVE_KEY);
  }
}

export function createEmptySave(): SaveEnvelope {
  return { version: SAVE_VERSION, meta: structuredClone(defaultMeta), runs: {}, active: null };
}

export function migrateSave(value: unknown): SaveEnvelope {
  if (!isRecord(value)) throw new Error('Invalid save');
  if (value.version === SAVE_VERSION && isRecord(value.meta) && isRecord(value.runs)) {
    return normalizeSave(value);
  }
  if (value.version === 0 && isRecord(value.run)) {
    const legacy = value.run;
    const migrated = createEmptySave();
    const characterId = typeof legacy.characterId === 'string' ? legacy.characterId : 'c_monitor';
    migrated.runs[characterId] = normalizeRun({ ...legacy, characterId });
    migrated.active = characterId;
    return migrated;
  }
  throw new Error('Unsupported save version');
}

function normalizeSave(value: Record<string, unknown>): SaveEnvelope {
  const metaValue = isRecord(value.meta) ? value.meta : {};
  const runsValue = isRecord(value.runs) ? value.runs : {};
  const runs: Record<string, RunState> = {};
  for (const [key, run] of Object.entries(runsValue)) {
    if (isRecord(run)) runs[key] = normalizeRun({ ...run, characterId: run.characterId ?? key });
  }
  return {
    version: SAVE_VERSION,
    meta: {
      unlocked: stringArray(metaValue.unlocked, ['c_monitor']),
      completed: stringArray(metaValue.completed),
      endings: stringArray(metaValue.endings),
      flags: isRecord(metaValue.flags) ? (metaValue.flags as MetaState['flags']) : {},
    },
    runs,
    active: typeof value.active === 'string' && runs[value.active] ? value.active : null,
  };
}

function normalizeRun(value: Record<string, unknown>): RunState {
  const statsValue = isRecord(value.stats) ? value.stats : {};
  const circlesValue = isRecord(statsValue.circles) ? statsValue.circles : {};
  return {
    version: SAVE_VERSION,
    characterId: typeof value.characterId === 'string' ? value.characterId : 'c_monitor',
    absoluteDay: integer(value.absoluteDay, 1, 90, 1),
    slotIndex: integer(value.slotIndex, 0, 6, 0),
    location: typeof value.location === 'string' ? value.location as RunState['location'] : 'classroom',
    stats: {
      energy: number(statsValue.energy, 60),
      morale: number(statsValue.morale, 70),
      suspicion: number(statsValue.suspicion, 10),
      money: number(statsValue.money, 20),
      circles: {
        学霸圈: number(circlesValue.学霸圈, 0),
        混混圈: number(circlesValue.混混圈, 0),
        边缘圈: number(circlesValue.边缘圈, 0),
        文艺圈: number(circlesValue.文艺圈, 0),
        怪胎圈: number(circlesValue.怪胎圈, 0),
      },
    },
    relationships: isRecord(value.relationships) ? numericRecord(value.relationships) : {},
    items: stringArray(value.items),
    secrets: stringArray(value.secrets),
    flags: isRecord(value.flags) ? (value.flags as RunState['flags']) : {},
    triggeredEvents: stringArray(value.triggeredEvents),
    cooldowns: isRecord(value.cooldowns) ? numericRecord(value.cooldowns) : {},
    logs: stringArray(value.logs).slice(0, 30),
    lastOutcome: value.lastOutcome === 'success' || value.lastOutcome === 'failed' || value.lastOutcome === 'caught' ? value.lastOutcome : undefined,
    completed: value.completed === true,
    currentEventId: typeof value.currentEventId === 'string' ? value.currentEventId : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function stringArray(value: unknown, fallback: string[] = []): string[] { return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [...fallback]; }
function numericRecord(value: Record<string, unknown>): Record<string, number> { return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === 'number').map(([key, item]) => [key, item as number])); }
function number(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function integer(value: unknown, min: number, max: number, fallback: number): number { const n = number(value, fallback); return Math.min(max, Math.max(min, Math.round(n))); }
