export const BLOCK_HALF_UNIT = 18

export const BLOCK_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'white',
  'black',
] as const

export type BlockColor = (typeof BLOCK_COLORS)[number]
export type BlockOrientation = 'horizontal' | 'vertical'

export interface InventoryEntry {
  color: BlockColor
  count: number
}

export interface GenerationConfig {
  seed: string
  setCount: number
  boardWidth: number
  maxHeight: number
}

export interface PlacedBlock {
  id: string
  color: BlockColor
  orientation: BlockOrientation
  x: number
  y: number
  width: number
  height: number
}

export interface PuzzleCard {
  id: string
  name: string
  seed: string
  setCount: number
  boardWidth: number
  maxHeight: number
  blocks: PlacedBlock[]
}

export interface SupportContact {
  supporterId: string | 'table'
  start: number
  end: number
}

export interface StabilityLoad {
  mass: number
  moment: number
}

export interface ValidationResult {
  isValid: boolean
  notes: string[]
  stabilityMargin: number
}