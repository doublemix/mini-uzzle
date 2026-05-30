import { describe, expect, it } from 'vitest'
import type { PlacedBlock } from '../types'
import { generatePuzzle } from './generator'
import { validatePuzzle } from './validation'

function touches(a: PlacedBlock, b: PlacedBlock) {
  const overlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
    Math.min(aEnd, bEnd) > Math.max(aStart, bStart)

  const horizontalTouch =
    (a.x + a.width === b.x || b.x + b.width === a.x) &&
    overlap(a.y, a.y + a.height, b.y, b.y + b.height)
  const verticalTouch =
    (a.y + a.height === b.y || b.y + b.height === a.y) &&
    overlap(a.x, a.x + a.width, b.x, b.x + b.width)

  return horizontalTouch || verticalTouch
}

describe('generatePuzzle', () => {
  it('is deterministic for a given seed and set count', () => {
    const first = generatePuzzle({
      seed: 'stack-royale',
      setCount: 1,
      boardWidth: 18,
      maxHeight: 20,
    }).puzzle
    const second = generatePuzzle({
      seed: 'stack-royale',
      setCount: 1,
      boardWidth: 18,
      maxHeight: 20,
    }).puzzle

    expect(second).toEqual(first)
  })

  it('produces a valid puzzle for representative input', () => {
    const puzzle = generatePuzzle({
      seed: 'balanced-bridge',
      setCount: 2,
      boardWidth: 18,
      maxHeight: 20,
    }).puzzle

    const validation = validatePuzzle(puzzle)

    expect(puzzle.blocks.length).toBeGreaterThan(0)
    expect(validation.isValid).toBe(true)
    expect(validation.stabilityMargin).toBeGreaterThanOrEqual(0)
  })

  it('does not depend on global board candidate arrays for large requested bounds', () => {
    const puzzle = generatePuzzle({
      seed: 'large-bounds-frontier',
      setCount: 4,
      boardWidth: 10000,
      maxHeight: 10000,
    }).puzzle

    const validation = validatePuzzle(puzzle)

    expect(validation.isValid).toBe(true)
    expect(puzzle.blocks.length).toBeGreaterThan(20)
    expect(puzzle.boardWidth).toBeLessThan(150)
    expect(puzzle.maxHeight).toBeLessThan(150)
  })

  it('keeps each generated block in contact with the structure', () => {
    const puzzle = generatePuzzle({
      seed: 'contact-only-growth',
      setCount: 3,
      boardWidth: 60,
      maxHeight: 60,
    }).puzzle

    const isolated = puzzle.blocks.filter(
      (block) => !puzzle.blocks.some((other) => other.id !== block.id && touches(block, other)),
    )

    expect(isolated).toEqual([])
  })
})