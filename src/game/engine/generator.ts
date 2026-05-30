import type { GenerationConfig, PlacedBlock, PuzzleCard } from '../types'
import { expandInventory } from './inventory'
import { createRandom } from './seeding'
import { summarizeSupporters, validatePuzzle } from './validation'

const HORIZONTAL = { width: 6, height: 2 } as const
const VERTICAL = { width: 2, height: 6 } as const

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function createCandidates(boardWidth: number, maxHeight: number) {
  const candidates: Array<Pick<PlacedBlock, 'x' | 'y' | 'orientation' | 'width' | 'height'>> = []

  for (const orientation of ['horizontal', 'vertical'] as const) {
    const shape = orientation === 'horizontal' ? HORIZONTAL : VERTICAL
    for (let x = 0; x <= boardWidth - shape.width; x += 1) {
      for (let y = 0; y <= maxHeight - shape.height; y += 1) {
        candidates.push({ x, y, orientation, width: shape.width, height: shape.height })
      }
    }
  }

  return candidates
}

export function generatePuzzle(config: GenerationConfig): {
  puzzle: PuzzleCard
  validationNotes: string[]
} {
  const random = createRandom(config.seed)
  const inventory = shuffle(expandInventory(config.setCount), random)
  const targetBlocks = Math.min(inventory.length, Math.max(6, config.setCount * 8))
  const candidates = shuffle(createCandidates(config.boardWidth, config.maxHeight), random)
  const placed: PlacedBlock[] = []

  for (const item of inventory.slice(0, targetBlocks)) {
    let placedBlock: PlacedBlock | null = null

    for (const candidate of candidates) {
      const block: PlacedBlock = {
        id: item.id,
        color: item.color,
        x: candidate.x,
        y: candidate.y,
        orientation: candidate.orientation,
        width: candidate.width,
        height: candidate.height,
      }

      const puzzleDraft: PuzzleCard = {
        id: config.seed,
        name: 'draft',
        seed: config.seed,
        setCount: config.setCount,
        boardWidth: config.boardWidth,
        maxHeight: config.maxHeight,
        blocks: [...placed, block],
      }

      if (validatePuzzle(puzzleDraft).isValid) {
        placedBlock = block
        break
      }
    }

    if (!placedBlock) {
      break
    }

    placed.push(placedBlock)
  }

  const puzzle: PuzzleCard = {
    id: config.seed,
    name: `Card ${config.seed.toUpperCase()}`,
    seed: config.seed,
    setCount: config.setCount,
    boardWidth: config.boardWidth,
    maxHeight: config.maxHeight,
    blocks: placed.sort((left, right) => left.y - right.y || left.x - right.x),
  }
  const validation = validatePuzzle(puzzle)

  return {
    puzzle,
    validationNotes: [...validation.notes, ...summarizeSupporters(puzzle)],
  }
}