import Phaser from 'phaser'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create(): void {
    const { width, height } = this.scale

    // Background
    this.cameras.main.setBackgroundColor('#0f172a')

    // Title
    this.add
      .text(width / 2, height * 0.3, '⚔️ SURVIVOR', {
        fontSize: '48px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f1f5f9',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    // Subtitle
    this.add
      .text(width / 2, height * 0.3 + 60, '盡可能存活下去！', {
        fontSize: '18px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#94a3b8',
      })
      .setOrigin(0.5)

    // Start button
    const btnBg = this.add
      .rectangle(width / 2, height * 0.6, 200, 56, 0x3b82f6)
      .setInteractive({ useHandCursor: true })

    const btnText = this.add
      .text(width / 2, height * 0.6, '開始遊戲', {
        fontSize: '22px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    // Hover effect
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x60a5fa)
      btnBg.setScale(1.05)
      btnText.setScale(1.05)
    })
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x3b82f6)
      btnBg.setScale(1)
      btnText.setScale(1)
    })

    btnBg.on('pointerdown', () => {
      this.scene.start('MainGameScene')
    })

    // Controls hint
    this.add
      .text(width / 2, height * 0.8, 'WASD / 方向鍵 移動 ｜ 自動瞄準射擊', {
        fontSize: '14px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#64748b',
      })
      .setOrigin(0.5)
  }
}
