import type { EventChoice, EventContext, GameEvent, RunState } from '../types/game';
import { evaluateCondition } from './ConditionEvaluator';
import { applyEffectsAtomically } from './ResourceSystem';
import { SeededRng, type RandomSource } from './Rng';
import { slotForIndex } from './TimeSystem';

export interface EventResult {
  event: GameEvent;
  choice: EventChoice;
  outcome: 'success' | 'failed' | 'caught';
  messages: string[];
  text: string;
}

export const FALLBACK_EVENT: GameEvent = {
  id: 'default_reflection',
  title: '没有人注意的几分钟',
  description: '这一时段没有特殊事件。你可以休息、观察，或者把脑子里的计划再过一遍。',
  location: 'classroom',
  timeSlots: [...['早自习', '上午课', '眼保健操', '午休', '下午课', '放学后', '晚上'] as const],
  characters: ['c_monitor'],
  conditions: {},
  priority: 0,
  weight: 1,
  repeatPolicy: 'repeatable',
  choices: [
    { id: 'rest', label: '安静休息', hint: '恢复一点体力，降低一点怀疑。', effects: [{ stat: { energy: 4, suspicion: -1 }, log: '你把课本立起来，悄悄喘了口气。' }], resultText: '没人注意到你，但你注意到了自己。' },
    { id: 'observe', label: '观察全班', hint: '获得一点心态和圈子信息。', effects: [{ stat: { morale: 2 }, circle: { id: '边缘圈', delta: 1 }, log: '你记住了几张脸，也记住了谁在躲谁。' }], resultText: '有些事情不需要立刻出手。' },
  ],
  tags: ['fallback'],
};

export class EventEngine {
  private readonly rng: RandomSource;

  public constructor(private readonly events: GameEvent[], rng: RandomSource = new SeededRng(42)) {
    this.rng = rng;
  }

  public eligibleEvents(context: EventContext): GameEvent[] {
    const slot = slotForIndex(context.state.slotIndex);
    return this.events.filter((event) => {
      if (event.location !== context.location) return false;
      if (!event.timeSlots.includes(slot)) return false;
      if (event.characters.length > 0 && !event.characters.includes(context.state.characterId)) return false;
      if (!evaluateCondition(event.conditions, context.state, context.location)) return false;
      if (event.repeatPolicy === 'once' && context.state.triggeredEvents.includes(event.id)) return false;
      if ((context.state.cooldowns[event.id] ?? 0) > 0) return false;
      return true;
    });
  }

  public selectForState(state: RunState, locations: string[]): GameEvent {
    const pools = locations.flatMap((location) => this.eligibleEvents({ state, location: location as EventContext['location'] }));
    if (pools.length === 0) return { ...FALLBACK_EVENT, location: (locations[0] as GameEvent['location'] | undefined) ?? 'classroom' };
    const highest = Math.max(...pools.map((event) => event.priority));
    const priorityPool = pools.filter((event) => event.priority === highest);
    return this.rng.pickWeighted(priorityPool) ?? FALLBACK_EVENT;
  }

  public select(context: EventContext): GameEvent {
    const eligible = this.eligibleEvents(context);
    if (eligible.length === 0) return FALLBACK_EVENT;
    const highest = Math.max(...eligible.map((event) => event.priority));
    const priorityPool = eligible.filter((event) => event.priority === highest);
    return this.rng.pickWeighted(priorityPool) ?? FALLBACK_EVENT;
  }

  public choicesFor(event: GameEvent, state: RunState): EventChoice[] {
    return event.choices.filter((choice) => evaluateCondition(choice.condition, state, state.location));
  }

  public execute(event: GameEvent, choiceId: string, state: RunState): EventResult {
    if (state.currentEventId && state.currentEventId !== event.id) throw new Error('Another event is already resolving');
    const choice = event.choices.find((entry) => entry.id === choiceId);
    if (!choice || !this.choicesFor(event, state).some((entry) => entry.id === choiceId)) throw new Error('Choice is not available');
    const messages = applyEffectsAtomically(state, choice.effects);
    let outcome: EventResult['outcome'] = 'success';
    let text = choice.resultText;
    if (choice.risk) {
      const roll = this.rng.next() * 100;
      const suspicionMultiplier = state.stats.suspicion >= 80 ? 2 : 1;
      const successChance = clampChance(choice.risk.baseChance - Math.max(0, state.stats.suspicion - 40) * 0.25);
      const caughtChance = clampChance(Math.min(choice.risk.caughtChance * suspicionMultiplier, 100 - successChance));
      if (roll < successChance) {
        outcome = 'success';
        if (choice.risk.successEffects) messages.push(...applyEffectsAtomically(state, choice.risk.successEffects));
        text = choice.risk.successText ?? text;
      } else if (roll < successChance + caughtChance) {
        outcome = 'caught';
        if (choice.risk.caughtEffects) messages.push(...applyEffectsAtomically(state, choice.risk.caughtEffects));
        text = choice.risk.caughtText ?? text;
      } else {
        outcome = 'failed';
        if (choice.risk.failEffects) messages.push(...applyEffectsAtomically(state, choice.risk.failEffects));
        text = choice.risk.failText ?? text;
      }
    }
    if (event.repeatPolicy === 'once' && !state.triggeredEvents.includes(event.id)) state.triggeredEvents.push(event.id);
    if (event.cooldown) state.cooldowns[event.id] = event.cooldown;
    state.lastOutcome = outcome;
    state.currentEventId = undefined;
    state.logs.unshift(`${event.title}：${text}`);
    state.logs.push(...messages.filter((message) => message !== text));
    state.logs = state.logs.slice(0, 30);
    return { event, choice, outcome, messages, text };
  }
}

function clampChance(value: number): number {
  return Math.min(100, Math.max(0, value));
}
