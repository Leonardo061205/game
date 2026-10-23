import scenesJson from './scenes.json';
import { NPCScheduleSystem, type SceneDefinition } from '../core/NPCScheduleSystem';

export const sceneDefinitions = scenesJson as SceneDefinition[];
export const npcScheduleSystem = new NPCScheduleSystem(sceneDefinitions);
