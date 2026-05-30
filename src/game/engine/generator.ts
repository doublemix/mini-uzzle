import type { GenerationConfig, PlacedBlock, PuzzleCard } from '../types'
import { expandInventory } from './inventory'
import { createRandom } from './seeding'
import { summarizeSupporters, validatePuzzle } from './validation'

const HORIZONTAL = { width: 6, height: 2 } as const
const VERTICAL = { width: 2, height: 6 } as const
const BASE_BOUND_WIDTH = 18
const BASE_BOUND_HEIGHT = 20
const TOP_CANDIDATE_POOL = 5

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

function estimateBounds(blocks: PlacedBlock[]) {
  const span = footprint(blocks)

  return {
    boardWidth: Math.max(BASE_BOUND_WIDTH, span.maxX + 2),
    maxHeight: Math.max(BASE_BOUND_HEIGHT, span.maxY + 2),
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
    if (x < 0) {
      continue
    }
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

function scoreCandidate(
  placed: PlacedBlock[],
  candidate: PlacedBlock,
  random: () => number,
): { score: number; validationMargin: number } | null {
  const draftBlocks = [...placed, candidate]
  const draftBounds = estimateBounds(draftBlocks)
  const validation = validatePuzzle({
    id: 'draft',
    name: 'draft',
    seed: 'draft',
    setCount: 1,
    boardWidth: draftBounds.boardWidth,
    maxHeight: draftBounds.maxHeight,
    blocks: draftBlocks,
  })

  if (!validation.isValid) {
    return null
  }

  const baseFootprint = footprint(placed)
  const nextFootprint = footprint(draftBlocks)
  const widthIncrease = Math.max(0, nextFootprint.width - baseFootprint.width)
  const heightIncrease = Math.max(0, nextFootprint.height - baseFootprint.height)
  const stability = Math.max(0, validation.stabilityMargin)
  const score =
    stability * 0.6 +
    heightIncrease * 0.22 -
    widthIncrease * 0.25 +
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
      x: 0,
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
      const pick = ranked[Math.floor(random() * poolSize)]
      placedBlock = pick.candidate
    }

    if (!placedBlock) {
      break
    }

    placed.push(placedBlock)
  }

  const bounds = estimateBounds(placed)

  const puzzle: PuzzleCard = {
    id: config.seed,
    name: `Card ${config.seed.toUpperCase()}`,
    seed: config.seed,
    setCount: config.setCount,
    boardWidth: bounds.boardWidth,
    maxHeight: bounds.maxHeight,
    blocks: placed.sort((left, right) => left.y - right.y || left.x - right.x),
  }
  const validation = validatePuzzle(puzzle)

  return {
    puzzle,
    validationNotes: [...validation.notes, ...summarizeSupporters(puzzle)],
  }
}