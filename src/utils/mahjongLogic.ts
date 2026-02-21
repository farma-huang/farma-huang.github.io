export type Suit = 'characters' | 'dots' | 'bamboos' | 'winds' | 'dragons'

export type Tile = {
  id: string // Unique identifier for the exact tile (e.g. char-1-0)
  suit: Suit // 'characters', 'dots', 'bamboos', 'winds', 'dragons'
  value: number // 1-9 for numerical suits. 1-4 for winds (East, South, West, North). 1-3 for dragons (Zhong, Fa, Bai).
}

export type MeldType = 'chi' | 'pon' | 'kan'

export type Meld = {
  type: MeldType
  tiles: Tile[] // 3 tiles for Chi/Pon, 4 tiles for Kan
  isConcealed: boolean // True if it's an An-Kan (concealed Kong) or drawn meld, false if formed from opponent's discard
}

export type PlayerState = {
  hand: Tile[]
  melds: Meld[]
  discards: Tile[]
}

// Generates a full 136-tile deck
export const generateTiles = (): Tile[] => {
  const tiles: Tile[] = []
  ;['characters', 'dots', 'bamboos'].forEach((suit) => {
    for (let v = 1; v <= 9; v++) {
      for (let j = 0; j < 4; j++)
        tiles.push({
          id: `${suit.slice(0, 3)}-${v}-${j}`,
          suit: suit as Suit,
          value: v,
        })
    }
  })
  for (let v = 1; v <= 4; v++) {
    for (let j = 0; j < 4; j++)
      tiles.push({ id: `wind-${v}-${j}`, suit: 'winds', value: v })
  }
  for (let v = 1; v <= 3; v++) {
    for (let j = 0; j < 4; j++)
      tiles.push({ id: `dragon-${v}-${j}`, suit: 'dragons', value: v })
  }
  return tiles
}

// Fisher-Yates shuffle
export const shuffle = (array: Tile[]): Tile[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t1 = newArray[i]
    const t2 = newArray[j]
    if (t1 && t2) {
      newArray[i] = t2
      newArray[j] = t1
    }
  }
  return newArray
}

const suitOrder: Record<Suit, number> = {
  characters: 1,
  dots: 2,
  bamboos: 3,
  winds: 4,
  dragons: 5,
}

export const sortHand = (hand: Tile[]) => {
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit])
      return suitOrder[a.suit] - suitOrder[b.suit]
    return a.value - b.value
  })
}

export const isSameTileTemplate = (t1: Tile, t2: Tile): boolean => {
  return t1.suit === t2.suit && t1.value === t2.value
}

// Return a string key representing the tile (ignores specific ID)
export const getTileKey = (t: Tile) => `${t.suit}-${t.value}`

// Returns a Map of tileKey -> count
export const countTiles = (tiles: Tile[]): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const t of tiles) {
    const k = getTileKey(t)
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  return counts
}

// Check if exactly 7 pairs
export const checkSevenPairs = (hand: Tile[]): boolean => {
  if (hand.length !== 14) return false
  const counts = countTiles(hand)
  let pairCount = 0
  for (const count of counts.values()) {
    if (count === 2) pairCount++
    else if (count === 4) pairCount += 2
    else return false
  }
  return pairCount === 7
}

