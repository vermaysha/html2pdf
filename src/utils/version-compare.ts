/**
 * @file src/utils/version-compare.ts
 * @description Utility function to compare version strings.
 */

/**
 * Compares two version strings (e.g., "120.0.6099.71" vs "119.0.2.0").
 * @param a The first version string.
 * @param b The second version string.
 * @returns {number} 1 if a > b, -1 if a < b, 0 if a === b.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}
