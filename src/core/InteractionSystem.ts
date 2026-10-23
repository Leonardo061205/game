import interactions from '../data/interactions.json';
import type { Effect, EventCondition, RunState } from '../types/game';
import { evaluateCondition } from './ConditionEvaluator';

export interface InteractionAction {
  id: string;
  label: string;
  hint: string;
  condition?: EventCondition;
  effects: Effect[];
  resultText: string;
  timeCost: boolean;
}

export class InteractionSystem {
  private readonly byNpc = new Map<string, InteractionAction[]>();
  public constructor() {
    for (const entry of interactions as Array<{ npcId: string; actions: InteractionAction[] }>) this.byNpc.set(entry.npcId, entry.actions);
  }

  public options(npcId: string, state: RunState): InteractionAction[] {
    const configured = this.byNpc.get(npcId) ?? this.defaultActions(npcId);
    return configured.filter((action) => !action.condition || evaluateCondition(action.condition, state, state.location));
  }

  private defaultActions(npcId: string): InteractionAction[] {
    return [
      { id: 'talk', label: '交谈', hint: '听听这个人今天的心事。', effects: [{ relationship: { characterId: npcId, delta: 3 } }, { stat: { morale: 1 } }, { log: `你和 ${npcId} 聊了几句，关系有了变化。` }], resultText: '对话没有解决所有问题，但至少留下了下一次见面的理由。', timeCost: true },
      { id: 'ask_news', label: '打听消息', hint: '消息有价值，也有代价。', effects: [{ flag: { key: `heard_${npcId}`, value: true } }, { stat: { suspicion: 2 } }, { log: `你从 ${npcId} 那里听见一条校内消息。` }], resultText: '你把消息记在心里，没有立刻传播。', timeCost: true },
      { id: 'view_relationship', label: '查看关系', hint: '不消耗时段。', effects: [], resultText: '你重新看了一眼这段关系。', timeCost: false },
    ];
  }
}