// Backtracking solver to check if tiles can form valid sets (triplets or sequences) + 1 pair
export const checkStandardHu = (tiles: Tile[]): boolean => {
  if (tiles.length % 3 !== 2) return false

  // Convert into an array of strings representing the hand
  const handKeys = tiles.map(getTileKey).sort()

  const counts: Record<string, number> = {}
  for (const k of handKeys) {
    counts[k] = (counts[k] || 0) + 1
  }

  const uniqueTiles = Object.keys(counts).sort()

  // Helper to extract sequences
  const removeSet = (
    c: Record<string, number>,
    t1: string,
    t2: string,
    t3: string,
  ): boolean => {
    if ((c[t1] || 0) > 0 && (c[t2] || 0) > 0 && (c[t3] || 0) > 0) {
      c[t1] = (c[t1] || 0) - 1
      c[t2] = (c[t2] || 0) - 1
      c[t3] = (c[t3] || 0) - 1
      return true
    }
    return false
  }
  const addSet = (
    c: Record<string, number>,
    t1: string,
    t2: string,
    t3: string,
  ) => {
    c[t1] = (c[t1] || 0) + 1
    c[t2] = (c[t2] || 0) + 1
    c[t3] = (c[t3] || 0) + 1
  }

  const solve = (c: Record<string, number>, targetSets: number): boolean => {
    if (targetSets === 0) return true

    // Find first tile that has > 0 count
    const firstTile = uniqueTiles.find((t) => (c[t] || 0) > 0)
    if (!firstTile) return false

    // Try triplet
    if ((c[firstTile] || 0) >= 3) {
      c[firstTile] = (c[firstTile] || 0) - 3
      if (solve(c, targetSets - 1)) return true
      c[firstTile] = (c[firstTile] || 0) + 3
    }

    // Try sequence (only numerical suits)
    const [suit, valStr] = firstTile.split('-')
    if (suit === 'characters' || suit === 'dots' || suit === 'bamboos') {
      const v = parseInt(valStr || '0', 10)
      if (v > 0 && v <= 7) {
        const t2 = `${suit}-${v + 1}`
        const t3 = `${suit}-${v + 2}`
        if (removeSet(c, firstTile, t2, t3)) {
          if (solve(c, targetSets - 1)) return true
          addSet(c, firstTile, t2, t3)
        }
      }
    }

    return false
  }

  // Try each unique tile that has at least 2 as the eye (pair)
  for (const eye of uniqueTiles) {
    if ((counts[eye] || 0) >= 2) {
      counts[eye] = (counts[eye] || 0) - 2
      const targetSets = (tiles.length - 2) / 3
      if (solve(counts, targetSets)) {
        return true
      }
      counts[eye] = (counts[eye] || 0) + 2
    }
  }

  return false
}

// Check if a state is Hu
export const canHu = (hand: Tile[]): boolean => {
  // A player can only Hu if hand + melds equals 14 conceptually
  // But since melds are separate, we only evaluate the hand tiles.
  // If they have 4 melds, hand length is 2. If 0 melds, hand length is 14.
  if (hand.length % 3 !== 2) return false
  if (checkSevenPairs(hand)) return true
  return checkStandardHu(hand)
}

// Check if player can Pon a discarded tile
export const canPon = (hand: Tile[], discardedTile: Tile): boolean => {
  const key = getTileKey(discardedTile)
  const counts = countTiles(hand)
  return (counts.get(key) || 0) >= 2
}

// Check if player can Kan a discarded tile (Direct Kong)
export const canKan = (hand: Tile[], discardedTile: Tile): boolean => {
  const key = getTileKey(discardedTile)
  const counts = countTiles(hand)
  return (counts.get(key) || 0) >= 3
}

// Check if player can secretly Kan a drawn tile (An-Kan or adding to Pon)
export const getConcealedKanTiles = (hand: Tile[]): Tile[] => {
  const counts = countTiles(hand)
  const kanTiles: Tile[] = []
  counts.forEach((count, key) => {
    if (count === 4) {
      const t = hand.find((t) => getTileKey(t) === key)
      if (t) kanTiles.push(t)
    }
  })
  return kanTiles
}

// Check if player can Chi a discarded tile (only works on numerical suits)
export const getPossibleChis = (
  hand: Tile[],
  discardedTile: Tile,
): Tile[][] => {
  if (discardedTile.suit === 'winds' || discardedTile.suit === 'dragons')
    return []
  const v = discardedTile.value
  const suit = discardedTile.suit
  const counts = countTiles(hand)

  // We check for [v-2, v-1], [v-1, v+1], [v+1, v+2]
  const combos: Tile[][] = []

  const has = (val: number) => (counts.get(`${suit}-${val}`) || 0) > 0
  const findTile = (val: number): Tile =>
    hand.find((t) => t.suit === suit && t.value === val)!

  if (v >= 3 && has(v - 2) && has(v - 1)) {
    combos.push([findTile(v - 2), findTile(v - 1)])
  }
  if (v >= 2 && v <= 8 && has(v - 1) && has(v + 1)) {
    combos.push([findTile(v - 1), findTile(v + 1)])
  }
  if (v <= 7 && has(v + 1) && has(v + 2)) {
    combos.push([findTile(v + 1), findTile(v + 2)])
  }

  return combos
}

