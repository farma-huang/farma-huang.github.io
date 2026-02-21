import React, { useState } from 'react'
import { decideDiscard, decideReaction } from '../utils/mahjongBot'
import type { Meld, PlayerState, Tile } from '../utils/mahjongLogic'
import {
  calculateTai,
  canHu,
  canKan,
  canPon,
  generateTiles,
  getPossibleChis,
  getTileKey,
  shuffle,
  sortHand,
} from '../utils/mahjongLogic'

const SVG_PATH = '/assets/images/mahjong-game_104678.svg'

const TileViewSprite = ({
  tile,
  onClick,
  size = 'md',
  interactive = true,
  isDrawn = false,
  concealed = false,
  rotated = false,
}: {
  tile?: Tile | undefined // optional for facedown tiles
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  isDrawn?: boolean
  concealed?: boolean
  rotated?: boolean
}) => {
  const isSm = size === 'sm'
  const isLg = size === 'lg'
  // Base standard aspect ratio
  let tileDisplayW = isSm ? 24 : isLg ? 48 : 36
  let tileDisplayH = isSm ? 34 : isLg ? 68 : 50

  if (rotated) {
    ;[tileDisplayW, tileDisplayH] = [tileDisplayH, tileDisplayW]
  }

  if (concealed || !tile) {
    return (
      <div
        className={[
          'relative rounded-md shrink-0 bg-emerald-700 border-2 border-emerald-900 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]',
          isSm
            ? 'shadow-[1px_2px_0px_#064e3b]'
            : 'shadow-[2px_3px_0px_#064e3b]',
        ].join(' ')}
        style={{ width: tileDisplayW, height: tileDisplayH }}
      />
    )
  }

  const viewBox = getTileSpriteViewBox(tile.suit, tile.value)

  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      className={[
        'relative rounded-md overflow-hidden transition-all duration-200 shrink-0 bg-[#fdfbf7] border border-slate-200',
        isSm ? 'shadow-[1px_2px_0px_#cbd5e1]' : 'shadow-[2px_3px_0px_#78909c]',
        interactive
          ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[2px_8px_0px_#78909c,0_8px_12px_rgba(0,0,0,0.2)] hover:brightness-105'
          : 'cursor-default',
        isDrawn
          ? 'ml-2 md:ml-3 animate-slide-up border-amber-300 shadow-[2px_3px_0px_#d97706]'
          : '',
        rotated ? '-rotate-90 origin-center' : '',
      ].join(' ')}
      style={{ width: tileDisplayW, height: tileDisplayH }}>
      {viewBox ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
          aria-hidden="true">
          <title>Mahjong Tile</title>
          <image href={SVG_PATH} x={0} y={0} width={SVG_W} height={SVG_H} />
        </svg>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#fdfbf7] border-2 border-slate-200 rounded">
          <span
            className={`font-bold font-serif leading-none ${isSm ? 'text-[10px]' : 'text-base'} text-blue-700`}>
            白
          </span>
        </div>
      )}
    </button>
  )
}

type TurnPhase =
  | 'idle'
  | 'player_draw'
  | 'player_discard'
  | 'player_reaction'
  | 'ai_draw'
  | 'ai_discard'
  | 'ai_reaction'
  | 'gameover'

