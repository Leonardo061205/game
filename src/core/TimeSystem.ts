import { TIME_SLOTS, type Grade, type TimeSlot } from '../types/game';

export const MAX_DAY = 90;

export interface Clock {
  absoluteDay: number;
  slotIndex: number;
}

export function gradeForDay(day: number): Grade {
  if (day <= 30) return '初一';
  if (day <= 60) return '初二';
  return '初三';
}

export function dayInGrade(day: number): number {
  const bounded = Math.min(Math.max(Math.floor(day), 1), MAX_DAY);
  return ((bounded - 1) % 30) + 1;
}

export function slotForIndex(index: number): TimeSlot {
  const safe = Math.min(Math.max(Math.floor(index), 0), TIME_SLOTS.length - 1);
  return TIME_SLOTS[safe] ?? TIME_SLOTS[0];
}

export function formatDate(day: number): string {
  return `${gradeForDay(day)}第${dayInGrade(day)}天`;
}

export function advanceClock(clock: Clock): Clock {
  if (clock.absoluteDay >= MAX_DAY && clock.slotIndex >= TIME_SLOTS.length - 1) {
    return { absoluteDay: MAX_DAY, slotIndex: TIME_SLOTS.length - 1 };
  }
  if (clock.slotIndex < TIME_SLOTS.length - 1) {
    return { absoluteDay: clock.absoluteDay, slotIndex: clock.slotIndex + 1 };
  }
  return { absoluteDay: Math.min(clock.absoluteDay + 1, MAX_DAY), slotIndex: 0 };
}

export function isNight(index: number): boolean {
  return slotForIndex(index) === '晚上';
}
