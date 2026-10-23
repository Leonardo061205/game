import Phaser from 'phaser';

export class BackdropScene extends Phaser.Scene {
  public constructor() { super('BackdropScene'); }

  public create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x151b2e, 0x151b2e, 0x273653, 0x273653, 1);
    gradient.fillRect(0, 0, width, height);
    gradient.fillStyle(0xe2a84b, 0.12);
    gradient.fillCircle(width * 0.78, height * 0.22, Math.min(width, height) * 0.18);
    gradient.fillStyle(0x7bd3c6, 0.08);
    gradient.fillCircle(width * 0.16, height * 0.82, Math.min(width, height) * 0.28);
    const chalk = this.add.text(width * 0.5, height * 0.2, '校园搞事RPG', {
      fontFamily: 'system-ui, sans-serif', fontSize: Math.max(24, width * 0.06), color: '#f5e9d0',
      fontStyle: 'bold', stroke: '#151b2e', strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0.16);
    chalk.setDepth(-1);
  }
}
