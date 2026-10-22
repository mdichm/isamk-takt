// Signature stable d'un conflit (ST §4.3).
// signature = sha256(regleCode | séances triées | objetType | objetId | créneaux couverts)

import { createHash } from 'crypto';

export type SlotKey = string; // "${jour}|${creneauId}"

export function computeSignature(
  regleCode: string,
  seanceIds: string[],
  objetType: string,
  objetId: string,
  slotKeys: SlotKey[],
): string {
  const sortedSeances = [...seanceIds].sort();
  const sortedSlots = [...slotKeys].sort();
  const payload = `${regleCode}|${sortedSeances.join(',')}|${objetType}|${objetId}|${sortedSlots.join(',')}`;
  return createHash('sha256').update(payload).digest('hex');
}
