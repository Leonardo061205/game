import Phaser from 'phaser';
import './styles.css';
import { EventEngine } from './core/EventEngine';
import { GameState } from './core/GameState';
import { InteractionSystem } from './core/InteractionSystem';
import { NPCScheduleSystem } from './core/NPCScheduleSystem';
import { SaveSystem } from './core/SaveSystem';
import { sceneDefinitions } from './data/sceneRuntimeData';
import { events } from './data/runtimeData';
import { CampusScene } from './scenes/CampusScene';
import { AppView } from './ui/AppView';

const phaserRoot = document.querySelector<HTMLElement>('#phaser-root');
const root = document.querySelector<HTMLElement>('#ui-root');
if (!root || !phaserRoot) throw new Error('Missing game roots');

const gameState = new GameState(new SaveSystem());
const eventEngine = new EventEngine(events);
const schedule = new NPCScheduleSystem(sceneDefinitions);
const campusScene = new CampusScene();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: phaserRoot,
  transparent: false,
  backgroundColor: '#18243a',
  render: { antialias: true, pixelArt: false },
  scene: [campusScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 960, height: 540 },
});
const canvas = game.canvas;
if (canvas) canvas.dataset.testid = 'game-canvas';
const view = new AppView(root, gameState, eventEngine, campusScene, schedule, new InteractionSystem());
view.renderTitle();
