import Phaser from 'phaser';
import { sceneDefinitions } from '../data/sceneRuntimeData';
import type { SceneNpcSpawn } from '../core/NPCScheduleSystem';

export type CampusLocation = 'classroom' | 'corridor' | 'canteen' | 'playground' | 'rooftop' | 'toilet';
export type NpcMood = 'calm' | 'happy' | 'suspicious' | 'angry' | 'sad';

export interface SceneNpcDefinition {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  color: number;
  hair: number;
  mood?: NpcMood;
  available?: boolean;
}

export interface SceneItemDefinition {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: 'desk' | 'notice' | 'shelf' | 'basket' | 'door' | 'ball';
}

export interface SceneObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CampusSceneData {
  location?: CampusLocation;
  playerName?: string;
  playerColor?: number;
  npcs?: SceneNpcDefinition[];
  items?: SceneItemDefinition[];
  obstacles?: SceneObstacle[];
}

export const CAMPUS_SCENE_DEFINITIONS: Record<CampusLocation, { title: string; tint: number; npcs: SceneNpcDefinition[]; items: SceneItemDefinition[]; obstacles: SceneObstacle[] }> = {
  classroom: {
    title: '初一（3）班教室', tint: 0x365778,
    npcs: [
      { id: 'teacher', name: '班主任', role: '老师', x: 700, y: 175, color: 0x8a5961, hair: 0x2d2731, mood: 'suspicious' },
      { id: 'c_sports', name: '阿勇', role: '体育生', x: 260, y: 330, color: 0x315d7a, hair: 0x221d2a, mood: 'happy' },
      { id: 'c_invisible', name: '小透明', role: '同学', x: 430, y: 330, color: 0x6d5b86, hair: 0x392e3d, mood: 'sad' },
      { id: 'c_art', name: '林墨', role: '文艺委员', x: 600, y: 330, color: 0x9a5f63, hair: 0x362338, mood: 'calm' },
    ],
    items: [
      { id: 'blackboard', label: '黑板', x: 455, y: 105, kind: 'notice' },
      { id: 'desk_note', label: '课桌上的纸条', x: 325, y: 395, kind: 'desk' },
      { id: 'back_door', label: '后门', x: 835, y: 280, kind: 'door' },
    ],
    obstacles: [{ x: 120, y: 235, width: 720, height: 58 }, { x: 120, y: 440, width: 720, height: 42 }],
  },
  corridor: {
    title: '教学楼走廊', tint: 0x416d70,
    npcs: [
      { id: 'patrol_teacher', name: '巡逻老师', role: '教导处', x: 710, y: 220, color: 0x76605b, hair: 0x29242a, mood: 'suspicious' },
      { id: 'corridor_friend', name: '小胖', role: '路过的同学', x: 380, y: 360, color: 0x496a82, hair: 0x29242a, mood: 'happy' },
      { id: 'snitch_hint', name: '告密王', role: '同学', x: 560, y: 265, color: 0x716487, hair: 0x24222f, mood: 'calm' },
    ],
    items: [{ id: 'classroom_door', label: '隔壁班门牌', x: 220, y: 160, kind: 'door' }, { id: 'notice_board', label: '公告栏', x: 840, y: 170, kind: 'notice' }],
    obstacles: [{ x: 80, y: 115, width: 840, height: 35 }, { x: 80, y: 470, width: 840, height: 35 }],
  },
  canteen: {
    title: '校门口小卖部', tint: 0x866344,
    npcs: [
      { id: 'shopkeeper', name: '老板娘', role: '小卖部老板', x: 740, y: 215, color: 0x8c574d, hair: 0x33232b, mood: 'calm' },
      { id: 'canteen_student', name: '眼镜仔', role: '赊账的同学', x: 360, y: 330, color: 0x55708c, hair: 0x222b3a, mood: 'suspicious' },
    ],
    items: [{ id: 'snack_shelf', label: '辣条货架', x: 250, y: 205, kind: 'shelf' }, { id: 'counter', label: '收银台', x: 700, y: 290, kind: 'desk' }],
    obstacles: [{ x: 135, y: 145, width: 190, height: 145 }, { x: 395, y: 145, width: 190, height: 145 }, { x: 655, y: 145, width: 185, height: 145 }],
  },
  playground: {
    title: '操场', tint: 0x4d795d,
    npcs: [
      { id: 'sports_leader', name: '体育生阿勇', role: '混混圈', x: 680, y: 275, color: 0x315d7a, hair: 0x201b27, mood: 'happy' },
      { id: 'runner', name: '短跑女生', role: '体育委员', x: 370, y: 350, color: 0x9a5f63, hair: 0x2d2731, mood: 'calm' },
    ],
    items: [{ id: 'basketball', label: '篮球', x: 565, y: 375, kind: 'ball' }, { id: 'track_notice', label: '操场公告', x: 200, y: 210, kind: 'notice' }],
    obstacles: [{ x: 430, y: 150, width: 260, height: 28 }, { x: 700, y: 150, width: 28, height: 220 }],
  },
  rooftop: { title: '教学楼天台', tint: 0x4d526b, npcs: [], items: [{ id: 'roof_exit', label: '天台门', x: 130, y: 190, kind: 'door' }], obstacles: [{ x: 80, y: 110, width: 840, height: 28 }] },
  toilet: { title: '厕所', tint: 0x536b79, npcs: [], items: [{ id: 'toilet_window', label: '小窗', x: 700, y: 180, kind: 'notice' }], obstacles: [{ x: 320, y: 220, width: 300, height: 45 }] },
};


