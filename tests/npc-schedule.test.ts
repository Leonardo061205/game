import { describe, expect, it } from 'vitest';
import scenesJson from '../src/data/scenes.json';
import {
  NPCScheduleSystem,
  type SceneDefinition,
  type ScheduleContext,
} from '../src/core/NPCScheduleSystem';

const schedule = new NPCScheduleSystem(scenesJson as SceneDefinition[]);

function context(slot: ScheduleContext['slot'], overrides: Partial<NonNullable<ScheduleContext['state']>> = {}): ScheduleContext {
  return {
    slot,
    state: {
      absoluteDay: 1,
      flags: {},
      relationships: {},
      stats: { energy: 60, morale: 60, suspicion: 0, money: 10, circles: { 学霸圈: 0, 混混圈: 0, 边缘圈: 0, 文艺圈: 0, 怪胎圈: 0 } },
      ...overrides,
    },
  };
}

describe('NPCScheduleSystem', () => {
  it('resolves NPC locations from their time-slot schedule', () => {
    expect(schedule.locationFor('c_monitor', context('早自习'))).toBe('classroom');
    expect(schedule.locationFor('c_monitor', context('放学后'))).toBe('corridor');
    expect(schedule.locationFor('c_monitor', context('晚上'))).toBe('away');
    expect(schedule.locationFor('missing-npc', context('早自习'))).toBe('away');
  });

  it('only exposes NPCs scheduled in a scene and marks conditional interactions', () => {
    const beforeTrust = schedule.visibleNPCs('classroom', context('上午课'));
    expect(beforeTrust.some((npc) => npc.npcId === 'teacher')).toBe(true);
    expect(beforeTrust.find((npc) => npc.npcId === 'teacher')?.interactionIds).not.toContain('ask_cover');

    const trusted = schedule.visibleNPCs('classroom', context('上午课', { flags: { teacher_trust: true } }));
    expect(trusted.find((npc) => npc.npcId === 'teacher')?.interactionIds).toContain('ask_cover');

    const afterSchool = schedule.visibleNPCs('classroom', context('放学后'));
    expect(afterSchool.some((npc) => npc.npcId === 'c_monitor')).toBe(false);
    expect(schedule.visibleNPCs('corridor', context('放学后')).some((npc) => npc.npcId === 'patrol_teacher')).toBe(true);
  });

  it('updates availability and interaction choices from run state', () => {
    const exposed = schedule.visibleNPCs('classroom', context('上午课', { flags: { climax_expose: true } }));
    const teacher = exposed.find((npc) => npc.npcId === 'teacher');
    expect(teacher?.available).toBe(false);

    const sports = schedule.visibleNPCs('classroom', context('上午课', {
      stats: { energy: 60, morale: 60, suspicion: 0, money: 10, circles: { 学霸圈: 0, 混混圈: 20, 边缘圈: 0, 文艺圈: 0, 怪胎圈: 0 } },
    })).find((npc) => npc.npcId === 'c_sports');
    expect(sports?.interactionIds).toContain('invite_help');
  });

  it('finds the nearest available NPC within a radius', () => {
    const found = schedule.nearestAvailableNpc('classroom', 820, 280, context('上午课'), 50);
    expect(found?.npcId).toBe('c_sports');
    expect(schedule.nearestAvailableNpc('classroom', 820, 280, context('上午课'), 4)).toBeUndefined();
  });

  it('treats scene bounds and obstacles as non-walkable', () => {
    expect(schedule.isWalkable('classroom', 100, 500)).toBe(true);
    expect(schedule.isWalkable('classroom', 0, 0)).toBe(false);
    expect(schedule.isWalkable('classroom', 480, 150)).toBe(false); // teacher desk
    expect(schedule.isWalkable('classroom', 480, 150, 1)).toBe(false);
  });
});
