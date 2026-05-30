import { BLOCK_COLORS, type InventoryEntry } from '../types'

export function createInventory(setCount: number): InventoryEntry[] {
  const normalizedSetCount = Math.max(1, Math.floor(setCount))

  return BLOCK_COLORS.map((color) => ({
    color,
    count: normalizedSetCount,
  }))
}

export function expandInventory(setCount: number) {
  return createInventory(setCount).flatMap((entry) =>
    Array.from({ length: entry.count }, (_, index) => ({
      id: `${entry.color}-${index + 1}`,
      color: entry.color,
    })),
  )
}