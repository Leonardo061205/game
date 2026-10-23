export const TIME_SLOTS = ['早自习', '上午课', '眼保健操', '午休', '下午课', '放学后', '晚上'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];
export type Grade = '初一' | '初二' | '初三';
export type LocationId = 'classroom' | 'corridor' | 'canteen' | 'playground' | 'rooftop' | 'toilet';
export type CircleId = '学霸圈' | '混混圈' | '边缘圈' | '文艺圈' | '怪胎圈';
export type Primitive = string | number | boolean;

export interface Stats {
  energy: number;
  morale: number;
  suspicion: number;
  money: number;
  circles: Record<CircleId, number>;
}

export interface EventCondition {
  all?: EventCondition[];
  any?: EventCondition[];
  not?: EventCondition;
  stat?: { key: keyof Stats | 'trust'; op: Comparison; value: number };
  flag?: { key: string; equals?: Primitive };
  relationship?: { characterId: string; op: Comparison; value: number };
  item?: { id: string; has: boolean };
  character?: string;
  day?: { min?: number; max?: number; equals?: number };
  location?: LocationId;
  slot?: TimeSlot;
}

export type Comparison = 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt';

export interface Effect {
  stat?: Partial<Record<'energy' | 'morale' | 'suspicion' | 'money', number>>;
  circle?: { id: CircleId; delta: number };
  relationship?: { characterId: string; delta: number };
  flag?: { key: string; value: Primitive };
  item?: { id: string; action: 'add' | 'remove' };
  secret?: { id: string; action: 'add' | 'remove' };
  log?: string;
}

export interface EventChoice {
  id: string;
  label: string;
  hint: string;
  effects: Effect[];
  condition?: EventCondition;
  risk?: RiskSpec;
  nextEvent?: string;
  resultText: string;
}

export interface RiskSpec {
  baseChance: number;
  caughtChance: number;
  successEffects?: Effect[];
  failEffects?: Effect[];
  caughtEffects?: Effect[];
  successText?: string;
  failText?: string;
  caughtText?: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  timeSlots: TimeSlot[];
  characters: string[];
  conditions: EventCondition;
  priority: number;
  weight: number;
  repeatPolicy: 'once' | 'repeatable';
  cooldown?: number;
  choices: EventChoice[];
  tags: string[];
}

export interface RunState {
  version: number;
  characterId: string;
  absoluteDay: number;
  slotIndex: number;
  location: LocationId;
  stats: Stats;
  relationships: Record<string, number>;
  items: string[];
  secrets: string[];
  flags: Record<string, Primitive>;
  triggeredEvents: string[];
  cooldowns: Record<string, number>;
  logs: string[];
  lastOutcome?: 'success' | 'failed' | 'caught';
  completed: boolean;
  currentEventId?: string;
}

export interface MetaState {
  unlocked: string[];
  completed: string[];
  endings: string[];
  flags: Record<string, Primitive>;
}

export interface SaveEnvelope {
  version: number;
  meta: MetaState;
  runs: Record<string, RunState>;
  active: string | null;
}

export interface EventContext {
  state: RunState;
  location: LocationId;
}
