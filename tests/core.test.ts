import { describe, expect, it } from 'vitest';
import { advanceClock, dayInGrade, gradeForDay, slotForIndex } from '../src/core/TimeSystem';
import { applyEffectsAtomically, dailyTick } from '../src/core/ResourceSystem';
import { EventEngine } from '../src/core/EventEngine';
import { SaveSystem, createEmptySave, migrateSave } from '../src/core/SaveSystem';
import type { RunState } from '../src/types/game';
import { events } from '../src/data/runtimeData';

function run(): RunState {
  return {
    version: 1, characterId: 'c_monitor', absoluteDay: 1, slotIndex: 1, location: 'classroom',
    stats: { energy: 60, morale: 70, suspicion: 10, money: 20, circles: { 学霸圈: 0, 混混圈: 0, 边缘圈: 0, 文艺圈: 0, 怪胎圈: 0 } },
    relationships: { teacher: 0 }, items: [], secrets: [], flags: {}, triggeredEvents: [], cooldowns: {}, logs: [], completed: false,
  };
}

describe('TimeSystem', () => {
  it('maps 90 days to three grades and seven slots', () => {
    expect(gradeForDay(1)).toBe('初一'); expect(gradeForDay(31)).toBe('初二'); expect(gradeForDay(90)).toBe('初三');
    expect(dayInGrade(46)).toBe(16); expect(slotForIndex(0)).toBe('早自习'); expect(slotForIndex(6)).toBe('晚上');
    expect(advanceClock({ absoluteDay: 1, slotIndex: 6 })).toEqual({ absoluteDay: 2, slotIndex: 0 });
    expect(advanceClock({ absoluteDay: 90, slotIndex: 6 })).toEqual({ absoluteDay: 90, slotIndex: 6 });
  });
});

describe('ResourceSystem', () => {
  it('clamps resources and applies daily consequences', () => {
    const state = run(); state.stats.energy = 1;
    applyEffectsAtomically(state, [{ stat: { energy: -20, suspicion: 200, money: -99 } }]);
    expect(state.stats.energy).toBe(0); expect(state.stats.suspicion).toBe(100); expect(state.stats.money).toBe(0);
    const logs = dailyTick(state); expect(state.flags.infirmary).toBe(true); expect(logs.join('')).toContain('医务室');
  });
});

describe('EventEngine', () => {
  it('filters by day and slot and only triggers once', () => {
    const state = run(); const engine = new EventEngine(events);
    const event = engine.select({ state, location: 'classroom' });
    expect(event.id).toBe('monitor_day1_morning');
    const choice = engine.choicesFor(event, state)[0]!;
    engine.execute(event, choice.id, state);
    expect(state.triggeredEvents).toContain(event.id);
    expect(engine.eligibleEvents({ state, location: 'classroom' })).not.toContain(event);
  });

  it('gives different day-three choices based on flags', () => {
    const state = run(); state.absoluteDay = 3; state.slotIndex = 1; state.flags.keys_returned = true;
    const engine = new EventEngine(events); const event = engine.select({ state, location: 'classroom' });
    expect(event.id).toBe('monitor_day3_morning');
    expect(engine.choicesFor(event, state).map((choice) => choice.id)).toContain('climax_cover');
    state.flags.keys_returned = false; state.flags.ledger_secret = true;
    expect(engine.choicesFor(event, state).map((choice) => choice.id)).toContain('climax_expose');
  });

  it('falls back when no event is available', () => {
    const state = run(); state.absoluteDay = 20; state.slotIndex = 0;
    expect(new EventEngine([]).select({ state, location: 'classroom' }).id).toBe('default_reflection');
  });
});

describe('SaveSystem', () => {
  it('round trips and migrates a legacy run', () => {
    const memory = new Map<string, string>();
    const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) };
    const system = new SaveSystem(storage); const save = createEmptySave(); save.active = 'c_monitor'; save.runs.c_monitor = run(); system.save(save);
    expect(system.load()?.runs.c_monitor?.absoluteDay).toBe(1);
    expect(migrateSave({ version: 0, run: { characterId: 'c_monitor', absoluteDay: 4 } }).runs.c_monitor!.absoluteDay).toBe(4);
  });

  it('rejects corrupt saves without throwing from load', () => {
    const storage = { getItem: () => '{broken', setItem: () => undefined, removeItem: () => undefined };
    expect(new SaveSystem(storage).load()).toBeNull();
  });
});
