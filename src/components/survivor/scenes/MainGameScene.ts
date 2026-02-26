import Phaser from 'phaser'

// ── Constants ──
const PLAYER_SPEED = 200
const BULLET_SPEED = 450
const BULLET_INTERVAL = 500 // ms
const ENEMY_SPEED_BASE = 80
const ENEMY_SPAWN_DISTANCE = 500 // px outside camera edge
const INITIAL_SPAWN_INTERVAL = 1500 // ms
const MIN_SPAWN_INTERVAL = 300
const PLAYER_MAX_HP = 100
const DAMAGE_PER_HIT = 10
const INVINCIBLE_DURATION = 500 // ms
const BULLET_LIFESPAN = 2000 // ms

export default class MainGameScene extends Phaser.Scene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite
  private hp = PLAYER_MAX_HP
  private isInvincible = false

  // Pools
  private bullets!: Phaser.Physics.Arcade.Group
  private enemies!: Phaser.Physics.Arcade.Group

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>

  // Background
  private bgTile!: Phaser.GameObjects.TileSprite

  // Timers
  private shootTimer!: Phaser.Time.TimerEvent
  private spawnTimer!: Phaser.Time.TimerEvent
  private spawnInterval = INITIAL_SPAWN_INTERVAL

  // Score / time
  private score = 0
  private survivalTime = 0

  // HUD
  private scoreText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text
  private _hpBarBg!: Phaser.GameObjects.Image
  private hpBarFill!: Phaser.GameObjects.Image

  constructor() {
    super({ key: 'MainGameScene' })
  }

  create(): void {
    // Reset state
    this.hp = PLAYER_MAX_HP
    this.isInvincible = false
    this.score = 0
    this.survivalTime = 0
    this.spawnInterval = INITIAL_SPAWN_INTERVAL

    const { width, height } = this.scale

    // ── Background ──
    this.bgTile = this.add
      .tileSprite(0, 0, width * 3, height * 3, 'bg-tile')
      .setOrigin(0.5)
      .setScrollFactor(0)

    // ── Player ──
    this.player = this.physics.add.sprite(0, 0, 'player')
    this.player.setCollideWorldBounds(false)
    this.player.setDepth(10)

    // ── Camera ──
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor('#0f172a')

    // ── Input ──
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      }
    }

    // ── Object pools ──
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 100,
      runChildUpdate: false,
    })

    this.enemies = this.physics.add.group({
      defaultKey: 'enemy',
      maxSize: 300,
      runChildUpdate: false,
    })

    // ── Collisions ──
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this
        .onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    )

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this
        .onEnemyHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    )

    // ── Timers ──
    this.shootTimer = this.time.addEvent({
      delay: BULLET_INTERVAL,
      callback: this.fireBullet,
      callbackScope: this,
      loop: true,
    })

    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    })

    // ── Difficulty ramp every 5 seconds ──
    this.time.addEvent({
      delay: 5000,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true,
    })

    // ── Survival timer ──
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.survivalTime++
        this.timeText.setText(`⏱ ${this.formatTime(this.survivalTime)}`)
      },
      callbackScope: this,
      loop: true,
    })

    // ── HUD (fixed to camera) ──
    this.scoreText = this.add
      .text(16, 16, '💀 0', {
        fontSize: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f1f5f9',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(100)

    this.timeText = this.add
      .text(16, 44, '⏱ 00:00', {
        fontSize: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#94a3b8',
      })
      .setScrollFactor(0)
      .setDepth(100)

    // HP bar
    this._hpBarBg = this.add
      .image(width / 2, height - 30, 'hp-bg')
      .setScrollFactor(0)
      .setDepth(100)

    this.hpBarFill = this.add
      .image(width / 2 - 2, height - 30, 'hp-fill')
      .setScrollFactor(0)
      .setDepth(101)

    // HP label
    this.add
      .text(width / 2, height - 50, 'HP', {
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#94a3b8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
  }

  override update(): void {
    // ── Player movement ──
    let vx = 0
    let vy = 0

    const left = this.cursors?.left?.isDown || this.wasd?.A?.isDown
    const right = this.cursors?.right?.isDown || this.wasd?.D?.isDown
    const up = this.cursors?.up?.isDown || this.wasd?.W?.isDown
    const down = this.cursors?.down?.isDown || this.wasd?.S?.isDown

    if (left) vx -= 1
    if (right) vx += 1
    if (up) vy -= 1
    if (down) vy += 1

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      const norm = Math.SQRT1_2
      vx *= norm
      vy *= norm
    }

    this.player.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED)

    // ── Scroll background ──
    this.bgTile.tilePositionX = this.player.x
    this.bgTile.tilePositionY = this.player.y
    this.bgTile.setPosition(this.player.x, this.player.y)

    // ── Enemy chase ──
    const enemies = this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const angle = Phaser.Math.Angle.Between(
        enemy.x,
        enemy.y,
        this.player.x,
        this.player.y,
      )
      const speed = ENEMY_SPEED_BASE + this.survivalTime * 0.3 // gradually faster
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    }

    // ── Recycle off-screen bullets ──
    const cam = this.cameras.main
    const bullets = this.bullets.getChildren() as Phaser.Physics.Arcade.Sprite[]
    for (const bullet of bullets) {
      if (!bullet.active) continue
      const dx = Math.abs(bullet.x - cam.scrollX - cam.width / 2)
      const dy = Math.abs(bullet.y - cam.scrollY - cam.height / 2)
      if (dx > cam.width || dy > cam.height) {
        this.bullets.killAndHide(bullet)
        ;(bullet.body as Phaser.Physics.Arcade.Body).enable = false
      }
    }
  }

  // ── Fire bullet at nearest enemy ──
  private fireBullet(): void {
    const nearest = this.findNearestEnemy()
    if (!nearest) return

    // Get from pool
    const bullet = this.bullets.get(
      this.player.x,
      this.player.y,
      'bullet',
    ) as Phaser.Physics.Arcade.Sprite | null
    if (!bullet) return

    bullet.setActive(true).setVisible(true)
    bullet.setPosition(this.player.x, this.player.y)
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.enable = true

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      nearest.x,
      nearest.y,
    )

    body.setVelocity(
      Math.cos(angle) * BULLET_SPEED,
      Math.sin(angle) * BULLET_SPEED,
    )

    // Auto-destroy after lifespan
    this.time.delayedCall(BULLET_LIFESPAN, () => {
      if (bullet.active) {
        this.bullets.killAndHide(bullet)
        body.enable = false
      }
    })
  }

  private findNearestEnemy(): Phaser.Physics.Arcade.Sprite | null {
    let closest: Phaser.Physics.Arcade.Sprite | null = null
    let minDist = Number.POSITIVE_INFINITY

    const enemies = this.enemies.getChildren() as Phaser.Physics.Arcade.Sprite[]
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y,
      )
      if (d < minDist) {
        minDist = d
        closest = enemy
      }
    }
    return closest
  }

  // ── Spawn enemies around camera edge ──
  private spawnEnemy(): void {
    const cam = this.cameras.main
    const cx = cam.scrollX + cam.width / 2
    const cy = cam.scrollY + cam.height / 2

    // Spawn 1–3 enemies based on difficulty
    const count = 1 + Math.floor(this.survivalTime / 20)
    const batch = Math.min(count, 5)

    for (let i = 0; i < batch; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const dist = ENEMY_SPAWN_DISTANCE + Math.max(cam.width, cam.height) / 2

      const sx = cx + Math.cos(angle) * dist
      const sy = cy + Math.sin(angle) * dist

      const enemy = this.enemies.get(
        sx,
        sy,
        'enemy',
      ) as Phaser.Physics.Arcade.Sprite | null
      if (!enemy) continue

      enemy.setActive(true).setVisible(true)
      enemy.setPosition(sx, sy)
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.enable = true
    }
  }

  // ── Collisions ──
  private onBulletHitEnemy(
    bulletObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite

    // Kill both
    this.bullets.killAndHide(bullet)
    ;(bullet.body as Phaser.Physics.Arcade.Body).enable = false

    this.enemies.killAndHide(enemy)
    ;(enemy.body as Phaser.Physics.Arcade.Body).enable = false

    // Death flash particle effect
    this.add.circle(enemy.x, enemy.y, 12, 0xef4444, 0.8).setDepth(5)
    this.tweens.add({
      targets:
        this.children.getByName('') ||
        this.children.list[this.children.list.length - 1],
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: (_tween, targets) => {
        for (const t of targets) {
          ;(t as Phaser.GameObjects.Arc).destroy()
        }
      },
    })

    // Score
    this.score++
    this.scoreText.setText(`💀 ${this.score}`)
  }

  private onEnemyHitPlayer(
    _playerObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject,
  ): void {
    if (this.isInvincible) return

    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite

    // Damage
    this.hp -= DAMAGE_PER_HIT
    this.updateHpBar()

    // Kill the enemy that hit
    this.enemies.killAndHide(enemy)
    ;(enemy.body as Phaser.Physics.Arcade.Body).enable = false

    if (this.hp <= 0) {
      this.gameOver()
      return
    }

    // I-frames
    this.isInvincible = true
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: Math.floor(INVINCIBLE_DURATION / 160),
      onComplete: () => {
        this.player.setAlpha(1)
        this.isInvincible = false
      },
    })
  }

  private updateHpBar(): void {
    const ratio = Math.max(0, this.hp / PLAYER_MAX_HP)
    this.hpBarFill.setScale(ratio, 1)

    // Color shift: green → yellow → red
    if (ratio > 0.5) {
      this.hpBarFill.setTint(0x22c55e)
    } else if (ratio > 0.25) {
      this.hpBarFill.setTint(0xeab308)
    } else {
      this.hpBarFill.setTint(0xef4444)
    }
  }

  private increaseDifficulty(): void {
    if (this.spawnInterval <= MIN_SPAWN_INTERVAL) return
    this.spawnInterval = Math.max(MIN_SPAWN_INTERVAL, this.spawnInterval - 100)
    // Recreate spawn timer with new interval (delay is read-only)
    this.spawnTimer.destroy()
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    })
  }

  private gameOver(): void {
    this.shootTimer.destroy()
    this.spawnTimer.destroy()
    this.physics.pause()

    this.scene.start('GameOverScene', {
      score: this.score,
      time: this.survivalTime,
    })
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }
}
