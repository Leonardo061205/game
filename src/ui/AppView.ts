import type { EventChoice, GameEvent, LocationId, RunState } from '../types/game';
import { EventEngine } from '../core/EventEngine';
import { GameState } from '../core/GameState';
import { InteractionSystem } from '../core/InteractionSystem';
import { NPCScheduleSystem, isCampusSceneId } from '../core/NPCScheduleSystem';
import { formatDate, slotForIndex } from '../core/TimeSystem';
import { characters } from '../data/runtimeData';
import { CampusScene, visualNpcFromSchedule, type CampusLocation } from '../scenes/CampusScene';

const locationOrder: LocationId[] = ['classroom', 'corridor', 'canteen', 'playground', 'rooftop', 'toilet'];
const locationNames: Record<LocationId, string> = { classroom: '教室', corridor: '走廊', canteen: '小卖部', playground: '操场', rooftop: '天台', toilet: '厕所' };
const itemLabels: Record<string, string> = {
  'blackboard': '黑板', 'chalk-box': '粉笔盒', 'paper-stack': '纸条', 'desk_note': '课桌上的纸条', 'back-door': '后门', 'back_door': '后门',
  'window-seat': '后窗', 'notice': '月考公告', 'notice_board': '公告栏', 'notice-canteen': '小卖部传闻', 'ledger': '赊账本', 'snack-rack': '辣条货架', 'snack_shelf': '辣条货架',
  'basketball': '篮球', 'track_notice': '操场公告', 'loudspeaker': '广播喇叭', 'water-fountain': '饮水机', 'classroom_door': '隔壁班门牌', 'bell': '下课铃按钮',
};
const itemActions: Record<string, { id: string; label: string; hint: string }> = {
  'blackboard': { id: 'inspect_blackboard', label: '查看黑板', hint: '找找今天值日表背后的空白。' },
  'chalk-box': { id: 'throw_chalk', label: '拿起粉笔', hint: '搞事会消耗一个时段。' },
  'paper-stack': { id: 'pass_note', label: '写一张纸条', hint: '把消息送到后排。' },
  'desk_note': { id: 'read_note', label: '拆开纸条', hint: '里面可能是情报，也可能是坑。' },
  'ledger': { id: 'inspect_ledger', label: '查看赊账本', hint: '老板娘不喜欢别人翻最后一页。' },
  'snack-rack': { id: 'buy_snack', label: '买一包辣条', hint: '花 5 元，获得可赠送物品。' },
  'snack_shelf': { id: 'buy_snack', label: '买一包辣条', hint: '花 5 元，获得可赠送物品。' },
  'basketball': { id: 'play_ball', label: '投几球', hint: '消耗体力，提升心态和混混圈。' },
  'track_notice': { id: 'read_track_notice', label: '读操场公告', hint: '广播里有一条新通知。' },
  'notice': { id: 'read_notice', label: '读月考公告', hint: '记住检查日期。' },
  'notice_board': { id: 'read_notice', label: '读公告栏', hint: '看看哪个班又被点名。' },
  'notice-canteen': { id: 'ask_shop_news', label: '看传闻', hint: '传闻也会留下来源。' },
  'loudspeaker': { id: 'listen_broadcast', label: '听广播', hint: '广播声里藏着老师的安排。' },
  'water-fountain': { id: 'drink_water', label: '接水休息', hint: '恢复一点体力，不消耗时段。' },
  'back-door': { id: 'leave_classroom', label: '靠近后门', hint: '可以从地图前往其他地点。' },
  'back_door': { id: 'leave_classroom', label: '靠近后门', hint: '可以从地图前往其他地点。' },
};

interface SelectedNpc { id: string; name: string; role: string; traits: string[]; }

export class AppView {
  private readonly root: HTMLElement;
  private readonly gameState: GameState;
  private readonly engine: EventEngine;
  private readonly campus: CampusScene;
  private readonly schedule: NPCScheduleSystem;
  private readonly interactionSystem: InteractionSystem;
  private currentEvent: GameEvent | null = null;
  private selectedNpc: SelectedNpc | null = null;
  private selectedItem: { id: string; label: string } | null = null;
  private started = false;
  private resolving = false;
  private phaseComplete = false;
  private mapOpen = false;
  private sceneEventsBound = false;
  private pendingEventTimer: number | undefined;

