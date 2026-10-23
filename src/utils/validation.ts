import type { Effect, EventCondition, GameEvent } from '../types/game';

const effectKeys = new Set(['stat', 'circle', 'relationship', 'flag', 'item', 'secret', 'log']);
const eventKeys = new Set(['id', 'title', 'description', 'location', 'timeSlots', 'characters', 'conditions', 'priority', 'weight', 'repeatPolicy', 'cooldown', 'choices', 'tags']);
const conditionKeys = new Set(['all', 'any', 'not', 'stat', 'flag', 'relationship', 'item', 'character', 'day', 'location', 'slot']);

export function validateEvents(value: unknown): asserts value is GameEvent[] {
  if (!Array.isArray(value)) throw new Error('Event data must be an array');
  for (const event of value) {
    if (!isRecord(event)) throw new Error('Event must be an object');
    for (const key of Object.keys(event)) if (!eventKeys.has(key)) throw new Error(`Unknown event field: ${key}`);
    for (const required of ['id', 'title', 'description', 'location', 'timeSlots', 'characters', 'conditions', 'priority', 'weight', 'repeatPolicy', 'choices', 'tags']) {
      if (!(required in event)) throw new Error(`Missing event field: ${required}`);
    }
    validateCondition(event.conditions);
    if (!Array.isArray(event.choices)) throw new Error(`Event ${String(event.id)} choices must be an array`);
    for (const choice of event.choices) {
      if (!isRecord(choice) || typeof choice.id !== 'string' || !Array.isArray(choice.effects)) throw new Error(`Invalid choice in event ${String(event.id)}`);
      if ('condition' in choice) validateCondition(choice.condition);
      for (const effect of choice.effects) validateEffect(effect);
      if (isRecord(choice.risk)) {
        for (const key of ['successEffects', 'failEffects', 'caughtEffects']) {
          if (key in choice.risk && Array.isArray(choice.risk[key])) for (const effect of choice.risk[key]) validateEffect(effect);
        }
      }
    }
  }
}

export function validateEffect(effect: unknown): asserts effect is Effect {
  if (!isRecord(effect)) throw new Error('Effect must be an object');
  for (const key of Object.keys(effect)) if (!effectKeys.has(key)) throw new Error(`Unknown effect field: ${key}`);
}

export function validateCondition(condition: unknown): asserts condition is EventCondition {
  if (!isRecord(condition)) throw new Error('Condition must be an object');
  for (const key of Object.keys(condition)) if (!conditionKeys.has(key)) throw new Error(`Unknown condition field: ${key}`);
  if (Array.isArray(condition.all)) condition.all.forEach(validateCondition);
  if (Array.isArray(condition.any)) condition.any.forEach(validateCondition);
  if ('not' in condition) validateCondition(condition.not);
}

function isRecord(value: unknown): value is Record<string, any> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
