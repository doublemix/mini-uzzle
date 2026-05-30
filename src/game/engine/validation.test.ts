import { describe, expect, it } from 'vitest'
import type { PuzzleCard } from '../types'
import { validatePuzzle } from './validation'

function createCard(blocks: PuzzleCard['blocks']): PuzzleCard {
  return {
    id: 'test-card',
    name: 'test-card',
    seed: 'seed',
    setCount: 1,
    boardWidth: 18,
    maxHeight: 20,
    blocks,
  }
}

describe('validatePuzzle', () => {
  it('rejects blocks teetering on edge support', () => {
    const card = createCard([
      {
        id: 'base',
        color: 'blue',
        orientation: 'horizontal',
        x: 0,
        y: 0,
        width: 6,
        height: 2,
      },
      {
        id: 'top',
        color: 'red',
        orientation: 'horizontal',
        x: 3,
        y: 2,
        width: 6,
        height: 2,
      },
    ])

    const result = validatePuzzle(card)

    expect(result.isValid).toBe(false)
    expect(result.notes[0]).toContain('too close to tipping')
  })

  it('rejects isolated blocks that touch nothing', () => {
    const card = createCard([
      {
        id: 'left',
        color: 'green',
        orientation: 'horizontal',
        x: 0,
        y: 0,
        width: 6,
        height: 2,
      },
      {
        id: 'right',
        color: 'yellow',
        orientation: 'horizontal',
        x: 10,
        y: 0,
        width: 6,
        height: 2,
      },
    ])

    const result = validatePuzzle(card)

    expect(result.isValid).toBe(false)
    expect(result.notes[0]).toContain('isolated')
  })
})