// Extremely simplified Tai calculation based on the provided rules
// Basic 1, All Pungs 2, 7 Pairs 2, Half Flush 2, Full Flush 4
// Dragons (Small 4, Big 8), Winds (Small 8, Big 16)
export const calculateTai = (
  hand: Tile[],
  melds: Meld[],
  isZiMo: boolean,
  isMenQing: boolean,
): { tai: number; reasons: string[] } => {
  let tai = 0
  const reasons: string[] = []

  if (isZiMo) {
    tai += 1
    reasons.push('自摸 (1台)')
  }
  if (isMenQing && melds.every((m) => m.isConcealed)) {
    tai += 1
    reasons.push('門清 (1台)')
  }

  const allTiles = [...hand, ...melds.flatMap((m) => m.tiles)]
  const counts = countTiles(allTiles)

  // 7 Pairs check
  if (melds.length === 0 && checkSevenPairs(hand)) {
    tai += 2
    reasons.push('七對子 (2台)')
  } else {
    // Ping Hu (sequence only hand, simple heuristic - no pon/kan except pair)
    const hasPonKan =
      melds.some((m) => m.type !== 'chi') ||
      Array.from(counts.values()).some((v) => v >= 3)
    if (!hasPonKan) {
      tai += 1
      reasons.push('平胡 (1台)')
    }

    // All Pungs (對對胡)
    const isAllPung =
      melds.every((m) => m.type !== 'chi') &&
      hand.length % 3 === 2 &&
      Array.from(countTiles(hand).values()).every((v) => v === 3 || v === 2)
    // Note: checking all pungs perfectly requires the solver, using heuristic for now
    if (isAllPung) {
      tai += 2
      reasons.push('對對胡 (2台)')
    }
  }

  // Flush checks
  const hasCharacters = allTiles.some((t) => t.suit === 'characters')
  const hasDots = allTiles.some((t) => t.suit === 'dots')
  const hasBamboos = allTiles.some((t) => t.suit === 'bamboos')
  const hasHonors = allTiles.some(
    (t) => t.suit === 'winds' || t.suit === 'dragons',
  )

  const suitCount = [hasCharacters, hasDots, hasBamboos].filter(Boolean).length
  if (suitCount === 1) {
    if (hasHonors) {
      tai += 2
      reasons.push('混一色 (2台)')
    } else {
      tai += 4
      reasons.push('清一色 (4台)')
    }
  }

  // Dragons
  const zhong = counts.get('dragons-1') || 0
  const fa = counts.get('dragons-2') || 0
  const bai = counts.get('dragons-3') || 0
  const dragonMeldCount =
    (zhong >= 3 ? 1 : 0) + (fa >= 3 ? 1 : 0) + (bai >= 3 ? 1 : 0)
  const dragonPairs =
    (zhong === 2 ? 1 : 0) + (fa === 2 ? 1 : 0) + (bai === 2 ? 1 : 0)

  if (dragonMeldCount === 3) {
    tai += 8
    reasons.push('大三元 (8台)')
  } else if (dragonMeldCount === 2 && dragonPairs === 1) {
    tai += 4
    reasons.push('小三元 (4台)')
  }

  // Winds
  const east = counts.get('winds-1') || 0
  const south = counts.get('winds-2') || 0
  const west = counts.get('winds-3') || 0
  const north = counts.get('winds-4') || 0
  const windMeldCount =
    (east >= 3 ? 1 : 0) +
    (south >= 3 ? 1 : 0) +
    (west >= 3 ? 1 : 0) +
    (north >= 3 ? 1 : 0)
  const windPairs =
    (east === 2 ? 1 : 0) +
    (south === 2 ? 1 : 0) +
    (west === 2 ? 1 : 0) +
    (north === 2 ? 1 : 0)

  if (windMeldCount === 4) {
    tai += 16
    reasons.push('大四喜 (16台)')
  } else if (windMeldCount === 3 && windPairs === 1) {
    tai += 8
    reasons.push('小四喜 (8台)')
  }

  return { tai, reasons }
}