  public constructor(root: HTMLElement, gameState: GameState, engine: EventEngine, campus: CampusScene, schedule: NPCScheduleSystem, interactionSystem: InteractionSystem) {
    this.root = root;
    this.gameState = gameState;
    this.engine = engine;
    this.campus = campus;
    this.schedule = schedule;
    this.interactionSystem = interactionSystem;
    this.gameState.subscribe((state) => { if (this.started) this.renderGame(state); });
    this.bindCampusEvents();
    this.root.addEventListener('pointerdown', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-location], [data-action=\"toggle-map\"]');
      if (target) this.clearEventTimer();
    });
    this.root.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-location]');
      
      if (target?.dataset.location) this.changeLocation(target.dataset.location as LocationId);
    });
  }

  private bindCampusEvents(): void {
    if (this.sceneEventsBound) return;
    const events = (this.campus as unknown as { events?: Phaser.Events.EventEmitter }).events;
    if (!events) { window.setTimeout(() => this.bindCampusEvents(), 0); return; }
    this.sceneEventsBound = true;
    events.on('npc-selected', (payload: { id: string }) => { if (this.started) this.selectNpc(payload.id); });
    events.on('item-selected', (payload: { id: string }) => { if (this.started) this.selectItem(payload.id); });
    events.on('location-ready', () => { if (this.started) this.syncSceneActors(this.gameState.run); });
  }

  public renderTitle(): void {
    this.clearEventTimer();
    this.started = false;
    const existing = this.gameState.run.absoluteDay > 1 || this.gameState.run.logs.length > 1;
    this.root.innerHTML = `
      <main class="title-screen" data-testid="title-screen">
        <div class="title-copy"><p class="eyebrow">PHASE 1 · 可视化垂直切片</p><h1>校园搞事RPG</h1><p>你不是旁观者。走进教室，找到那个会帮你圆场的人，然后承担每一次行动的后果。</p></div>
        <section class="character-card"><div class="avatar avatar-monitor">班</div><div><h2>班长 · 学霸圈</h2><p>体力 60 · 心态 70 · 怀疑 10 · 金钱 20</p><p class="muted">老师眼里的可靠人，课桌底下也藏着没交的检讨。</p></div></section>
        <div class="title-actions"><button class="primary" data-testid="start-button" data-action="start">${existing ? '重新开始班长线' : '开始班长线'}</button>${existing ? '<button class="secondary" data-testid="continue-button" data-action="continue">继续上次进度（'+formatDate(this.gameState.run.absoluteDay)+'）</button>' : ''}</div>
        ${this.gameState.loadWarning ? '<p class="warning" data-testid="save-warning">上次存档无法读取，已为你准备新的班长线。</p>' : ''}<p class="tip">原创矢量人物 · 场景点击移动 · 本地自动保存</p>
      </main>`;
    this.bindActions();
  }

  private start(newRun: boolean): void {
    if (newRun) this.gameState.startNewRun('c_monitor'); else this.gameState.restore();
    this.clearEventTimer();
    this.started = true;
    this.phaseComplete = this.gameState.run.completed;
    this.currentEvent = null;
    this.selectedNpc = null;
    this.selectedItem = null;
    this.campus.setLocation('classroom');
    this.renderGame(this.gameState.run);
    this.syncSceneActors(this.gameState.run);
    if (!this.phaseComplete) this.presentEvent();
  }

  private renderGame(state: RunState): void {
    const character = characters.find((entry) => entry.id === state.characterId) ?? characters[0]!;
    const event = this.currentEvent;
    const logHtml = state.logs.slice(0, 8).map((log) => `<li>${escapeHtml(log)}</li>`).join('');
    const outcome = state.lastOutcome ? `<span class="outcome outcome-${state.lastOutcome}">${outcomeLabel(state.lastOutcome)}</span>` : '';
    const selectedPanel = this.selectedNpc ? this.renderNpcPanel(state) : this.selectedItem ? this.renderItemPanel() : this.renderEventPanel(state, event);
    this.root.innerHTML = `
      <main class="game-shell" data-testid="game-shell">
        <header class="hud" data-testid="hud"><div class="brand"><span class="brand-mark">班</span><div><strong>校园搞事RPG</strong><small>${character.name} · ${character.circle}</small></div></div><div class="date-block"><span data-testid="hud-date">${formatDate(state.absoluteDay)}</span><span class="dot">·</span><span data-testid="hud-period">${slotForIndex(state.slotIndex)}</span></div><div class="resource-row" data-testid="resource-row"><span class="resource energy"><i></i>体力 ${state.stats.energy}</span><span class="resource morale"><i></i>心态 ${state.stats.morale}</span><span class="resource suspicion"><i></i>怀疑 ${state.stats.suspicion}</span><span class="resource money">金钱 ¥${state.stats.money}</span></div></header>
        <section class="world-stage" data-testid="world-stage"><div class="world-hint">点击地面移动 · 点击人物互动 · WASD / 方向键 · E 近处互动</div><div class="world-location" data-testid="world-location">${locationNames[state.location]}</div>${outcome ? `<div class="world-outcome">${outcome}</div>` : ''}</section>
        <section class="interaction-panel" data-testid="interaction-panel">${selectedPanel}</section>
        <aside class="side-drawer ${this.mapOpen ? 'open' : ''}" data-testid="side-drawer"><div class="drawer-tabs"><button data-action="toggle-map">${this.mapOpen ? '收起地图' : '校园地图'}</button><button data-action="toggle-bag">背包 ${state.items.length}</button><button data-action="toggle-log">日志</button></div>${this.mapOpen ? this.renderMap(state) : ''}</aside>
        <section class="log-panel" data-testid="log-panel"><div class="panel-heading"><h3>最近发生</h3><div><button class="small-button" data-testid="save-button" data-action="save">手动保存</button><button class="small-button" data-action="title">返回标题</button></div></div><ol data-testid="event-log">${logHtml}</ol></section>
      </main>`;
    this.bindActions();
  }

  private renderEventPanel(state: RunState, event: GameEvent | null): string {
    const choices = event ? this.engine.choicesFor(event, state) : [];
    const choiceHtml = choices.map((choice) => this.choiceButton(choice)).join('');
    return `<div class="panel-heading"><div><span class="tag">${event ? '当前行动' : '等待中'}</span><span class="muted panel-location">${locationNames[state.location]}</span></div><span class="muted">${slotForIndex(state.slotIndex)}</span></div><h2 data-testid="event-title">${event ? escapeHtml(event.title) : '校园里暂时没有安排'}</h2><p class="description" data-testid="event-description">${event ? escapeHtml(event.description) : '点击同学、老师或场景物品，正式行动会推进时段。移动本身不会消耗时间。'}</p><div class="choices" data-testid="choices">${choiceHtml || '<p class="muted">先走近一个人或打开地图。</p>'}</div>${this.phaseComplete ? '<div class="ending-card" data-testid="phase-complete"><strong>三日可视化试读完成</strong><p>你已经在校园里留下了足够多的痕迹。</p><button class="primary" data-action="restart">再走一次</button></div>' : ''}`;
  }

  private renderNpcPanel(state: RunState): string {
    const npc = this.selectedNpc!;
    const options = this.interactionSystem.options(npc.id, state);
    const optionsHtml = options.map((action) => `<button class="choice-button interaction-choice" data-testid="interaction-${action.id}" data-interaction="${action.id}"><span>${escapeHtml(action.label)}</span><small>${escapeHtml(action.hint)}</small></button>`).join('');
    return `<div class="npc-header"><div class="mini-portrait"></div><div><span class="tag">人物互动</span><h2 data-testid="npc-name">${escapeHtml(npc.name)}</h2><p class="muted">${escapeHtml(npc.role)} · ${npc.traits.map(escapeHtml).join(' / ')}</p></div><button class="close-button" data-action="clear-selection">×</button></div><p class="description">他现在就在${locationNames[state.location]}。接近之后才会听见真正的话。</p><div class="choices" data-testid="npc-actions">${optionsHtml}</div>`;
  }

  private renderItemPanel(): string {
    const item = this.selectedItem!;
    const action = itemActions[item.id] ?? { id: item.id, label: '查看', hint: '观察这个场景物品。' };
    return `<div class="panel-heading"><span class="tag">场景物品</span><button class="close-button" data-action="clear-selection">×</button></div><h2 data-testid="item-name">${escapeHtml(item.label)}</h2><p class="description">${escapeHtml(action.hint)}</p><div class="choices"><button class="choice-button" data-testid="item-action" data-item-action="${action.id}"><span>${escapeHtml(action.label)}</span><small>行动会留下日志；部分行动会推进时段。</small></button></div>`;
  }

  private renderMap(state: RunState): string {
    return `<div class="map-card"><p class="eyebrow">开放地点</p><h3>你要去哪儿？</h3><div class="map-grid">${(['classroom', 'corridor', 'canteen', 'playground'] as LocationId[]).map((location) => `<button class="map-location ${state.location === location ? 'active' : ''}" data-location="${location}"><strong>${locationNames[location]}</strong><small>${this.locationHint(location)}</small></button>`).join('')}</div><p class="muted map-note">移动不消耗时段，正式行动才会推进日程。</p></div>`;
  }

  private choiceButton(choice: EventChoice): string { return `<button class="choice-button" data-testid="choice-${choice.id}" data-choice="${choice.id}"><span>${escapeHtml(choice.label)}</span><small>${escapeHtml(choice.hint)}</small></button>`; }

  private selectNpc(id: string): void {
    const npc = this.schedule.findNpc(id);
    this.selectedNpc = npc ? { id, name: npc.name, role: npc.role, traits: npc.traits } : { id, name: id, role: '校园人物', traits: [] };
    this.selectedItem = null;
    this.renderGame(this.gameState.run);
  }

  private selectItem(id: string): void {
    this.selectedItem = { id, label: itemLabels[id] ?? id };
    this.selectedNpc = null;
    this.renderGame(this.gameState.run);
  }

  private executeInteraction(actionId: string): void {
    if (this.resolving || !this.selectedNpc) return;
    const action = this.interactionSystem.options(this.selectedNpc.id, this.gameState.run).find((entry) => entry.id === actionId);
    if (!action) return;
    this.commitAction(action.effects, action.resultText, action.timeCost);
  }

  private executeItem(actionId: string): void {
    if (this.resolving) return;
    const state = this.gameState.run;
    if (actionId === 'buy_snack' && state.stats.money < 5) { this.campus.showFeedback('钱不够，老板娘只给你看货架'); state.logs.unshift('你摸了摸口袋，决定先不买辣条。'); this.renderGame(state); return; }
    const actions: Record<string, { effects: RunState['stats'] extends never ? never : import('../types/game').Effect[]; text: string; time: boolean }> = {
      inspect_blackboard: { effects: [{ flag: { key: 'blackboard_clue', value: true } }, { stat: { suspicion: 2 } }, { log: '黑板槽里夹着一张被撕掉半角的检查表。' }], text: '你记住了黑板背后的半张检查表。', time: true },
      throw_chalk: { effects: [{ stat: { suspicion: 10, morale: 4, energy: -3 } }, { flag: { key: 'chalk_trouble', value: true } }, { log: '粉笔头擦过窗框，整个教室短暂安静。' }], text: '粉笔头飞出去的一刻，你知道老师也看见了。', time: true },
      pass_note: { effects: [{ stat: { suspicion: 7, energy: -2 } }, { flag: { key: 'paper_chain', value: true } }, { log: '纸条在三张课桌之间完成了一次危险旅行。' }], text: '纸条没有立刻暴露，但每个接手的人都记住了你。', time: true },
      read_note: { effects: [{ secret: { id: 'desk_note_secret', action: 'add' } }, { flag: { key: 'read_desk_note', value: true } }, { log: '纸条上只有一句：放学后别走后门。' }], text: '你得到一条没有署名的提醒。', time: true },
      inspect_ledger: { effects: [{ secret: { id: 'ledger_secret', action: 'add' } }, { flag: { key: 'ledger_secret', value: true } }, { stat: { suspicion: 3 } }, { log: '赊账本最后一页写着一个熟悉的笔画。' }], text: '你发现了一个不该被班长发现的名字。', time: true },
      buy_snack: { effects: [{ stat: { money: -5, energy: 5, morale: 2 } }, { item: { id: '辣条', action: 'add' } }, { log: '你买下一包辣条，油纸在口袋里发出很轻的声音。' }], text: '一包辣条成为你今天最可靠的资源。', time: true },
      play_ball: { effects: [{ stat: { energy: -6, morale: 6 } }, { circle: { id: '混混圈', delta: 5 } }, { flag: { key: 'played_ball', value: true } }, { log: '篮球砸在篮板上，阿彪朝你比了个手势。' }], text: '你投进一球，至少在这一分钟里没人问成绩。', time: true },
      read_notice: { effects: [{ flag: { key: 'read_notice', value: true } }, { log: '公告栏上贴着月考和突击检查日期。' }], text: '你把日期记进了脑子。', time: true },
      read_track_notice: { effects: [{ flag: { key: 'heard_broadcast', value: true } }, { log: '操场公告提醒：下午最后一节课后集合。' }], text: '广播的回音比公告更像命令。', time: true },
      listen_broadcast: { effects: [{ flag: { key: 'heard_broadcast', value: true } }, { stat: { suspicion: 1 } }, { log: '广播里传来主任的声音，听起来像在找人。' }], text: '你听清了自己的名字没有被念出来。', time: true },
      drink_water: { effects: [{ stat: { energy: 7 } }, { log: '你在饮水机旁喘了口气。' }], text: '冷水让你重新想起自己还要走很远。', time: false },
      ask_shop_news: { effects: [{ flag: { key: 'shop_rumor', value: true } }, { stat: { suspicion: 2 } }, { log: '小卖部传闻指向后门和一张丢失的答案纸。' }], text: '老板娘没有说出名字，只把目光移向后门。', time: true },
      leave_classroom: { effects: [{ flag: { key: 'left_classroom', value: true } }, { log: '你在后门停了一会儿，决定把脚步带到别的地点。' }], text: '地图上的几个地点向你开放。', time: false },
    };
    const action = actions[actionId];
    if (!action) return;
    this.commitAction(action.effects, action.text, action.time);
  }

  private commitAction(effects: import('../types/game').Effect[], text: string, timeCost: boolean): void {
    if (this.resolving) return;
    this.resolving = true;
    try {
      const state = this.gameState.run;
      this.gameState.applyEffects(effects);
      state.logs.unshift(text);
      this.campus.showFeedback(text);
      this.selectedNpc = null;
      this.selectedItem = null;
      if (timeCost) {
        const messages = this.gameState.advanceTime();
        state.logs.unshift(...messages);
        this.gameState.saveNow();
        this.currentEvent = null;
        this.renderGame(state);
        this.schedulePresentEvent();
      } else {
        this.gameState.saveNow();
        this.renderGame(state);
      }
    } finally { this.resolving = false; }
  }

  private resolveChoice(choiceId: string): void {
    if (this.resolving || !this.currentEvent || this.selectedNpc || this.selectedItem || this.phaseComplete) return;
    this.resolving = true;
    try {
      const state = this.gameState.run;
      const result = this.engine.execute(this.currentEvent, choiceId, state);
      const eventId = this.currentEvent.id;
      this.campus.showFeedback(result.text);
      if (eventId === 'monitor_day3_morning') {
        this.gameState.completeRun(); this.phaseComplete = true; this.currentEvent = null; this.renderGame(state); return;
      }
      const transitionMessages = this.gameState.advanceTime();
      state.logs.unshift(...transitionMessages);
      this.gameState.saveNow();
      this.currentEvent = null;
      this.renderGame(state);
      this.schedulePresentEvent();
    } finally { this.resolving = false; }
  }

  private schedulePresentEvent(): void {
    this.clearEventTimer();
    this.pendingEventTimer = window.setTimeout(() => { this.pendingEventTimer = undefined; this.presentEvent(); }, 350);
  }

  private clearEventTimer(): void {
    if (this.pendingEventTimer !== undefined) { window.clearTimeout(this.pendingEventTimer); this.pendingEventTimer = undefined; }
  }

  private presentEvent(): void {
    if (this.phaseComplete) return;
    const state = this.gameState.run;
    const event = this.engine.selectForState(state, [state.location, ...locationOrder.filter((location) => location !== state.location)]);
    this.currentEvent = event;
    if (state.location !== event.location) { state.location = event.location; this.campus.setLocation(event.location as CampusLocation); }
    this.gameState.beginEvent(event.id);
    this.syncSceneActors(state);
    this.renderGame(state);
  }

  private changeLocation(location: LocationId): void {
    this.clearEventTimer();
    if (!isCampusSceneId(location) && location !== 'rooftop' && location !== 'toilet') return;
    const state = this.gameState.run;
    this.selectedNpc = null; this.selectedItem = null; this.mapOpen = false;
    state.location = location;
    this.currentEvent = this.engine.selectForState(state, [location]);
    this.campus.setLocation(location as CampusLocation);
    this.syncSceneActors(state);
    this.gameState.saveNow();
    this.renderGame(state);
  }

  private syncSceneActors(state: RunState): void {
    const location = state.location as CampusLocation;
    if (!isCampusSceneId(location)) { this.campus.setNpcs([]); return; }
    const visible = this.schedule.visibleNPCs(location, { slot: slotForIndex(state.slotIndex), state });
    this.campus.setNpcs(visible.map(visualNpcFromSchedule));
  }

  private bindActions(): void {
    this.root.querySelectorAll<HTMLElement>('[data-choice]').forEach((button) => button.addEventListener('click', () => this.resolveChoice(button.dataset.choice ?? '')));
    this.root.querySelectorAll<HTMLElement>('[data-interaction]').forEach((button) => button.addEventListener('click', () => this.executeInteraction(button.dataset.interaction ?? '')));
    this.root.querySelectorAll<HTMLElement>('[data-item-action]').forEach((button) => button.addEventListener('click', () => this.executeItem(button.dataset.itemAction ?? '')));
    this.root.querySelectorAll<HTMLElement>('[data-location]').forEach((button) => button.addEventListener('pointerdown', (event) => { event.preventDefault(); this.changeLocation(button.dataset.location as LocationId); }));
    this.root.querySelectorAll<HTMLElement>('[data-action="start"]').forEach((button) => button.addEventListener('click', () => this.start(true)));
    this.root.querySelectorAll<HTMLElement>('[data-action="continue"]').forEach((button) => button.addEventListener('click', () => this.start(false)));
    this.root.querySelectorAll<HTMLElement>('[data-action="restart"]').forEach((button) => button.addEventListener('click', () => this.start(true)));
    this.root.querySelectorAll<HTMLElement>('[data-action="clear-selection"]').forEach((button) => button.addEventListener('click', () => { this.selectedNpc = null; this.selectedItem = null; this.renderGame(this.gameState.run); }));
    this.root.querySelectorAll<HTMLElement>('[data-action="toggle-map"]').forEach((button) => button.addEventListener('click', () => { this.mapOpen = !this.mapOpen; this.renderGame(this.gameState.run); }));
    this.root.querySelectorAll<HTMLElement>('[data-action="toggle-bag"]').forEach((button) => button.addEventListener('click', () => { this.selectedNpc = null; this.selectedItem = null; this.mapOpen = false; this.renderGame(this.gameState.run); }));
    this.root.querySelectorAll<HTMLElement>('[data-action="toggle-log"]').forEach((button) => button.addEventListener('click', () => { document.querySelector('[data-testid="log-panel"]')?.scrollIntoView({ behavior: 'smooth' }); }));
    this.root.querySelectorAll<HTMLElement>('[data-action="save"]').forEach((button) => button.addEventListener('click', () => { this.gameState.saveNow(); button.textContent = '已保存'; window.setTimeout(() => { button.textContent = '手动保存'; }, 1000); }));
    this.root.querySelectorAll<HTMLElement>('[data-action="title"]').forEach((button) => button.addEventListener('click', () => this.renderTitle()));
  }

  private locationHint(location: LocationId): string { return { classroom: '课桌与黑板', corridor: '巡逻与传话', canteen: '辣条与赊账本', playground: '篮球与操场消息', rooftop: '风很大', toilet: '回声很重' }[location]; }
}

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character); }
function outcomeLabel(outcome: NonNullable<RunState['lastOutcome']>): string { return { success: '顺利', failed: '失手', caught: '被抓' }[outcome]; }
