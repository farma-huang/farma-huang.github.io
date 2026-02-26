import Phaser from 'phaser'

export default class GameOverScene extends Phaser.Scene {
  private finalScore = 0
  private finalTime = 0

  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data: { score: number; time: number }): void {
    this.finalScore = data.score ?? 0
    this.finalTime = data.time ?? 0
  }

  create(): void {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor('#0f172a')

    // Dark overlay effect
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x0f172a,
      0.9,
    )
    overlay.setAlpha(0)
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 500,
    })

    // Game Over title
    const title = this.add
      .text(width / 2, height * 0.25, 'GAME OVER', {
        fontSize: '48px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ef4444',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: height * 0.22,
      duration: 600,
      delay: 300,
      ease: 'Back.easeOut',
    })

    // Score
    const scoreText = this.add
      .text(width / 2, height * 0.4, `💀 擊殺數：${this.finalScore}`, {
        fontSize: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f1f5f9',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      duration: 400,
      delay: 600,
    })

    // Time
    const m = Math.floor(this.finalTime / 60)
      .toString()
      .padStart(2, '0')
    const s = (this.finalTime % 60).toString().padStart(2, '0')

    const timeText = this.add
      .text(width / 2, height * 0.48, `⏱ 存活時間：${m}:${s}`, {
        fontSize: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({
      targets: timeText,
      alpha: 1,
      duration: 400,
      delay: 800,
    })

    // Restart button
    const btnBg = this.add
      .rectangle(width / 2, height * 0.65, 220, 56, 0x3b82f6)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0)

    const btnText = this.add
      .text(width / 2, height * 0.65, '🔁 重新開始', {
        fontSize: '22px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({
      targets: [btnBg, btnText],
      alpha: 1,
      duration: 400,
      delay: 1000,
    })

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

    // Back to menu
    const menuLink = this.add
      .text(width / 2, height * 0.78, '← 回到主選單', {
        fontSize: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0)

    this.tweens.add({
      targets: menuLink,
      alpha: 1,
      duration: 400,
      delay: 1200,
    })

    menuLink.on('pointerover', () => menuLink.setColor('#94a3b8'))
    menuLink.on('pointerout', () => menuLink.setColor('#64748b'))
    menuLink.on('pointerdown', () => this.scene.start('MenuScene'))
  }
}
