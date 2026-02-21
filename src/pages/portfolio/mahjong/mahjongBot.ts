import type { Tile } from './mahjongLogic'
import {
  canHu,
  canKan,
  canPon,
  countTiles,
  getConcealedKanTiles,
  getPossibleChis,
  getTileKey,
  sortHand,
} from './mahjongLogic'

// Highly simplified heuristic bot

const getTilePriority = (tile: Tile, counts: Map<string, number>): number => {
  let priority = 0
  const count = counts.get(getTileKey(tile)) || 0
  const suit = tile.suit

  // Pairs/Triplets/Kan components are highly valued
  if (count >= 2) priority += 50 * count

  if (suit === 'winds' || suit === 'dragons') {
    // Isolated honor tiles are garbage
    if (count === 1) return -10
  } else {
    // Numerical suits
    // 4, 5, 6 are most valuable for forming sequences
    const v = tile.value
    if (v >= 4 && v <= 6) priority += 10
    else if (v >= 3 && v <= 7) priority += 5

    // Bonus points if we have adjacent tiles (potential sequence)
    const has = (n: number) => (counts.get(`${suit}-${n}`) || 0) > 0
    if (v > 1 && has(v - 1)) priority += 20 // e.g. 2,3
    if (v < 9 && has(v + 1)) priority += 20 // e.g. 5,6
    if (v > 2 && has(v - 2)) priority += 10 // e.g. 2,4
    if (v < 8 && has(v + 2)) priority += 10 // e.g. 6,8
  }

  return priority
}

// Decide which tile AI should discard from its hand
export const decideDiscard = (hand: Tile[]): Tile => {
  // Sort just to keep logic somewhat stable
  const sortedHand = sortHand([...hand])
  const counts = countTiles(sortedHand)

  // Score each tile
  let worstTile = sortedHand[0]!
  let minScore = Infinity

  for (const tile of sortedHand) {
    // Wait, if it's part of a 100% complete meld, try not to break it
    // We'll rely on the rough heuristic: pairs and adjacencies give high priority.
    const score = getTilePriority(tile, counts)
    // Add random jitter to make bot less predictable
    const jitteredScore = score + Math.random() * 5

    if (jitteredScore < minScore) {
      minScore = jitteredScore
      worstTile = tile
    }
  }

  return worstTile
}

export type AIRongAction =
  | { action: 'skip' }
  | { action: 'chi'; tiles: Tile[] }
  | { action: 'pon' }
  | { action: 'kan' }
  | { action: 'hu' }

export const decideReaction = (
  hand: Tile[],
  discardedTile: Tile,
): AIRongAction => {
  // If AI can Hu, ALWAYS Hu
  const testHand = [...hand, discardedTile]
  if (canHu(testHand)) {
    return { action: 'hu' }
  }

  // Direct Kan is good, let's almost always do it
  if (canKan(hand, discardedTile)) {
    return { action: 'kan' }
  }

  // Pon is good for honors, or if we have exactly 2.
  if (canPon(hand, discardedTile)) {
    const counts = countTiles(hand)
    const count = counts.get(getTileKey(discardedTile)) || 0
    // If we have exactly 2 (forming a Pon), doing it is usually good for fast hands
    if (count === 2) {
      return { action: 'pon' }
    }
  }

  // Chi - evaluate if requested
  // We only Chi if it heavily improves hand priority (rough heuristic: 50% chance if can chi)
  const chis = getPossibleChis(hand, discardedTile)
  if (chis.length > 0) {
    if (Math.random() > 0.4) {
      return { action: 'chi', tiles: chis[0]! }
    }
  }

  return { action: 'skip' }
}

// Decide if AI should An-Kan or Jia-Kan (concealed kan / promote pon to kan) after drawing
export const decideSelfKan = (hand: Tile[]): Tile | null => {
  const kanTiles = getConcealedKanTiles(hand)
  if (kanTiles.length > 0) {
    return kanTiles[0]! // Just kan the first available one
  }
  return null
}
