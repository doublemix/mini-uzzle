import type { PlacedBlock, StabilityLoad, SupportContact } from '../types'

const EPSILON = 1e-6

function blockCenterX(block: PlacedBlock) {
  return block.x + block.width / 2
}

export function contactContains(contacts: SupportContact[], projection: number) {
  return contacts.some(
    (contact) => projection >= contact.start - EPSILON && projection <= contact.end + EPSILON,
  )
}

export function supportMargin(contacts: SupportContact[], projection: number) {
  const distances = contacts.flatMap((contact) => {
    if (projection < contact.start || projection > contact.end) {
      return []
    }

    return [projection - contact.start, contact.end - projection]
  })

  if (distances.length === 0) {
    return -1
  }

  return Math.min(...distances)
}

export function mergeLoad(block: PlacedBlock, load: StabilityLoad): StabilityLoad {
  return {
    mass: load.mass + 1,
    moment: load.moment + blockCenterX(block),
  }
}