/**
 * Share a melody as a link: the RTTTL travels in the URL fragment (`#…`),
 * which is never sent to the server, so no backend is needed.
 */
import type { Melody } from './melody';
import { parseRtttl, serializeRtttl } from './rtttl';

const RTTTL_PARAM = 'rtttl';
const INSTRUMENT_PARAM = 'instrument';

export interface SharedLink {
  readonly melody: Melody;
  /** Instrument id chosen by the sender, unchecked (validated by the UI). */
  readonly instrument: string | null;
}

/** Link to the app at `baseUrl` that opens `melody`, played with `instrument`. */
export function shareUrl(
  melody: Melody,
  baseUrl: string,
  instrument?: string,
): string {
  const url = new URL(baseUrl);
  const params = new URLSearchParams({ [RTTTL_PARAM]: serializeRtttl(melody) });
  if (instrument) params.set(INSTRUMENT_PARAM, instrument);
  url.hash = params.toString();
  return url.toString();
}

/** The content of a shared link, or `null` if there is none or it is invalid. */
export function readSharedLink(href: string): SharedLink | null {
  const params = new URLSearchParams(new URL(href).hash.slice(1));
  const text = params.get(RTTTL_PARAM);
  if (!text) return null;
  try {
    return {
      melody: parseRtttl(text),
      instrument: params.get(INSTRUMENT_PARAM),
    };
  } catch {
    return null;
  }
}
