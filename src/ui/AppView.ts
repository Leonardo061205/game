import type { GameEvent, EventChoice, LocationId, RunState } from '../types/game';
import { EventEngine } from '../core/EventEngine';
import { GameState } from '../core/GameState';
import { formatDate, slotForIndex } from '../core/TimeSystem';
import { characters } from '../data/runtimeData';

const locationOrder: LocationId[] = ['classroom', 'canteen', 'corridor', 'rooftop', 'toilet'];
const locationNames: Record<LocationId, string> = { classroom: '教室', corridor: '走廊', canteen: '小卖部', rooftop: '天台', toilet: '厕所' };

export class AppView {
  private readonly root: HTMLElement;
  private readonly gameState: GameState;
  private readonly engine: EventEngine;
  private currentEvent: GameEvent | null = null;
  private started = false;
  private resolving = false;
  private phaseComplete = false;

  public constructor(root: HTMLElement, gameState: GameState, engine: EventEngine) {
    this.root = root;
    this.gameState = gameState;
    this.engine = engine;
    this.gameState.subscribe((state) => { if (this.started) this.renderGame(state); });
  }

  public renderTitle(): void {
    this.started = false;
    const existing = this.gameState.run.absoluteDay > 1 || this.gameState.run.logs.length > 1;
    this.root.innerHTML = `
      <main class="title-screen" data-testid="title-screen">
        <div class="title-copy"><p class="eyebrow">PHASE 1 · 三日试读</p><h1>校园搞事RPG</h1><p>每一次选择都留下痕迹。今天你是班长，明天全班会记得你做过什么。</p></div>
        <section class="character-card"><div class="avatar">班</div><div><h2>班长 · 学霸圈</h2><p>体力 60 · 心态 70 · 怀疑 10 · 金钱 20</p><p class="muted">利用老师信任打掩护，搞事被抓也能圆。</p></div></section>
        <div class="title-actions"><button class="primary" data-testid="start-button" data-action="start">${existing ? '重新开始班长线' : '开始班长线'}</button>${existing ? '<button class="secondary" data-testid="continue-button" data-action="continue">继续上次进度（'+formatDate(this.gameState.run.absoluteDay)+'）</button>' : ''}</div>
        ${this.gameState.loadWarning ? '<p class="warning" data-testid="save-warning">上次存档无法读取，已为你准备新的班长线。</p>' : ''}<p class="tip">占位美术 · 本地自动保存 · 手机竖屏优先</p>
      </main>`;
    this.bindActions();
  }

  private start(newRun: boolean): void {
    if (newRun) this.gameState.startNewRun('c_monitor'); else this.gameState.restore();
    this.started = true;
    this.phaseComplete = this.gameState.run.completed;
    this.currentEvent = null;
    this.renderGame(this.gameState.run);
    if (!this.phaseComplete) this.presentEvent();
  }

  private renderGame(state: RunState): void {
    const character = characters.find((entry) => entry.id === state.characterId) ?? characters[0]!;
    const event = this.currentEvent;
    const choices = event ? this.engine.choicesFor(event, state) : [];
    const choiceHtml = choices.map((choice) => this.choiceButton(choice, state)).join('');
    const logHtml = state.logs.slice(0, 8).map((log) => `<li>${escapeHtml(log)}</li>`).join('');
    const outcome = state.lastOutcome ? `<span class="outcome outcome-${state.lastOutcome}">${outcomeLabel(state.lastOutcome)}</span>` : '';
    this.root.innerHTML = `
      <main class="game-shell" data-testid="game-shell">
        <header class="hud">
          <div class="brand"><span class="brand-mark">班</span><div><strong>校园搞事RPG</strong><small>${character.name} · ${character.circle}</small></div></div>
          <div class="date-block"><span data-testid="hud-date">${formatDate(state.absoluteDay)}</span><span class="dot">·</span><span data-testid="hud-period">${slotForIndex(state.slotIndex)}</span></div>
          <div class="resource-row" data-testid="resource-row"><span>⚡ ${state.stats.energy}</span><span>☀ ${state.stats.morale}</span><span>! ${state.stats.suspicion}</span><span>¥ ${state.stats.money}</span></div>
        </header>
        <div class="game-grid">
          <section class="scene-panel"><div class="scene-label">${locationNames[state.location]}</div><div class="scene-art"><div class="window-grid"></div><div class="desk"></div><div class="scene-caption">${sceneCaption(state)}</div></div><div class="status-strip">${outcome}<span>学霸圈 ${state.stats.circles['学霸圈']}</span><span>把柄 ${state.secrets.length}</span><span>物品 ${state.items.length}</span></div></section>
          <section class="dialog-panel"><div class="dialog-heading"><span class="tag">${event ? '事件' : '等待中'}</span><span class="muted">第 ${state.absoluteDay} 天 · ${slotForIndex(state.slotIndex)}</span></div><h2 data-testid="event-title">${event ? escapeHtml(event.title) : '准备你的下一步'}</h2><p class="description" data-testid="event-description">${event ? escapeHtml(event.description) : '每个时段只做一次选择，结果会进入日志并自动保存。'}</p><div class="choices" data-testid="choices">${choiceHtml || '<p class="muted">正在寻找可用事件……</p>'}</div>${this.phaseComplete ? '<div class="ending-card" data-testid="phase-complete"><strong>三日试读完成</strong><p>你已经看见：班长的可靠是一种资源，也是一种代价。</p><button class="primary" data-action="restart">再走一次</button></div>' : ''}</section>
        </div>
        <section class="log-panel"><div class="panel-heading"><h3>最近发生</h3><div><button class="small-button" data-testid="save-button" data-action="save">手动保存</button><button class="small-button" data-action="title">返回标题</button></div></div><ol data-testid="event-log">${logHtml}</ol></section>
      </main>`;
    this.bindActions();
  }

