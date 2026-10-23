import Phaser from 'phaser';
import './styles.css';
import { EventEngine } from './core/EventEngine';
import { GameState } from './core/GameState';
import { SaveSystem } from './core/SaveSystem';
import { BackdropScene } from './scenes/BackdropScene';
import { AppView } from './ui/AppView';
import { events } from './data/runtimeData';

const phaserRoot = document.querySelector<HTMLElement>('#phaser-root');
const root = document.querySelector<HTMLElement>('#ui-root');
if (!root || !phaserRoot) throw new Error('Missing game roots');

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  parent: phaserRoot,
  transparent: true,
  render: { antialias: true, pixelArt: false },
  scene: [BackdropScene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
});
const canvas = game.canvas;
if (canvas) canvas.dataset.testid = 'game-canvas';
const view = new AppView(root, new GameState(new SaveSystem()), new EventEngine(events));
view.renderTitle();
