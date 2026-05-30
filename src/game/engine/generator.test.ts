import { describe, expect, it } from 'vitest'
import { generatePuzzle } from './generator'
import { validatePuzzle } from './validation'

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
})