  private choiceButton(choice: EventChoice, state: RunState): string {
    const available = !choice.condition || this.engine.choicesFor(this.currentEvent!, state).some((entry) => entry.id === choice.id);
    return `<button class="choice-button" data-testid="choice-${choice.id}" data-choice="${choice.id}" ${available ? '' : 'disabled'}><span>${escapeHtml(choice.label)}</span><small>${escapeHtml(choice.hint)}</small></button>`;
  }

  private presentEvent(): void {
    if (this.phaseComplete) return;
    const state = this.gameState.run;
    const candidates = locationOrder;
    const event = this.engine.selectForState(state, candidates);
    this.currentEvent = event;
    state.location = event.location;
    this.gameState.beginEvent(event.id);
    this.renderGame(state);
  }

  private resolveChoice(choiceId: string): void {
    if (this.resolving || !this.currentEvent || this.phaseComplete) return;
    this.resolving = true;
    try {
      const state = this.gameState.run;
      const result = this.engine.execute(this.currentEvent, choiceId, state);
      const eventId = this.currentEvent.id;
      if (eventId === 'monitor_day3_morning') {
        this.gameState.completeRun();
        this.phaseComplete = true;
        this.currentEvent = null;
        this.renderGame(state);
        return;
      }
      const transitionMessages = this.gameState.advanceTime();
      state.logs.unshift(...transitionMessages);
      this.gameState.saveNow();
      this.currentEvent = null;
      this.renderGame(state);
      window.setTimeout(() => this.presentEvent(), 80);
      void result;
    } finally {
      this.resolving = false;
    }
  }

  private bindActions(): void {
    this.root.querySelectorAll<HTMLElement>('[data-choice]').forEach((button) => button.addEventListener('click', () => this.resolveChoice(button.dataset.choice ?? '')));
    this.root.querySelectorAll<HTMLElement>('[data-action="start"]').forEach((button) => button.addEventListener('click', () => this.start(true)));
    this.root.querySelectorAll<HTMLElement>('[data-action="continue"]').forEach((button) => button.addEventListener('click', () => this.start(false)));
    this.root.querySelectorAll<HTMLElement>('[data-action="restart"]').forEach((button) => button.addEventListener('click', () => this.start(true)));
    this.root.querySelectorAll<HTMLElement>('[data-action="save"]').forEach((button) => button.addEventListener('click', () => {
      this.gameState.saveNow();
      button.textContent = '已保存';
      window.setTimeout(() => { button.textContent = '手动保存'; }, 1000);
    }));
    this.root.querySelectorAll<HTMLElement>('[data-action="title"]').forEach((button) => button.addEventListener('click', () => this.renderTitle()));
  }
}

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character); }
function outcomeLabel(outcome: NonNullable<RunState['lastOutcome']>): string { return { success: '顺利', failed: '失手', caught: '被抓' }[outcome]; }
function sceneCaption(state: RunState): string { if (state.flags.climax_escape) return '操场的灯亮着，今天没人叫你回教室。'; if (state.flags.climax_expose) return '黑板上的名字还没擦掉，粉笔灰像一层雪。'; if (state.flags.climax_cover) return '后窗安静下来，班主任把检查表折好。'; return '粉笔灰落在窗台上，下一次铃声还没响。'; }
