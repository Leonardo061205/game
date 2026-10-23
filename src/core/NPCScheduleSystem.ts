import type { Primitive, RunState, TimeSlot } from '../types/game';

export type CampusSceneId = 'classroom' | 'corridor' | 'canteen' | 'playground';
export type NpcEmotion = 'focused' | 'cheerful' | 'bored' | 'wary' | 'excited' | 'tired' | 'angry';

export interface SceneBounds { width: number; height: number; }
export interface SceneObstacle { id: string; x: number; y: number; width: number; height: number; label?: string; }
export interface SceneProp { id: string; kind: string; label: string; x: number; y: number; width: number; height: number; solid?: boolean; actionId?: string; }
export interface SceneNpcSpawn {
  npcId: string;
  name: string;
  role: string;
  x: number;
  y: number;
  emotion: NpcEmotion;
  schedule: Partial<Record<TimeSlot, CampusSceneId | 'away'>>;
  traits: string[];
}
export interface SceneDefinition {
  id: CampusSceneId;
  name: string;
  subtitle: string;
  bounds: SceneBounds;
  obstacles: SceneObstacle[];
  props: SceneProp[];
  npcs: SceneNpcSpawn[];
}

export interface ScheduledNpc extends SceneNpcSpawn {
  sceneId: CampusSceneId;
  available: boolean;
  interactionIds: string[];
}

export interface ScheduleContext {
  slot: TimeSlot;
  state?: Pick<RunState, 'absoluteDay' | 'flags' | 'relationships' | 'stats'>;
}

const DEFAULT_INTERACTIONS = ['talk', 'ask_news', 'view_relationship'];

export class NPCScheduleSystem {
  private readonly scenes: Map<CampusSceneId, SceneDefinition>;
  private readonly npcIndex = new Map<string, SceneNpcSpawn>();

  public constructor(sceneData: SceneDefinition[]) {
    this.scenes = new Map(sceneData.map((scene) => [scene.id, scene]));
    for (const scene of sceneData) for (const npc of scene.npcs) this.npcIndex.set(npc.npcId, npc);
  }

  public getScene(sceneId: CampusSceneId): SceneDefinition {
    const scene = this.scenes.get(sceneId);
    if (!scene) throw new Error(`Unknown campus scene: ${sceneId}`);
    return scene;
  }

  public allScenes(): SceneDefinition[] { return [...this.scenes.values()]; }

  public visibleNPCs(sceneId: CampusSceneId, context: ScheduleContext): ScheduledNpc[] {
    this.getScene(sceneId);
    return [...this.npcIndex.values()]
      .filter((npc) => this.locationFor(npc.npcId, context) === sceneId)
      .map((npc) => ({
        ...npc,
        sceneId,
        available: this.isAvailable(npc, context),
        interactionIds: this.interactionsFor(npc, context),
      }));
  }

  public locationFor(npcId: string, context: ScheduleContext): CampusSceneId | 'away' {
    const npc = this.npcIndex.get(npcId);
    if (!npc) return 'away';
    const scheduled = npc.schedule[context.slot];
    if (scheduled) return scheduled;
    return this.defaultLocation(npc);
  }

  public findNpc(npcId: string): SceneNpcSpawn | undefined { return this.npcIndex.get(npcId); }

  public propsAt(sceneId: CampusSceneId): SceneProp[] { return this.getScene(sceneId).props; }

  public nearestAvailableNpc(sceneId: CampusSceneId, x: number, y: number, context: ScheduleContext, maxDistance = 110): ScheduledNpc | undefined {
    return this.visibleNPCs(sceneId, context)
      .filter((npc) => npc.available)
      .map((npc) => ({ npc, distance: Math.hypot(npc.x - x, npc.y - y) }))
      .filter((entry) => entry.distance <= maxDistance)
      .sort((left, right) => left.distance - right.distance)[0]?.npc;
  }

  public isWalkable(sceneId: CampusSceneId, x: number, y: number, radius = 16): boolean {
    const scene = this.getScene(sceneId);
    if (x < radius || y < radius || x > scene.bounds.width - radius || y > scene.bounds.height - radius) return false;
    return scene.obstacles.every((obstacle) => !intersectsCircle(obstacle, x, y, radius));
  }

  private interactionsFor(npc: SceneNpcSpawn, context: ScheduleContext): string[] {
    const ids = [...DEFAULT_INTERACTIONS];
    if (npc.npcId === 'c_monitor' && context.slot === '放学后') ids.push('invite_help');
    if (npc.npcId === 'c_sports' && context.slot === '放学后') ids.push('一起活动');
    if (npc.npcId === 'teacher' && context.slot !== '午休') ids.push('classroom_action');
    if (context.state?.flags.teacher_trust === true && npc.npcId === 'teacher') ids.push('ask_cover');
    if ((context.state?.stats.circles['混混圈'] ?? 0) >= 20 && npc.npcId === 'c_sports') ids.push('invite_help');
    return ids;
  }

  private isAvailable(npc: SceneNpcSpawn, context: ScheduleContext): boolean {
    if (npc.npcId === 'teacher' && context.state?.flags.climax_expose === true) return false;
    return true;
  }

  private defaultLocation(npc: SceneNpcSpawn): CampusSceneId | 'away' {
    if (npc.role.includes('老师')) return 'classroom';
    if (npc.npcId === 'shopkeeper') return 'canteen';
    return 'classroom';
  }
}

function intersectsCircle(rect: SceneObstacle, x: number, y: number, radius: number): boolean {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  return Math.hypot(x - closestX, y - closestY) < radius;
}

export function isCampusSceneId(value: Primitive): value is CampusSceneId {
  return value === 'classroom' || value === 'corridor' || value === 'canteen' || value === 'playground';
}
