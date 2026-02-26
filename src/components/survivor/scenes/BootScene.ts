import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    // Nothing to load from disk — we generate everything
  }

  create(): void {
    this.generateTextures()
    this.scene.start('MenuScene')
  }

  private generateTextures(): void {
    // ── Player (a rounded hero shape) ──
    const pg = this.make.graphics({ x: 0, y: 0 })
    // Body
    pg.fillStyle(0x3b82f6, 1) // blue-500
    pg.fillCircle(16, 16, 14)
    // Inner highlight
    pg.fillStyle(0x60a5fa, 1) // blue-400
    pg.fillCircle(14, 12, 6)
    // Eyes
    pg.fillStyle(0xffffff, 1)
    pg.fillCircle(11, 13, 3)
    pg.fillCircle(19, 13, 3)
    pg.fillStyle(0x1e293b, 1)
    pg.fillCircle(12, 13, 1.5)
    pg.fillCircle(20, 13, 1.5)
    pg.generateTexture('player', 32, 32)
    pg.destroy()

    // ── Bullet ──
    const bg = this.make.graphics({ x: 0, y: 0 })
    bg.fillStyle(0xfbbf24, 1) // amber-400
    bg.fillCircle(4, 4, 4)
    bg.fillStyle(0xfef3c7, 1) // amber-100 highlight
    bg.fillCircle(3, 3, 2)
    bg.generateTexture('bullet', 8, 8)
    bg.destroy()

    // ── Enemy ──
    const eg = this.make.graphics({ x: 0, y: 0 })
    eg.fillStyle(0xef4444, 1) // red-500
    eg.fillCircle(12, 12, 11)
    eg.fillStyle(0xfca5a5, 1) // red-300
    eg.fillCircle(10, 9, 4)
    // Angry eyes
    eg.fillStyle(0xffffff, 1)
    eg.fillCircle(8, 10, 2.5)
    eg.fillCircle(16, 10, 2.5)
    eg.fillStyle(0x1e293b, 1)
    eg.fillCircle(9, 10, 1.2)
    eg.fillCircle(17, 10, 1.2)
    eg.generateTexture('enemy', 24, 24)
    eg.destroy()

    // ── Background tile (64×64 grid pattern) ──
    const tg = this.make.graphics({ x: 0, y: 0 })
    tg.fillStyle(0x1a1a2e, 1) // dark navy
    tg.fillRect(0, 0, 64, 64)
    tg.lineStyle(1, 0x2a2a4a, 0.5)
    tg.strokeRect(0, 0, 64, 64)
    // Subtle dot at center
    tg.fillStyle(0x2a2a4a, 0.4)
    tg.fillCircle(32, 32, 2)
    tg.generateTexture('bg-tile', 64, 64)
    tg.destroy()

    // ── HP bar background ──
    const hpBg = this.make.graphics({ x: 0, y: 0 })
    hpBg.fillStyle(0x374151, 1) // gray-700
    hpBg.fillRoundedRect(0, 0, 204, 18, 4)
    hpBg.generateTexture('hp-bg', 204, 18)
    hpBg.destroy()

    // ── HP bar fill ──
    const hpFill = this.make.graphics({ x: 0, y: 0 })
    hpFill.fillStyle(0x22c55e, 1) // green-500
    hpFill.fillRect(0, 0, 200, 14)
    hpFill.generateTexture('hp-fill', 200, 14)
    hpFill.destroy()
  }
}
