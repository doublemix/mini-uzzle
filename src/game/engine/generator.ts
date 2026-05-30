import type { GenerationConfig, PlacedBlock, PuzzleCard } from '../types'
import { expandInventory } from './inventory'
import { createRandom } from './seeding'
import { summarizeSupporters, validatePuzzle } from './validation'

const HORIZONTAL = { width: 6, height: 2 } as const
const VERTICAL = { width: 2, height: 6 } as const
const BOUND_PADDING = 2
const TOP_CANDIDATE_POOL = 12

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function shapeFor(orientation: 'horizontal' | 'vertical') {
  return orientation === 'horizontal' ? HORIZONTAL : VERTICAL
}

function footprint(blocks: PlacedBlock[]) {
  if (blocks.length === 0) {
    return { minX: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const minX = Math.min(...blocks.map((block) => block.x))
  const maxX = Math.max(...blocks.map((block) => block.x + block.width))
  const maxY = Math.max(...blocks.map((block) => block.y + block.height))
  return {
    minX,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY,
  }
}

function overlapRange(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  const start = Math.max(aStart, bStart)
  const end = Math.min(aEnd, bEnd)

  return end > start ? { start, end } : null
}

function touches(a: PlacedBlock, b: PlacedBlock) {
  const horizontalTouch =
    (a.x + a.width === b.x || b.x + b.width === a.x) &&
    overlapRange(a.y, a.y + a.height, b.y, b.y + b.height)
  const verticalTouch =
    (a.y + a.height === b.y || b.y + b.height === a.y) &&
    overlapRange(a.x, a.x + a.width, b.x, b.x + b.width)

  return Boolean(horizontalTouch || verticalTouch)
}

function normalizeBlocks(blocks: PlacedBlock[]) {
  if (blocks.length === 0) {
    return blocks
  }

  const minX = Math.min(...blocks.map((block) => block.x))
  if (minX >= 0) {
    return blocks
  }

  const shift = -minX
  return blocks.map((block) => ({
    ...block,
    x: block.x + shift,
  }))
}

function estimateBounds(blocks: PlacedBlock[]) {
  const normalized = normalizeBlocks(blocks)
  const span = footprint(normalized)

  return {
    boardWidth: span.width + BOUND_PADDING * 2,
    maxHeight: span.height + BOUND_PADDING * 2,
  }
}

function buildCandidate(
  item: { id: string; color: PlacedBlock['color'] },
  orientation: 'horizontal' | 'vertical',
  x: number,
  y: number,
): PlacedBlock {
  const shape = shapeFor(orientation)
  return {
    id: item.id,
    color: item.color,
    orientation,
    x,
    y,
    width: shape.width,
    height: shape.height,
  }
}

function addSideContacts(
  existing: PlacedBlock,
  orientation: 'horizontal' | 'vertical',
  anchorX: number,
  item: { id: string; color: PlacedBlock['color'] },
  out: Map<string, PlacedBlock>,
) {
  const shape = shapeFor(orientation)
  for (let y = existing.y - shape.height + 1; y <= existing.y + existing.height - 1; y += 1) {
    if (y < 0) {
      continue
    }
    const block = buildCandidate(item, orientation, anchorX, y)
    out.set(`${block.orientation}:${block.x}:${block.y}`, block)
  }
}

function addVerticalContacts(
  existing: PlacedBlock,
  orientation: 'horizontal' | 'vertical',
  anchorY: number,
  item: { id: string; color: PlacedBlock['color'] },
  out: Map<string, PlacedBlock>,
) {
  const shape = shapeFor(orientation)
  if (anchorY < 0) {
    return
  }

  for (let x = existing.x - shape.width + 1; x <= existing.x + existing.width - 1; x += 1) {
    const block = buildCandidate(item, orientation, x, anchorY)
    out.set(`${block.orientation}:${block.x}:${block.y}`, block)
  }
}

function frontierCandidates(
  placed: PlacedBlock[],
  item: { id: string; color: PlacedBlock['color'] },
) {
  const map = new Map<string, PlacedBlock>()
  for (const existing of placed) {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const shape = shapeFor(orientation)
      addSideContacts(existing, orientation, existing.x - shape.width, item, map)
      addSideContacts(existing, orientation, existing.x + existing.width, item, map)
      addVerticalContacts(existing, orientation, existing.y + existing.height, item, map)
      addVerticalContacts(existing, orientation, existing.y - shape.height, item, map)
    }
  }

  return [...map.values()]
}

function orientationMixScore(placed: PlacedBlock[], candidate: PlacedBlock) {
  const touching = placed.filter((block) => touches(block, candidate))
  if (touching.length === 0) {
    return -1
  }

  const oppositeCount = touching.filter(
    (block) => block.orientation !== candidate.orientation,
  ).length
  const sameCount = touching.length - oppositeCount
  return oppositeCount * 0.24 - sameCount * 0.08
}

function opennessScore(placed: PlacedBlock[], candidate: PlacedBlock) {
  const neighbors = placed.filter((block) => {
    const horizontalGap = Math.max(
      0,
      Math.max(block.x - (candidate.x + candidate.width), candidate.x - (block.x + block.width)),
    )
    const verticalGap = Math.max(
      0,
      Math.max(block.y - (candidate.y + candidate.height), candidate.y - (block.y + block.height)),
    )

    return horizontalGap <= 4 && verticalGap <= 4
  }).length

  if (neighbors <= 2) {
    return 0.18
  }

  if (neighbors === 3) {
    return 0.08
  }

  return -0.06 * (neighbors - 3)
}

function balancedGrowthScore(base: ReturnType<typeof footprint>, next: ReturnType<typeof footprint>) {
  const widthIncrease = Math.max(0, next.width - base.width)
  const heightIncrease = Math.max(0, next.height - base.height)
  const totalGrowth = widthIncrease + heightIncrease

  if (totalGrowth === 0) {
    return 0
  }

  const imbalance = Math.abs(widthIncrease - heightIncrease)
  return totalGrowth * 0.05 - imbalance * 0.04
}

function scoreCandidate(
  placed: PlacedBlock[],
  candidate: PlacedBlock,
  random: () => number,
): { score: number; validationMargin: number } | null {
  const draftBlocks = [...placed, candidate]
  const normalizedDraft = normalizeBlocks(draftBlocks)
  const draftBounds = estimateBounds(normalizedDraft)
  const validation = validatePuzzle({
    id: 'draft',
    name: 'draft',
    seed: 'draft',
    setCount: 1,
    boardWidth: draftBounds.boardWidth,
    maxHeight: draftBounds.maxHeight,
    blocks: normalizedDraft,
  })

  if (!validation.isValid) {
    return null
  }

  const baseFootprint = footprint(placed)
  const nextFootprint = footprint(draftBlocks)
  const widthIncrease = Math.max(0, nextFootprint.width - baseFootprint.width)
  const stability = Math.max(0, validation.stabilityMargin)
  const touchingCount = placed.filter((block) => touches(block, candidate)).length
  const candidateCenter = candidate.x + candidate.width / 2
  const draftCenter = nextFootprint.minX + nextFootprint.width / 2
  const centerPenalty = Math.abs(candidateCenter - draftCenter)
  const orientationMix = orientationMixScore(placed, candidate)
  const openness = opennessScore(placed, candidate)
  const growthBalance = balancedGrowthScore(baseFootprint, nextFootprint)
  const widthPenalty = Math.max(0, widthIncrease - 4) * 0.04
  const score =
    stability * 0.55 +
    touchingCount * 0.14 +
    orientationMix +
    openness +
    growthBalance -
    widthPenalty -
    centerPenalty * 0.012 +
    random() * 0.06

  return { score, validationMargin: validation.stabilityMargin }
}

export function generatePuzzle(config: GenerationConfig): {
  puzzle: PuzzleCard
  validationNotes: string[]
} {
  const random = createRandom(config.seed)
  const inventory = shuffle(expandInventory(config.setCount), random)
  const targetBlocks = Math.min(inventory.length, Math.max(6, config.setCount * 8))
  const placed: PlacedBlock[] = []

  const firstItem = inventory[0]
  if (firstItem) {
    placed.push({
      id: firstItem.id,
      color: firstItem.color,
      orientation: 'horizontal',
      x: -Math.floor(HORIZONTAL.width / 2),
      y: 0,
      width: HORIZONTAL.width,
      height: HORIZONTAL.height,
    })
  }

  for (const item of inventory.slice(1, targetBlocks)) {
    let placedBlock: PlacedBlock | null = null
    const candidates = frontierCandidates(placed, item)
    const ranked = candidates
      .map((candidate) => {
        const scored = scoreCandidate(placed, candidate, random)
        if (!scored) {
          return null
        }
        return { candidate, score: scored.score, stability: scored.validationMargin }
      })
      .filter((entry): entry is { candidate: PlacedBlock; score: number; stability: number } =>
        Boolean(entry),
      )
      .sort((left, right) => right.score - left.score)

    if (ranked.length > 0) {
      const poolSize = Math.min(TOP_CANDIDATE_POOL, ranked.length)
      const pool = ranked.slice(0, poolSize)
      const totalWeight = pool.reduce((sum, _, index) => sum + (poolSize - index), 0)
      let cursor = random() * totalWeight

      for (let index = 0; index < pool.length; index += 1) {
        cursor -= poolSize - index
        if (cursor <= 0) {
          placedBlock = pool[index].candidate
          break
        }
      }

      placedBlock ??= pool[pool.length - 1].candidate
    }

    if (!placedBlock) {
      break
    }

    placed.push(placedBlock)
  }

  const normalizedPlaced = normalizeBlocks(placed)
  const bounds = estimateBounds(normalizedPlaced)

  const puzzle: PuzzleCard = {
    id: config.seed,
    name: `Card ${config.seed.toUpperCase()}`,
    seed: config.seed,
    setCount: config.setCount,
    boardWidth: bounds.boardWidth,
    maxHeight: bounds.maxHeight,
    blocks: normalizedPlaced.sort((left, right) => left.y - right.y || left.x - right.x),
  }
  const validation = validatePuzzle(puzzle)

  return {
    puzzle,
    validationNotes: [...validation.notes, ...summarizeSupporters(puzzle)],
  }
}