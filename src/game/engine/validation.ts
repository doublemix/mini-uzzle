import type {
  PlacedBlock,
  PuzzleCard,
  StabilityLoad,
  SupportContact,
  ValidationResult,
} from '../types'
import { contactContains, mergeLoad, supportMargin } from './stability'

const MIN_STABILITY_MARGIN = 0.1

function overlapRange(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  const start = Math.max(aStart, bStart)
  const end = Math.min(aEnd, bEnd)

  return end > start ? { start, end } : null
}

function createSupportMap(blocks: PlacedBlock[]) {
  const supportMap = new Map<string, SupportContact[]>()
  const blockMap = new Map(blocks.map((block) => [block.id, block]))

  for (const block of blocks) {
    const contacts: SupportContact[] = []

    if (block.y === 0) {
      contacts.push({ supporterId: 'table', start: block.x, end: block.x + block.width })
    }

    for (const candidate of blocks) {
      if (candidate.id === block.id) {
        continue
      }

      const candidateTop = candidate.y + candidate.height
      if (candidateTop !== block.y) {
        continue
      }

      const overlap = overlapRange(
        block.x,
        block.x + block.width,
        candidate.x,
        candidate.x + candidate.width,
      )

      if (overlap) {
        contacts.push({
          supporterId: candidate.id,
          start: overlap.start,
          end: overlap.end,
        })
      }
    }

    supportMap.set(block.id, contacts)
  }

  return { supportMap, blockMap }
}

function hasCollision(blocks: PlacedBlock[]) {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    for (let otherIndex = index + 1; otherIndex < blocks.length; otherIndex += 1) {
      const other = blocks[otherIndex]
      const horizontal = overlapRange(block.x, block.x + block.width, other.x, other.x + other.width)
      const vertical = overlapRange(block.y, block.y + block.height, other.y, other.y + other.height)

      if (horizontal && vertical) {
        return `${block.id} overlaps ${other.id}`
      }
    }
  }

  return null
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

function findIsolatedBlocks(blocks: PlacedBlock[]) {
  if (blocks.length <= 1) {
    return []
  }

  return blocks.filter(
    (block) => !blocks.some((other) => other.id !== block.id && touches(block, other)),
  )
}

export function validatePuzzle(puzzle: PuzzleCard): ValidationResult {
  const notes: string[] = []
  const { blocks, boardWidth, maxHeight } = puzzle
  const collision = hasCollision(blocks)

  if (collision) {
    return { isValid: false, notes: [collision], stabilityMargin: -1 }
  }

  for (const block of blocks) {
    if (block.x < 0 || block.y < 0 || block.x + block.width > boardWidth) {
      return {
        isValid: false,
        notes: [`${block.id} exceeds the board bounds.`],
        stabilityMargin: -1,
      }
    }

    if (block.y + block.height > maxHeight) {
      return {
        isValid: false,
        notes: [`${block.id} exceeds the board height.`],
        stabilityMargin: -1,
      }
    }
  }

  const isolatedBlocks = findIsolatedBlocks(blocks)
  if (isolatedBlocks.length > 0) {
    return {
      isValid: false,
      notes: [`${isolatedBlocks[0].id} is isolated. Every block must touch at least one other block.`],
      stabilityMargin: -1,
    }
  }

  const { supportMap } = createSupportMap(blocks)
  const orderedBlocks = [...blocks].sort(
    (left, right) => right.y + right.height - (left.y + left.height),
  )
  const carriedLoads = new Map<string, StabilityLoad>()
  let minimumMargin = Number.POSITIVE_INFINITY

  for (const block of orderedBlocks) {
    const contacts = supportMap.get(block.id) ?? []
    if (block.y > 0 && contacts.length === 0) {
      return {
        isValid: false,
        notes: [`${block.id} is floating without support.`],
        stabilityMargin: -1,
      }
    }

    const incoming = carriedLoads.get(block.id) ?? { mass: 0, moment: 0 }
    const combined = mergeLoad(block, incoming)
    const projection = combined.moment / combined.mass

    if (block.y > 0 && !contactContains(contacts, projection)) {
      return {
        isValid: false,
        notes: [
          `${block.id} tips because the combined center of mass falls outside its support span.`,
        ],
        stabilityMargin: -1,
      }
    }

    const margin = block.y === 0 ? block.width / 2 : supportMargin(contacts, projection)
    if (block.y > 0 && margin < MIN_STABILITY_MARGIN) {
      return {
        isValid: false,
        notes: [`${block.id} is too close to tipping at the edge of its support span.`],
        stabilityMargin: margin,
      }
    }

    minimumMargin = Math.min(minimumMargin, margin)

    const supporterContacts = contacts.filter((contact) => contact.supporterId !== 'table')
    const totalSpan = supporterContacts.reduce(
      (total, contact) => total + (contact.end - contact.start),
      0,
    )

    for (const contact of supporterContacts) {
      const share = (contact.end - contact.start) / totalSpan
      const current = carriedLoads.get(contact.supporterId) ?? { mass: 0, moment: 0 }
      carriedLoads.set(contact.supporterId, {
        mass: current.mass + combined.mass * share,
        moment: current.moment + combined.moment * share,
      })
    }
  }

  const topBlock = [...blocks].sort((left, right) => right.y - left.y)[0]
  if (topBlock) {
    const topSupporters = supportMap.get(topBlock.id) ?? []
    if (topSupporters.length === 0) {
      notes.push('Top block stands directly on the table.')
    }
  }

  notes.push(`Validated ${blocks.length} blocks with recursive center-of-mass checks.`)
  notes.push('Half-tile offsets are allowed only where the support span can carry the full assembly.')
  notes.push(`Minimum supported stability margin is ${MIN_STABILITY_MARGIN.toFixed(1)} half-units.`)

  return {
    isValid: true,
    notes,
    stabilityMargin: Number.isFinite(minimumMargin) ? minimumMargin : 0,
  }
}

export function summarizeSupporters(puzzle: PuzzleCard) {
  const { supportMap, blockMap } = createSupportMap(puzzle.blocks)

  return puzzle.blocks.map((block) => {
    const contacts = supportMap.get(block.id) ?? []
    const labels = contacts.map((contact) => {
      if (contact.supporterId === 'table') {
        return 'table'
      }

      const supporter = blockMap.get(contact.supporterId)
      return supporter ? `${supporter.color} ${supporter.id}` : contact.supporterId
    })

    return `${block.color} ${block.id}: ${labels.join(', ') || 'unsupported'}`
  })
}