export default function MahjongGame() {
  const [deck, setDeck] = useState<Tile[]>([])

  const [playerState, setPlayerState] = useState<PlayerState>({
    hand: [],
    melds: [],
    discards: [],
  })
  const [aiState, setAiState] = useState<PlayerState>({
    hand: [],
    melds: [],
    discards: [],
  })

  // Who is currently dealer?
  const [dealer, setDealer] = useState<'player' | 'ai'>('player')
  const [phase, setPhase] = useState<TurnPhase>('idle')
  const [message, setMessage] = useState('點擊「開始遊戲」決定莊家並發牌')

  // For actions like Chi where user has to pick which sequence to form
  const [pendingActionTile, setPendingActionTile] = useState<Tile | null>(null)

  // AI Turn Loop
  React.useEffect(() => {
    if (phase === 'ai_draw') {
      if (deck.length === 0) {
        handleDraw(true)
      } else {
        setTimeout(() => handleDraw(true), 500)
      }
    } else if (phase === 'ai_discard') {
      setTimeout(() => executeAiTurn(), 1000)
    } else if (phase === 'ai_reaction') {
      setTimeout(() => executeAiReaction(), 1000)
    }
  }, [phase, deck.length])

  const startGame = () => {
    let newDeck = shuffle(generateTiles())
    const isPlayerDealer = Math.random() > 0.5

    // Dealer gets 14, non-dealer gets 13
    const pHandSize = isPlayerDealer ? 14 : 13
    const aHandSize = isPlayerDealer ? 13 : 14

    const pHand = newDeck.slice(0, pHandSize)
    const aHand = newDeck.slice(pHandSize, pHandSize + aHandSize)
    newDeck = newDeck.slice(pHandSize + aHandSize)

    setPlayerState({ hand: sortHand(pHand), melds: [], discards: [] })
    setAiState({ hand: sortHand(aHand), melds: [], discards: [] })
    setDealer(isPlayerDealer ? 'player' : 'ai')
    setDeck(newDeck)
    setPendingActionTile(null)

    if (isPlayerDealer) {
      setMessage('你是莊家！已發 14 張牌，請出牌。')
      setPhase('player_discard')
    } else {
      setMessage('對手是莊家。')
      setPhase('ai_discard')
    }
  }

  const handleDraw = (isAi: boolean) => {
    if (deck.length === 0) {
      setGameStateGameOver('荒牌流局！無人胡牌。')
      return
    }

    const drawn = deck[0]!
    const newDeck = deck.slice(1)
    setDeck(newDeck)

    if (isAi) {
      const sh = [...aiState.hand, drawn]
      setAiState({ ...aiState, hand: sh })
      // Check self hu
      if (canHu(sh)) {
        const res = calculateTai(
          sh,
          aiState.melds,
          true,
          aiState.melds.every((m) => m.isConcealed),
        )
        setGameStateGameOver(
          `對手自摸！ ${res.reasons.join(', ')}，共 ${res.tai} 台`,
        )
        return
      }
      setMessage('對手摸牌中...')
      setPhase('ai_discard')
    } else {
      const sh = [...playerState.hand, drawn]
      setPlayerState({ ...playerState, hand: sh })

      if (canHu(sh)) {
        // UI shows a Hu button, wait for user
        setMessage('你自摸了！點擊「胡牌」')
      } else {
        setMessage('請打出一張牌')
      }
      setPhase('player_discard')
    }
  }

  const executeDiscard = (index: number, isAi: boolean) => {
    if (isAi) {
      // Already decided which to discard
      const targetTile = aiState.hand[index]!
      const newHand = aiState.hand.filter((_, i) => i !== index)
      setAiState({
        ...aiState,
        hand: sortHand(newHand),
        discards: [...aiState.discards, targetTile],
      })

      setMessage(
        `對手打出：${WHITE_TILE_LABEL[`${targetTile.suit}-${targetTile.value}`] || '?'}`,
      )
      setPendingActionTile(targetTile)

      // Check if Player can react
      if (
        canHu([...playerState.hand, targetTile]) ||
        canPon(playerState.hand, targetTile) ||
        canKan(playerState.hand, targetTile) ||
        getPossibleChis(playerState.hand, targetTile).length > 0
      ) {
        setPhase('player_reaction')
      } else {
        setPhase('player_draw') // player skips automatically
      }
    } else {
      const targetTile = playerState.hand[index]!
      const newHand = playerState.hand.filter((_, i) => i !== index)
      setPlayerState({
        ...playerState,
        hand: sortHand(newHand),
        discards: [...playerState.discards, targetTile],
      })

      setPendingActionTile(targetTile)
      setPhase('ai_reaction')
    }
  }

  const executeAiTurn = () => {
    // Evaluate what to discard
    const discardTile = decideDiscard(aiState.hand)
    const idx = aiState.hand.findIndex((t) => t.id === discardTile.id)
    executeDiscard(idx, true)
  }

  const executeAiReaction = () => {
    if (!pendingActionTile) {
      setPhase('ai_draw')
      return
    }
    const r = decideReaction(aiState.hand, pendingActionTile)
    if (r.action === 'hu') {
      const res = calculateTai(
        [...aiState.hand, pendingActionTile],
        aiState.melds,
        false,
        aiState.melds.every((m) => m.isConcealed),
      )
      setAiState({ ...aiState, hand: [...aiState.hand, pendingActionTile] })
      setGameStateGameOver(
        `你放槍了！對手胡牌：${res.reasons.join(', ')}，共 ${res.tai} 台`,
      )
    } else if (r.action === 'kan') {
      // Take tile from player discards
      const t = pendingActionTile
      const newEnemyD = [...playerState.discards]
      newEnemyD.pop()
      setPlayerState({ ...playerState, discards: newEnemyD })

      const req = aiState.hand.filter((x) => getTileKey(x) === getTileKey(t))
      const remain = aiState.hand.filter((x) => getTileKey(x) !== getTileKey(t))
      const m: Meld = {
        type: 'kan',
        tiles: [...req.slice(0, 3), t],
        isConcealed: false,
      }
      setAiState({ ...aiState, hand: remain, melds: [...aiState.melds, m] })
      setMessage('對手 槓！')
      // Kan draws immediately
      setPhase('ai_draw')
    } else if (r.action === 'pon') {
      const t = pendingActionTile
      const newEnemyD = [...playerState.discards]
      newEnemyD.pop()
      setPlayerState({ ...playerState, discards: newEnemyD })

      const req = aiState.hand.filter((x) => getTileKey(x) === getTileKey(t))
      const remain = aiState.hand.filter((x) => getTileKey(x) !== getTileKey(t))
      // In case we have >2, keep remainder
      const keep = req.length > 2 ? req.slice(2) : []
      const rV = req.slice(0, 2)
      const remainTot = sortHand([...remain, ...keep])

      const m: Meld = { type: 'pon', tiles: [...rV, t], isConcealed: false }
      setAiState({ ...aiState, hand: remainTot, melds: [...aiState.melds, m] })
      setMessage('對手 碰！')
      setPhase('ai_discard') // AI must discard next
    } else if (r.action === 'chi' && 'tiles' in r) {
      const t = pendingActionTile
      const newEnemyD = [...playerState.discards]
      newEnemyD.pop()
      setPlayerState({ ...playerState, discards: newEnemyD })

      const toRem = r.tiles // 2 tiles used
      const newHand = aiState.hand.filter(
        (x) => x.id !== toRem[0]!.id && x.id !== toRem[1]!.id,
      )
      const m: Meld = {
        type: 'chi',
        tiles: [toRem[0]!, toRem[1]!, t],
        isConcealed: false,
      }
      setAiState({ ...aiState, hand: newHand, melds: [...aiState.melds, m] })
      setMessage('對手 吃！')
      setPhase('ai_discard')
    } else {
      setPhase('ai_draw') // Ai skips, so it's AI's turn to draw
    }
  }

  const handlePlayerReaction = (action: string, selectedTiles?: Tile[]) => {
    if (!pendingActionTile && phase !== 'player_discard') return // 'player_discard' is valid for self-hu

    if (action === 'skip') {
      setPhase('player_draw') // Player skips opponent's discard, so it's player's turn to draw
      return
    }

    if (action === 'hu') {
      if (phase === 'player_reaction') {
        const res = calculateTai(
          [...playerState.hand, pendingActionTile!],
          playerState.melds,
          false,
          playerState.melds.every((m) => m.isConcealed),
        )
        setPlayerState({
          ...playerState,
          hand: [...playerState.hand, pendingActionTile!],
        })
        setGameStateGameOver(
          `你胡牌了！ ${res.reasons.join(', ')}，共 ${res.tai} 台`,
        )
      } else if (phase === 'player_discard') {
        // Zi Mo
        const res = calculateTai(
          playerState.hand,
          playerState.melds,
          true,
          playerState.melds.every((m) => m.isConcealed),
        )
        setGameStateGameOver(
          `自摸！ ${res.reasons.join(', ')}，共 ${res.tai} 台`,
        )
      }
      return
    }

    const t = pendingActionTile!
    const newEnemyD = [...aiState.discards]
    newEnemyD.pop()
    setAiState({ ...aiState, discards: newEnemyD })

    if (action === 'kan') {
      const req = playerState.hand.filter(
        (x) => getTileKey(x) === getTileKey(t),
      )
      const remain = playerState.hand.filter(
        (x) => getTileKey(x) !== getTileKey(t),
      )
      const m: Meld = {
        type: 'kan',
        tiles: [...req.slice(0, 3), t],
        isConcealed: false,
      }
      setPlayerState({
        ...playerState,
        hand: remain,
        melds: [...playerState.melds, m],
      })
      setMessage('你槓了！請點擊摸牌。')
      setPhase('player_draw')
    } else if (action === 'pon') {
      const req = playerState.hand.filter(
        (x) => getTileKey(x) === getTileKey(t),
      )
      const remain = playerState.hand.filter(
        (x) => getTileKey(x) !== getTileKey(t),
      )
      const keep = req.length > 2 ? req.slice(2) : []
      const rV = req.slice(0, 2)

      const m: Meld = { type: 'pon', tiles: [...rV, t], isConcealed: false }
      setPlayerState({
        ...playerState,
        hand: sortHand([...remain, ...keep]),
        melds: [...playerState.melds, m],
      })
      setMessage('你碰了！請打出一張牌。')
      setPhase('player_discard')
    } else if (action === 'chi' && selectedTiles) {
      const newHand = playerState.hand.filter(
        (x) => x.id !== selectedTiles[0]!.id && x.id !== selectedTiles[1]!.id,
      )
      const m: Meld = {
        type: 'chi',
        tiles: [selectedTiles[0]!, selectedTiles[1]!, t],
        isConcealed: false,
      }
      setPlayerState({
        ...playerState,
        hand: newHand,
        melds: [...playerState.melds, m],
      })
      setMessage('你吃了！請打出一張牌。')
      setPhase('player_discard')
    }
  }

  const setGameStateGameOver = (msg: string) => {
    setMessage(msg)
    setPhase('gameover')
  }

  // ----- UI HELPERS -----
  const canPlayerHuNow =
    phase === 'player_reaction'
      ? canHu([...playerState.hand, pendingActionTile!])
      : phase === 'player_discard' && canHu(playerState.hand)
  const chisAvailable =
    phase === 'player_reaction' && pendingActionTile
      ? getPossibleChis(playerState.hand, pendingActionTile)
      : []

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2d5016] via-[#1a3a0a] to-[#0f2205] rounded-3xl text-white shadow-2xl relative overflow-hidden xl:min-w-[900px]">
      {/* Table Texture */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}></div>

      {/* AI AREA (Top) */}
      <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-white/5 relative z-10 w-full min-h-[140px]">
        <div className="flex justify-between text-xs text-lime-300/60 font-bold uppercase tracking-widest">
          <span>AI 對手 {dealer === 'ai' ? '🚩 (莊)' : ''}</span>
          <span>手牌 {aiState.hand.length} 張</span>
        </div>

        {/* AI Melds & Hand */}
        <div className="flex items-center gap-4 justify-center mt-2 flex-wrap">
          {/* Melds */}
          {aiState.melds.map((m, i) => (
            <div key={i} className="flex gap-0.5 opacity-90">
              {m.tiles.map((t, idx) => (
                <TileViewSprite key={idx} tile={t} size="sm" />
              ))}
            </div>
          ))}
          {/* Facedown Hand (unless gameover, then reveal) */}
          <div className="flex gap-0.5 ml-4">
            {aiState.hand.map((t, i) => (
              <TileViewSprite
                key={i}
                tile={phase === 'gameover' ? t : undefined}
                size="sm"
                concealed={phase !== 'gameover'}
              />
            ))}
          </div>
        </div>

        {/* AI Discards */}
        <div className="mt-4 border-t border-white/10 pt-3 flex flex-wrap gap-1 md:gap-1.5 justify-center max-h-[150px] overflow-y-auto">
          {aiState.discards.map((t, i) => (
            <TileViewSprite key={i} tile={t} size="sm" interactive={false} />
          ))}
        </div>
      </div>

      {/* CENTER DASHBOARD (Status & Actions) */}
      <div className="flex flex-col items-center justify-center p-3 z-10 w-full relative">
        <div className="flex items-center gap-3">
          <span className="text-lime-100/60 text-sm font-bold bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner flex items-center gap-2">
            剩餘牌山:{' '}
            <span className="text-amber-400 text-lg">{deck.length}</span>
            {phase === 'player_draw' && (
              <button
                type="button"
                onClick={() => handleDraw(false)}
                className="ml-2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-md animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                點擊摸牌
              </button>
            )}
          </span>
          {(phase === 'idle' || phase === 'gameover') && (
            <button
              type="button"
              onClick={startGame}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl shadow-[0_4px_14px_0_rgba(251,191,36,0.4)] transition-all hover:-translate-y-0.5">
              {phase === 'gameover' ? '再玩一局' : '開始遊戲'}
            </button>
          )}
        </div>

        <div className="mt-3 text-center px-6 py-2.5 bg-black/40 rounded-xl border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] max-w-lg w-full font-medium min-h-[46px] flex items-center justify-center">
          {message}
        </div>

        {/* Reaction Actions */}
        {phase === 'player_reaction' && pendingActionTile && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md animate-slide-up shadow-xl">
            <span className="w-full text-center text-xs text-amber-300 font-bold mb-1">
              對手打出{' '}
              {
                WHITE_TILE_LABEL[
                  `${pendingActionTile.suit}-${pendingActionTile.value}`
                ]
              }
              ，你可以...
            </span>

            {canPlayerHuNow && (
              <button
                type="button"
                onClick={() => handlePlayerReaction('hu')}
                className="action-btn bg-red-600 hover:bg-red-500 text-white">
                胡排！
              </button>
            )}
            {canKan(playerState.hand, pendingActionTile) && (
              <button
                type="button"
                onClick={() => handlePlayerReaction('kan')}
                className="action-btn bg-emerald-600 hover:bg-emerald-500 text-white">
                槓
              </button>
            )}
            {canPon(playerState.hand, pendingActionTile) && (
              <button
                type="button"
                onClick={() => handlePlayerReaction('pon')}
                className="action-btn bg-emerald-600 hover:bg-emerald-500 text-white">
                碰
              </button>
            )}

            {chisAvailable.map((combo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePlayerReaction('chi', combo)}
                className="action-btn bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1">
                吃 [{WHITE_TILE_LABEL[`${combo[0]!.suit}-${combo[0]!.value}`]},{' '}
                {WHITE_TILE_LABEL[`${combo[1]!.suit}-${combo[1]!.value}`]}]
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePlayerReaction('skip')}
              className="action-btn bg-slate-600 hover:bg-slate-500 text-white">
              跳過
            </button>
          </div>
        )}
      </div>

      {/* PLAYER AREA (Bottom) */}
      <div className="flex flex-col gap-2 bg-gradient-to-t from-black/50 to-black/10 p-4 md:px-6 md:pb-8 rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative z-10 w-full mt-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-amber-500/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            你的手牌 {dealer === 'player' ? '🚩 (莊)' : ''}
          </span>

          {/* Self Actions (Draw phase) */}
          {phase === 'player_discard' && (
            <div className="flex gap-2 animate-slide-up">
              {canPlayerHuNow && (
                <button
                  type="button"
                  onClick={() => handlePlayerReaction('hu')}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold text-sm shadow-md">
                  自摸胡牌！
                </button>
              )}
              {/* Kan (Concealed/Jia-Kan) check omitted for simplicity in this demo, could be added */}
            </div>
          )}
        </div>

        {/* Player Discards */}
        <div className="mb-4 border-b border-white/10 pb-3 flex flex-wrap gap-1 md:gap-1.5 justify-start max-h-[120px] overflow-y-auto w-full">
          {playerState.discards.length === 0 && (
            <span className="text-white/20 text-xs py-2">
              你的海底 (目前無牌)
            </span>
          )}
          {playerState.discards.map((t, i) => (
            <TileViewSprite key={i} tile={t} size="sm" interactive={false} />
          ))}
        </div>

        <div className="flex items-end gap-2 md:gap-4 w-full flex-wrap shrink-0 pb-2">
          {/* Player Melds */}
          {playerState.melds.map((m, i) => (
            <div
              key={i}
              className="flex gap-0.5 opacity-90 p-1.5 bg-white/5 rounded-xl border border-white/10">
              {m.tiles.map((t, idx) => (
                <TileViewSprite key={idx} tile={t} size="md" />
              ))}
            </div>
          ))}

          {/* Player Hand */}
          <div className="flex flex-wrap gap-0.5 md:gap-1 items-end ml-auto pr-4">
            {playerState.hand.map((t, i) => {
              // The last tile drawn dynamically separates slightly
              // Note: we just assume if hand is 14 or we are in discard phase, last tile is drawn
              const isDrawn =
                phase === 'player_discard' && i === playerState.hand.length - 1
              return (
                <TileViewSprite
                  key={t.id}
                  tile={t}
                  size="lg"
                  interactive={phase === 'player_discard'}
                  isDrawn={isDrawn}
                  onClick={() => {
                    if (phase === 'player_discard') executeDiscard(i, false)
                  }}
                />
              )
            })}
            {phase === 'idle' && playerState.hand.length === 0 && (
              <div className="text-white/30 text-sm py-10 w-full text-center">
                準備發牌...
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
                @keyframes slide-up {
                    0% { transform: translateY(15px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .scroolbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .action-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s;
                }
                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 10px -1px rgba(0, 0, 0, 0.4);
                }
            `}</style>
    </div>
  )
}

// Ensure the helper vars match
const SVG_W = 1400
const SVG_H = 980
const TILE_W = 115.8
const TILE_H = 158.4
const TILE_SPACING_X = 147.2
const TILE_PADDING_X = 8
const ROW_Y: Record<string, number> = {
  characters: 34.4,
  dots: 222.6,
  bamboos: 411.1,
  winds: 599.1,
  dragons: 599.1,
}

const getTileSpriteViewBox = (suit: string, value: number): string | null => {
  const rowY = ROW_Y[suit]
  if (rowY === undefined) return null
  let col: number
  if (suit === 'characters' || suit === 'dots' || suit === 'bamboos')
    col = value - 1
  else if (suit === 'winds') col = value - 1
  else if (suit === 'dragons') {
    if (value === 1) col = 5
    else if (value === 2) col = 4
    else return null
  } else return null

  const x = 53 + col * TILE_SPACING_X - TILE_PADDING_X
  const y = rowY - TILE_PADDING_X
  return `${x} ${y} ${TILE_W + TILE_PADDING_X * 2} ${TILE_H + TILE_PADDING_X * 2}`
}

const WHITE_TILE_LABEL: Record<string, string> = {
  'characters-1': '一萬',
  'characters-2': '二萬',
  'characters-3': '三萬',
  'characters-4': '四萬',
  'characters-5': '五萬',
  'characters-6': '六萬',
  'characters-7': '七萬',
  'characters-8': '八萬',
  'characters-9': '九萬',
  'dots-1': '一筒',
  'dots-2': '二筒',
  'dots-3': '三筒',
  'dots-4': '四筒',
  'dots-5': '五筒',
  'dots-6': '六筒',
  'dots-7': '七筒',
  'dots-8': '八筒',
  'dots-9': '九筒',
  'bamboos-1': '一條',
  'bamboos-2': '二條',
  'bamboos-3': '三條',
  'bamboos-4': '四條',
  'bamboos-5': '五條',
  'bamboos-6': '六條',
  'bamboos-7': '七條',
  'bamboos-8': '八條',
  'bamboos-9': '九條',
  'winds-1': '東',
  'winds-2': '南',
  'winds-3': '西',
  'winds-4': '北',
  'dragons-1': '中',
  'dragons-2': '發',
  'dragons-3': '白',
}
