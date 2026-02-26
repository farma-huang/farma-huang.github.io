import { useEffect, useRef } from 'react'

export default function SurvivorGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let destroyed = false

    const initGame = async () => {
      if (!containerRef.current || gameRef.current) return

      // Dynamic import to avoid SSR issues
      const Phaser = (await import('phaser')).default
      const { default: BootScene } = await import('./scenes/BootScene')
      const { default: MenuScene } = await import('./scenes/MenuScene')
      const { default: MainGameScene } = await import('./scenes/MainGameScene')
      const { default: GameOverScene } = await import('./scenes/GameOverScene')

      if (destroyed) return

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: containerRef.current,
        backgroundColor: '#0f172a',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [BootScene, MenuScene, MainGameScene, GameOverScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        input: {
          keyboard: true,
        },
      }

      gameRef.current = new Phaser.Game(config)
    }

    initGame()

    return () => {
      destroyed = true
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 800,
        aspectRatio: '4 / 3',
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#0f172a',
      }}
    />
  )
}
