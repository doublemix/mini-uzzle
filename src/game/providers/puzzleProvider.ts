import type { GenerationConfig, PuzzleCard, ValidationResult } from '../types'
import { generatePuzzle } from '../engine/generator'
import { validatePuzzle } from '../engine/validation'

export interface PuzzleProvider {
  generate(config: GenerationConfig): PuzzleCard
  validate(card: PuzzleCard): ValidationResult
}

export const localPuzzleProvider: PuzzleProvider = {
  generate(config) {
    return generatePuzzle(config).puzzle
  },
  validate(card) {
    return validatePuzzle(card)
  },
}