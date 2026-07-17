export function ageInYears(birthDate: Date, at: Date = new Date()): number {
  const ms = at.getTime() - birthDate.getTime();
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

export function roomMatchesAge(
  room: { minAgeYears: number | null; maxAgeYears: number | null },
  ageYears: number,
): boolean {
  if (room.minAgeYears == null && room.maxAgeYears == null) return true;
  const minOk = room.minAgeYears == null || ageYears >= room.minAgeYears;
  const maxOk = room.maxAgeYears == null || ageYears < room.maxAgeYears;
  return minOk && maxOk;
}

export function formatAgeLabel(min?: number | null, max?: number | null) {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min} a ${max} anos`;
  if (min != null) return `a partir de ${min} anos`;
  return `até ${max} anos`;
}
