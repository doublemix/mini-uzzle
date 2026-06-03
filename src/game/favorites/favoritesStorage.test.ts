import { describe, expect, it } from 'vitest'
import type { FavoriteCard } from './favoritesStorage'
import {
  addFavorite,
  DEFAULT_LIST_ID,
  FAVORITES_STORAGE_KEY,
  getList,
  isFavorited,
  removeFavorite,
} from './favoritesStorage'

function makeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
  }
}

const sampleCard: Omit<FavoriteCard, 'savedAt'> = {
  id: 'abc123',
  name: 'Card ABC123',
  seed: 'abc123',
  setCount: 1,
  boardWidth: 22,
  maxHeight: 22,
  blocks: [
    { id: 'b1', color: 'red', orientation: 'horizontal', x: 0, y: 0, width: 6, height: 2 },
  ],
}

describe('getList', () => {
  it('returns an empty default list when storage is empty', () => {
    const storage = makeStorage()
    const list = getList(storage)
    expect(list.id).toBe(DEFAULT_LIST_ID)
    expect(list.cards).toEqual([])
  })

  it('returns an empty list when storage contains invalid JSON', () => {
    const storage = makeStorage()
    storage.setItem(FAVORITES_STORAGE_KEY, 'not-json')
    const list = getList(storage)
    expect(list.cards).toEqual([])
  })

  it('returns an empty list when stored version is wrong', () => {
    const storage = makeStorage()
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 99, lists: {} }))
    const list = getList(storage)
    expect(list.cards).toEqual([])
  })
})

describe('addFavorite', () => {
  it('adds a card to the default list', () => {
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    const list = getList(storage)
    expect(list.cards).toHaveLength(1)
    expect(list.cards[0].id).toBe('abc123')
    expect(list.cards[0].seed).toBe('abc123')
    expect(list.cards[0].blocks).toHaveLength(1)
  })

  it('records a savedAt timestamp', () => {
    const before = Date.now()
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    const after = Date.now()
    const card = getList(storage).cards[0]
    expect(card.savedAt).toBeGreaterThanOrEqual(before)
    expect(card.savedAt).toBeLessThanOrEqual(after)
  })

  it('does not add duplicate cards', () => {
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    addFavorite(storage, sampleCard)
    expect(getList(storage).cards).toHaveLength(1)
  })

  it('can add multiple distinct cards', () => {
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    addFavorite(storage, { ...sampleCard, id: 'xyz789', seed: 'xyz789', name: 'Card XYZ789' })
    expect(getList(storage).cards).toHaveLength(2)
  })
})

describe('removeFavorite', () => {
  it('removes a card from the list', () => {
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    removeFavorite(storage, 'abc123')
    expect(getList(storage).cards).toHaveLength(0)
  })

  it('is a no-op for a card that does not exist', () => {
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    removeFavorite(storage, 'nonexistent')
    expect(getList(storage).cards).toHaveLength(1)
  })

  it('is a no-op on empty storage', () => {
    const storage = makeStorage()
    expect(() => removeFavorite(storage, 'abc123')).not.toThrow()
  })
})

describe('isFavorited', () => {
  it('returns false when the card is not in the list', () => {
    const storage = makeStorage()
    expect(isFavorited(storage, 'abc123')).toBe(false)
  })

  it('returns true after adding a card', () => {
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    expect(isFavorited(storage, 'abc123')).toBe(true)
  })

  it('returns false after removing a card', () => {
    const storage = makeStorage()
    addFavorite(storage, sampleCard)
    removeFavorite(storage, 'abc123')
    expect(isFavorited(storage, 'abc123')).toBe(false)
  })
})
