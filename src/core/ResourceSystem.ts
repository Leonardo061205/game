import type { Effect, RunState, Stats } from '../types/game';
import { validateEffect } from '../utils/validation';

export const RESOURCE_LIMITS = {
  energy: { min: 0, max: 100 },
  morale: { min: 0, max: 100 },
  suspicion: { min: 0, max: 100 },
  money: { min: 0, max: Number.MAX_SAFE_INTEGER },
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function cloneStats(stats: Stats): Stats {
  return { ...stats, circles: { ...stats.circles } };
}

export function applyEffectToState(state: RunState, effect: Effect): string[] {
  const messages: string[] = [];
  if (effect.stat) {
    for (const [key, delta] of Object.entries(effect.stat)) {
      if (delta === undefined) continue;
      const resource = key as keyof typeof RESOURCE_LIMITS;
      const limits = RESOURCE_LIMITS[resource];
      const before = state.stats[resource];
      const after = clamp(before + delta, limits.min, limits.max);
      state.stats[resource] = after;
      if (after !== before) messages.push(`${resourceLabel(resource)} ${formatDelta(after - before)}`);
    }
  }
  if (effect.circle) {
    const before = state.stats.circles[effect.circle.id] ?? 0;
    const after = clamp(before + effect.circle.delta, 0, 100);
    state.stats.circles[effect.circle.id] = after;
    if (after !== before) messages.push(`${effect.circle.id} ${formatDelta(after - before)}`);
  }
  if (effect.relationship) {
    const before = state.relationships[effect.relationship.characterId] ?? 0;
    const after = clamp(before + effect.relationship.delta, 0, 100);
    state.relationships[effect.relationship.characterId] = after;
    if (after !== before) messages.push(`关系 ${formatDelta(after - before)}`);
  }
  if (effect.flag) state.flags[effect.flag.key] = effect.flag.value;
  if (effect.item) {
    if (effect.item.action === 'add' && !state.items.includes(effect.item.id)) state.items.push(effect.item.id);
    if (effect.item.action === 'remove') state.items = state.items.filter((item) => item !== effect.item?.id);
  }
  if (effect.secret) {
    if (effect.secret.action === 'add' && !state.secrets.includes(effect.secret.id)) state.secrets.push(effect.secret.id);
    if (effect.secret.action === 'remove') state.secrets = state.secrets.filter((secret) => secret !== effect.secret?.id);
  }
  if (effect.log) messages.push(effect.log);
  return messages;
}

export function applyEffectsAtomically(state: RunState, effects: Effect[]): string[] {
  const snapshot = structuredClone(state);
  try {
    effects.forEach(validateEffect);
    const messages = effects.flatMap((effect) => applyEffectToState(state, effect));
    validateState(state);
    return messages;
  } catch (error) {
    Object.assign(state, snapshot);
    throw error;
  }
}

export function validateState(state: RunState): void {
  for (const [key, limits] of Object.entries(RESOURCE_LIMITS)) {
    const value = state.stats[key as keyof typeof RESOURCE_LIMITS];
    if (!Number.isFinite(value) || value < limits.min || value > limits.max) {
      throw new Error(`Invalid resource ${key}: ${value}`);
    }
  }
  if (state.absoluteDay < 1 || state.absoluteDay > 90) throw new Error('absoluteDay must be between 1 and 90');
  if (state.slotIndex < 0 || state.slotIndex > 6) throw new Error('slotIndex must be between 0 and 6');
}

export function dailyTick(state: RunState): string[] {
  const messages: string[] = [];
  const wasExhausted = state.stats.energy <= 0;
  if (state.flags.collapse === true) {
    state.stats.energy = Math.floor(state.stats.energy * 0.7);
    state.stats.morale = Math.floor(state.stats.morale * 0.7);
    state.stats.money = Math.floor(state.stats.money * 0.7);
    for (const circle of Object.keys(state.stats.circles)) {
      const key = circle as keyof typeof state.stats.circles;
      state.stats.circles[key] = Math.floor(state.stats.circles[key] * 0.7);
    }
    state.flags.collapse = false;
    messages.push('崩溃后的第二天，你的资源都打了七折。');
  }
  state.stats.energy = clamp(state.stats.energy + 18, 0, 100);
  state.stats.morale = clamp(state.stats.morale - 1, 0, 100);
  state.stats.suspicion = clamp(state.stats.suspicion - 3, 0, 100);
  if (wasExhausted) {
    state.stats.energy = Math.min(state.stats.energy, 80);
    state.stats.suspicion = clamp(state.stats.suspicion + 10, 0, 100);
    state.flags.infirmary = true;
    messages.push('你在医务室醒来，今天的怀疑值上升了。');
  }
  if (state.stats.morale <= 0) {
    state.flags.collapse = true;
    messages.push('心态见底：明天所有行动都更吃力。');
  }
  for (const key of Object.keys(state.cooldowns)) {
    state.cooldowns[key] = Math.max(0, (state.cooldowns[key] ?? 0) - 1);
    if (state.cooldowns[key] === 0) delete state.cooldowns[key];
  }
  return messages;
}

export function resourceLabel(key: keyof typeof RESOURCE_LIMITS): string {
  return { energy: '体力', morale: '心态', suspicion: '怀疑', money: '金钱' }[key];
}

export function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}
