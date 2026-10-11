/** Small platform conventions the interface follows. */

/**
 * Apple systems show "share" as a box with an arrow; Android and Windows as
 * three connected dots. Users recognize their own system's icon.
 */
export function isApplePlatform(
  userAgent = globalThis.navigator?.userAgent ?? '',
): boolean {
  return /iPhone|iPad|iPod|Macintosh/.test(userAgent);
}