const generatedSceneDefinitions = Object.fromEntries(sceneDefinitions.map((scene) => [scene.id, {
  title: scene.name,
  tint: scene.id === 'classroom' ? 0x365778 : scene.id === 'corridor' ? 0x416d70 : scene.id === 'canteen' ? 0x866344 : 0x4d795d,
  npcs: [...new Map(sceneDefinitions.flatMap((entry) => entry.npcs).map((npc) => [npc.npcId, visualNpcFromSchedule(npc)])).values()],
  items: scene.props.map((prop) => ({ id: prop.id, label: prop.label, x: prop.x, y: prop.y, kind: visualItemKind(prop.kind) })),
  obstacles: scene.obstacles.map((obstacle) => ({ x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height })),
}])) as Partial<Record<CampusLocation, (typeof CAMPUS_SCENE_DEFINITIONS)[CampusLocation]>>;
Object.assign(CAMPUS_SCENE_DEFINITIONS, generatedSceneDefinitions);

export function visualNpcFromSchedule(npc: Pick<SceneNpcSpawn, 'npcId' | 'name' | 'role' | 'x' | 'y' | 'emotion'>): SceneNpcDefinition {
  const palette = [0x315d7a, 0x6d5b86, 0x9a5f63, 0x5e8068, 0x8a5961, 0x76605b];
  const hairPalette = [0x221d2a, 0x392e3d, 0x362338, 0x29242a, 0x33232b];
  const hash = [...npc.npcId].reduce((value, char) => value + char.charCodeAt(0), 0);
  const moods: Record<string, NpcMood> = { focused: 'calm', cheerful: 'happy', bored: 'sad', wary: 'suspicious', excited: 'happy', tired: 'sad', angry: 'angry' };
  return { id: npc.npcId, name: npc.name, role: npc.role, x: npc.x, y: npc.y, color: palette[hash % palette.length]!, hair: hairPalette[hash % hairPalette.length]!, mood: moods[npc.emotion] ?? 'calm' };
}

function visualItemKind(kind: string): SceneItemDefinition['kind'] {
  if (kind === 'desk' || kind === 'notice' || kind === 'shelf' || kind === 'basket' || kind === 'door' || kind === 'ball') return kind;
  return 'notice';
}

