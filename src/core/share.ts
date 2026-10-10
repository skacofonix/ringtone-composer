/**
 * Share a melody as a link: the RTTTL travels in the URL fragment (`#…`),
 * which is never sent to the server, so no backend is needed.
 */
import type { Melody } from './melody';
import { parseRtttl, serializeRtttl } from './rtttl';

const PARAM = 'rtttl';

/** Link to the app at `baseUrl` that opens `melody`. */
export function shareUrl(melody: Melody, baseUrl: string): string {
  const url = new URL(baseUrl);
  url.hash = new URLSearchParams({
    [PARAM]: serializeRtttl(melody),
  }).toString();
  return url.toString();
}

/** The melody carried by a shared link, or `null` if there is none or it is invalid. */
export function melodyFromUrl(href: string): Melody | null {
  const hash = new URL(href).hash.slice(1);
  const text = new URLSearchParams(hash).get(PARAM);
  if (!text) return null;
  try {
    return parseRtttl(text);
  } catch {
    return null;
  }
}
