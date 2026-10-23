import type { EventCondition, RunState } from '../types/game';
import { compare } from './utils';
import { slotForIndex } from './TimeSystem';

export function evaluateCondition(condition: EventCondition | undefined, state: RunState, location: string): boolean {
  if (!condition) return true;
  if (condition.all && !condition.all.every((entry) => evaluateCondition(entry, state, location))) return false;
  if (condition.any && !condition.any.some((entry) => evaluateCondition(entry, state, location))) return false;
  if (condition.not && evaluateCondition(condition.not, state, location)) return false;
  if (condition.stat) {
    const key = condition.stat.key;
    const value = key === 'trust' ? (state.relationships.teacher ?? 0) : state.stats[key];
    if (typeof value !== 'number' || !compare(value, condition.stat.op, condition.stat.value)) return false;
  }
  if (condition.flag) {
    const value = state.flags[condition.flag.key];
    if (condition.flag.equals === undefined ? !value : value !== condition.flag.equals) return false;
  }
  if (condition.relationship) {
    const value = state.relationships[condition.relationship.characterId] ?? 0;
    if (!compare(value, condition.relationship.op, condition.relationship.value)) return false;
  }
  if (condition.item) {
    const has = state.items.includes(condition.item.id);
    if (has !== condition.item.has) return false;
  }
  if (condition.character && state.characterId !== condition.character) return false;
  if (condition.location && condition.location !== location) return false;
  if (condition.slot && condition.slot !== slotForIndex(state.slotIndex)) return false;
  if (condition.day) {
    if (condition.day.equals !== undefined && state.absoluteDay !== condition.day.equals) return false;
    if (condition.day.min !== undefined && state.absoluteDay < condition.day.min) return false;
    if (condition.day.max !== undefined && state.absoluteDay > condition.day.max) return false;
  }
  return true;
}