export class CampusScene extends Phaser.Scene {
  public static readonly KEY = 'CampusScene';
  private location: CampusLocation = 'classroom';
  private player!: Phaser.GameObjects.Container;
  private playerPosition = new Phaser.Math.Vector2(480, 370);
  private targetPosition: Phaser.Math.Vector2 | null = null;
  private readonly npcs = new Map<string, Phaser.GameObjects.Container>();
  private readonly interactives = new Map<string, Phaser.GameObjects.GameObject>();
  private obstacles: SceneObstacle[] = [];
  private keyState!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; E: Phaser.Input.Keyboard.Key };
  private sceneLayer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private pendingInteraction: { id: string; kind: 'npc' | 'item' } | null = null;
  private movementPath: Phaser.Math.Vector2[] = [];
  private lastInteractionId = '';
  private lastInteractionAt = 0;

  public constructor() { super(CampusScene.KEY); }

  public init(data: CampusSceneData = {}): void {
    this.location = data.location ?? 'classroom';
    this.playerPosition.set(480, 430);
  }

  public create(data: CampusSceneData = {}): void {
    const definition = CAMPUS_SCENE_DEFINITIONS[this.location];
    const merged: CampusSceneData = { ...definition, ...data, npcs: data.npcs ?? definition.npcs, items: data.items ?? definition.items, obstacles: data.obstacles ?? definition.obstacles };
    this.sceneLayer = this.add.container(0, 0);
    this.drawBackground(definition.tint, definition.title);
    this.obstacles = merged.obstacles ?? [];
    this.drawObstacles(this.obstacles);
    this.drawItems(merged.items ?? []);
    this.drawNpcs(merged.npcs ?? []);
    this.player = this.drawCharacter(this.playerPosition.x, this.playerPosition.y, merged.playerName ?? '你', merged.playerColor ?? 0xe2a84b, 0x272437, 'happy', true);
    this.sceneLayer.add(this.player);
    this.installInput();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return;
      const point = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      const hit = this.interactiveAt(point.x, point.y);
      if (hit) { this.interactWith(hit.id, hit.kind); return; }
      if (this.isBlocked(point.x, point.y)) return;
      this.movementPath = [];
      this.targetPosition = this.clampToWorld(point);
      this.events.emit('ground-selected', { x: point.x, y: point.y, location: this.location });
    });
    this.events.emit('location-ready', { location: this.location, title: definition.title });
  }

  public update(_time: number, delta: number): void {
    if (!this.player) return;
    const speed = 0.22 * delta;
    const direction = new Phaser.Math.Vector2((this.wasd.D.isDown ? 1 : 0) - (this.wasd.A.isDown ? 1 : 0), (this.wasd.S.isDown ? 1 : 0) - (this.wasd.W.isDown ? 1 : 0));
    if (this.keyState.left.isDown) direction.x -= 1;
    if (this.keyState.right.isDown) direction.x += 1;
    if (this.keyState.up.isDown) direction.y -= 1;
    if (this.keyState.down.isDown) direction.y += 1;
    if (direction.lengthSq() > 0) {
      this.targetPosition = null;
      this.movementPath = [];
      direction.normalize().scale(speed);
      this.tryMove(direction.x, direction.y);
    } else if (this.targetPosition) {
      const deltaPosition = this.targetPosition.clone().subtract(this.playerPosition);
      if (deltaPosition.length() < 4) {
        this.targetPosition = this.movementPath.shift() ?? null;
      } else { deltaPosition.normalize().scale(speed); this.tryMove(deltaPosition.x, deltaPosition.y); }
    }
    this.player.setPosition(this.playerPosition.x, this.playerPosition.y);
    if (this.pendingInteraction) {
      const object = this.interactives.get(this.pendingInteraction.id);
      if (object) {
        const point = object instanceof Phaser.GameObjects.Container ? object : object as Phaser.GameObjects.Zone;
        if (Phaser.Math.Distance.Between(this.playerPosition.x, this.playerPosition.y, point.x, point.y) <= 112) {
          const pending = this.pendingInteraction;
          this.pendingInteraction = null;
          this.emitInteraction(pending.id, pending.kind);
        }
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) this.interactNearest();
  }


  public setNpcs(npcs: SceneNpcDefinition[]): void {
    for (const npc of this.npcs.values()) npc.destroy(true);
    this.npcs.clear();
    for (const [id, object] of [...this.interactives.entries()]) if (!this.npcs.has(id) && object instanceof Phaser.GameObjects.Container) this.interactives.delete(id);
    this.drawNpcs(npcs);
  }

  public showFeedback(message: string): void {
    if (!this.sceneLayer) return;
    const bubble = this.add.text(this.playerPosition.x, this.playerPosition.y - 75, message, { fontFamily: 'sans-serif', fontSize: '16px', color: '#fff4d6', backgroundColor: '#18243ddd', padding: { x: 10, y: 7 }, align: 'center', wordWrap: { width: 260 } }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({ targets: bubble, y: bubble.y - 28, alpha: 0, duration: 1500, ease: 'Cubic.easeOut', onComplete: () => bubble.destroy() });
  }

  public setLocation(location: CampusLocation, data: CampusSceneData = {}): void {
    this.pendingInteraction = null;
    this.location = location;
    this.scene.restart({ ...data, location });
  }

  public getLocation(): CampusLocation { return this.location; }
  public getPlayerPosition(): Phaser.Math.Vector2 { return this.playerPosition.clone(); }

  private installInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input unavailable');
    this.keyState = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys('W,A,S,D,E') as { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; E: Phaser.Input.Keyboard.Key };
  }

  private drawBackground(tint: number, title: string): void {
    const width = this.scale.width || 960;
    const height = this.scale.height || 640;
    const bg = this.add.graphics();
    bg.fillStyle(tint, 1); bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x101a2a, 0.16); bg.fillRect(34, 70, width - 68, height - 105);
    bg.lineStyle(4, 0xf3d69b, 0.25); bg.strokeRect(34, 70, width - 68, height - 105);
    this.drawLocationArt(bg, this.location, width, height);
    this.titleText = this.add.text(55, 82, title, { fontFamily: 'sans-serif', fontSize: '22px', color: '#fff0ca', fontStyle: 'bold' });
    this.sceneLayer.add([bg, this.titleText]);
  }

  private drawLocationArt(graphics: Phaser.GameObjects.Graphics, location: CampusLocation, width: number, height: number): void {
    graphics.fillStyle(0xe5c28c, 0.16);
    if (location === 'classroom') {
      graphics.fillRect(130, 125, 710, 86); graphics.fillStyle(0x25334b, 1); graphics.fillRect(355, 120, 205, 62);
      graphics.lineStyle(5, 0xdec18d, 0.5); graphics.strokeRect(355, 120, 205, 62);
      for (let x = 190; x < 800; x += 130) { graphics.fillStyle(0x996341, 1); graphics.fillRect(x, 305, 72, 18); graphics.fillRect(x + 8, 323, 8, 48); graphics.fillRect(x + 56, 323, 8, 48); }
      graphics.fillStyle(0x6f83a1, 0.45); graphics.fillRect(70, 125, 55, 250); graphics.fillRect(850, 125, 55, 250);
    } else if (location === 'corridor') {
      graphics.fillStyle(0xb18b63, 0.45); graphics.fillRect(76, 150, width - 152, 46); graphics.fillRect(76, height - 170, width - 152, 52);
      graphics.fillStyle(0xd9b77c, 0.33); graphics.fillRect(120, 205, 170, 160); graphics.fillRect(715, 205, 170, 160);
      graphics.lineStyle(4, 0xf3d69b, 0.35); graphics.strokeRect(120, 205, 170, 160); graphics.strokeRect(715, 205, 170, 160);
    } else if (location === 'canteen') {
      graphics.fillStyle(0xead0a0, 0.28); graphics.fillRect(110, 130, 760, 205); graphics.fillStyle(0x5b3c2d, 0.9); graphics.fillRect(98, 365, 780, 22);
      graphics.fillStyle(0xd97954, 0.7); graphics.fillCircle(220, 205, 28); graphics.fillCircle(470, 205, 28); graphics.fillCircle(730, 205, 28);
    } else if (location === 'playground') {
      graphics.lineStyle(12, 0xe9b578, 0.7); graphics.strokeEllipse(width / 2, 350, width - 170, 355); graphics.lineStyle(4, 0xe9b578, 0.45); graphics.strokeLineShape(new Phaser.Geom.Line(90, 350, width - 90, 350));
      graphics.lineStyle(9, 0xd4e0dc, 0.6); graphics.strokeLineShape(new Phaser.Geom.Line(760, 160, 760, 350)); graphics.strokeLineShape(new Phaser.Geom.Line(720, 160, 800, 160));
    } else { graphics.fillStyle(0x253044, 0.45); graphics.fillRect(70, 115, width - 140, height - 160); }
  }

  private drawObstacles(obstacles: SceneObstacle[]): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x101827, 0.22);
    for (const obstacle of obstacles) graphics.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 8);
    this.sceneLayer.add(graphics);
  }

  private drawItems(items: SceneItemDefinition[]): void {
    for (const item of items) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xf0c36b, 1); graphics.fillRoundedRect(item.x - 20, item.y - 12, 40, 24, 5);
      graphics.lineStyle(2, 0x3a2a2b, 0.8); graphics.strokeRoundedRect(item.x - 20, item.y - 12, 40, 24, 5);
      const label = this.add.text(item.x, item.y + 17, item.label, { fontFamily: 'sans-serif', fontSize: '12px', color: '#fff4d6', backgroundColor: '#192236cc', padding: { x: 4, y: 2 } }).setOrigin(0.5);
      const hit = this.add.zone(item.x, item.y, 70, 55).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.interactWith(item.id, 'item'));
      this.interactives.set(item.id, hit); this.sceneLayer.add([graphics, label, hit]);
    }
  }

  private drawNpcs(npcs: SceneNpcDefinition[]): void {
    for (const npc of npcs.filter((entry) => entry.available !== false)) {
      const figure = this.drawCharacter(npc.x, npc.y, npc.name, npc.color, npc.hair, npc.mood ?? 'calm', false);
      figure.setInteractive(new Phaser.Geom.Rectangle(-34, -62, 68, 75), Phaser.Geom.Rectangle.Contains);
      figure.on('pointerdown', () => this.interactWith(npc.id, 'npc'));
      figure.on('pointerover', () => figure.setScale(1.08)); figure.on('pointerout', () => figure.setScale(1));
      this.npcs.set(npc.id, figure); this.interactives.set(npc.id, figure); this.sceneLayer.add(figure);
    }
  }

  private drawCharacter(x: number, y: number, name: string, shirt: number, hair: number, mood: NpcMood, player: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x101827, 0.28); graphics.fillEllipse(0, 24, 45, 12);
    graphics.fillStyle(shirt, 1); graphics.fillRoundedRect(-18, -2, 36, 38, 9); graphics.fillStyle(0xf2d0aa, 1); graphics.fillCircle(0, -25, 17);
    graphics.fillStyle(hair, 1); graphics.fillEllipse(0, -37, 35, 19); graphics.fillStyle(0xf2d0aa, 1); graphics.fillCircle(-11, -25, 3); graphics.fillCircle(11, -25, 3);
    graphics.fillStyle(0x252030, 1); graphics.fillCircle(-6, -26, 2.2); graphics.fillCircle(6, -26, 2.2); graphics.lineStyle(2, 0x7a3e3e, 1);
    if (mood === 'happy') graphics.strokeEllipse(0, -21, 12, 7); else if (mood === 'sad') graphics.strokeEllipse(0, -17, 12, 7); else graphics.strokeLineShape(new Phaser.Geom.Line(-4, -19, 4, -19));
    graphics.fillStyle(0xf2d0aa, 1); graphics.fillRect(-25, 5, 7, 21); graphics.fillRect(18, 5, 7, 21);
    if (player) { graphics.lineStyle(3, 0xe2a84b, 1); graphics.strokeCircle(0, -25, 23); }
    const text = this.add.text(0, 43, name, { fontFamily: 'sans-serif', fontSize: player ? '14px' : '13px', color: player ? '#ffe29a' : '#fff4d6', fontStyle: 'bold', backgroundColor: '#152036cc', padding: { x: 4, y: 2 } }).setOrigin(0.5);
    container.add([graphics, text]); container.setDepth(y);
    return container;
  }

  private interactWith(id: string, kind: 'npc' | 'item'): void {
    const object = this.interactives.get(id);
    if (!object) return;
    const position = object instanceof Phaser.GameObjects.Container ? new Phaser.Math.Vector2(object.x, object.y) : new Phaser.Math.Vector2((object as Phaser.GameObjects.Zone).x, (object as Phaser.GameObjects.Zone).y);
    const distance = Phaser.Math.Distance.Between(this.playerPosition.x, this.playerPosition.y, position.x, position.y);
    if (distance > 105) {
      const direction = position.clone().subtract(this.playerPosition).normalize();
      const approach = this.clampToWorld(position.clone().subtract(direction.scale(78)));
      this.movementPath = this.findPath(this.playerPosition, approach);
      this.targetPosition = this.movementPath.shift() ?? approach;
      this.pendingInteraction = { id, kind };
      return;
    }
    this.emitInteraction(id, kind);
  }

  private emitInteraction(id: string, kind: 'npc' | 'item'): void {
    const now = performance.now();
    if (id === this.lastInteractionId && now - this.lastInteractionAt < 80) return;
    this.lastInteractionId = id;
    this.lastInteractionAt = now;
    const object = this.interactives.get(id) as (Phaser.GameObjects.GameObject & { x: number; y: number }) | undefined;
    if (!object) return;
    this.events.emit(kind === 'npc' ? 'npc-selected' : 'item-selected', { id, location: this.location, distance: Phaser.Math.Distance.Between(this.playerPosition.x, this.playerPosition.y, object.x, object.y) });
  }

  private interactiveAt(x: number, y: number): { id: string; kind: 'npc' | 'item' } | undefined {
    let nearest: { id: string; kind: 'npc' | 'item'; distance: number } | undefined;
    for (const [id, object] of this.interactives) {
      const point = object as Phaser.GameObjects.GameObject & { x: number; y: number };
      const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (distance < 48 && (!nearest || distance < nearest.distance)) nearest = { id, kind: this.npcs.has(id) ? 'npc' : 'item', distance };
    }
    return nearest;
  }

  private interactNearest(): void {
    let closest: { id: string; distance: number; kind: 'npc' | 'item' } | undefined;
    for (const [id, object] of this.interactives) {
      const point = object instanceof Phaser.GameObjects.Container ? object : object as Phaser.GameObjects.Zone;
      const distance = Phaser.Math.Distance.Between(this.playerPosition.x, this.playerPosition.y, point.x, point.y);
      if (distance < 115 && (!closest || distance < closest.distance)) closest = { id, distance, kind: this.npcs.has(id) ? 'npc' : 'item' };
    }
    if (closest) this.interactWith(closest.id, closest.kind);
    else this.events.emit('no-interaction', { location: this.location });
  }


  private findPath(start: Phaser.Math.Vector2, target: Phaser.Math.Vector2): Phaser.Math.Vector2[] {
    const cell = 32;
    const cols = Math.ceil(this.scale.width / cell);
    const rows = Math.ceil(this.scale.height / cell);
    const toKey = (x: number, y: number) => `${x},${y}`;
    const toCell = (point: Phaser.Math.Vector2) => ({ x: Phaser.Math.Clamp(Math.floor(point.x / cell), 1, cols - 2), y: Phaser.Math.Clamp(Math.floor(point.y / cell), 4, rows - 3) });
    const startCell = toCell(start); const targetCell = toCell(target);
    const queue: Array<{ x: number; y: number }> = [startCell];
    const cameFrom = new Map<string, string>();
    const seen = new Set<string>([toKey(startCell.x, startCell.y)]);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
    let reached: { x: number; y: number } | undefined;
    while (queue.length > 0 && queue.length < 2500) {
      const current = queue.shift()!;
      if (Math.hypot(current.x - targetCell.x, current.y - targetCell.y) <= 1) { reached = current; break; }
      for (const [dx, dy] of directions) {
        const next = { x: current.x + dx, y: current.y + dy };
        const key = toKey(next.x, next.y);
        if (next.x < 1 || next.y < 4 || next.x >= cols - 1 || next.y >= rows - 2 || seen.has(key)) continue;
        const center = new Phaser.Math.Vector2(next.x * cell + cell / 2, next.y * cell + cell / 2);
        if (!this.isBlocked(center.x, center.y)) { seen.add(key); cameFrom.set(key, toKey(current.x, current.y)); queue.push(next); }
      }
    }
    if (!reached) return [target];
    const path: Phaser.Math.Vector2[] = [];
    let key = toKey(reached.x, reached.y);
    while (key !== toKey(startCell.x, startCell.y)) {
      const parts = key.split(',');
      const x = Number(parts[0] ?? 0);
      const y = Number(parts[1] ?? 0);
      path.unshift(new Phaser.Math.Vector2(x * cell + cell / 2, y * cell + cell / 2));
      key = cameFrom.get(key) ?? toKey(startCell.x, startCell.y);
    }
    path.push(target);
    return path;
  }

  private tryMove(dx: number, dy: number): void {
    const nextX = this.clampToWorld(new Phaser.Math.Vector2(this.playerPosition.x + dx, this.playerPosition.y)).x;
    const nextY = this.clampToWorld(new Phaser.Math.Vector2(this.playerPosition.x, this.playerPosition.y + dy)).y;
    if (!this.isBlocked(nextX, this.playerPosition.y)) this.playerPosition.x = nextX;
    if (!this.isBlocked(this.playerPosition.x, nextY)) this.playerPosition.y = nextY;
  }

  private isBlocked(x: number, y: number): boolean { return this.obstacles.some((obstacle) => x > obstacle.x - 22 && x < obstacle.x + obstacle.width + 22 && y > obstacle.y - 22 && y < obstacle.y + obstacle.height + 22); }
  private clampToWorld(point: Phaser.Math.Vector2): Phaser.Math.Vector2 { return new Phaser.Math.Vector2(Phaser.Math.Clamp(point.x, 70, this.scale.width - 70), Phaser.Math.Clamp(point.y, 145, this.scale.height - 65)); }
}
