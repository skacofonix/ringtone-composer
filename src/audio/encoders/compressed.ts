/**
 * Compressed ringtone formats, through Mediabunny (MPL-2.0), loaded on demand
 * so that the app does not carry the encoders until an export asks for them.
 *
 * - MP3: the browser's encoder if any, otherwise a WASM encoder
 *   (@mediabunny/mp3-encoder): works everywhere.
 * - M4R: AAC in an MP4 container, the iPhone ringtone format. Needs the
 *   browser's AAC encoder (WebCodecs): Chrome, Edge, Safari; not Firefox.
 */

export type CompressedFormat = 'mp3' | 'm4r';

let mp3EncoderRegistered = false;

/** Whether this browser can produce the format. */
export async function canEncode(
  format: CompressedFormat,
  sampleRate: number,
): Promise<boolean> {
  if (format === 'mp3') return true; // The WASM encoder is always there.
  try {
    const { canEncodeAudio } = await import('mediabunny');
    return await canEncodeAudio('aac', { numberOfChannels: 1, sampleRate });
  } catch {
    return false;
  }
}

/** Encodes mono samples in [-1, 1] as an MP3 or M4R file. */
export async function encodeCompressed(
  samples: Float32Array,
  sampleRate: number,
  format: CompressedFormat,
): Promise<Uint8Array<ArrayBuffer>> {
  const mb = await import('mediabunny');

  if (
    format === 'mp3' &&
    !mp3EncoderRegistered &&
    !(await mb.canEncodeAudio('mp3'))
  ) {
    const { registerMp3Encoder } = await import('@mediabunny/mp3-encoder');
    registerMp3Encoder();
    mp3EncoderRegistered = true;
  }

  const buffer = new AudioBuffer({
    length: samples.length,
    numberOfChannels: 1,
    sampleRate,
  });
  buffer.copyToChannel(new Float32Array(samples), 0);

  const output = new mb.Output({
    format:
      format === 'mp3'
        ? new mb.Mp3OutputFormat()
        : // Index at the start of the file, as most players expect.
          new mb.Mp4OutputFormat({ fastStart: 'in-memory' }),
    target: new mb.BufferTarget(),
  });
  const source = new mb.AudioBufferSource({
    codec: format === 'mp3' ? 'mp3' : 'aac',
    // Medium is plenty for a mono ringtone (high gives ~320 kbit/s MP3).
    quality: mb.QUALITY_MEDIUM,
  });
  output.addAudioTrack(source);
  await output.start();
  await source.add(buffer);
  source.close();
  await output.finalize();

  const result = output.target.buffer;
  if (!result) throw new Error(`No ${format} data produced`);
  const bytes = new Uint8Array(result);
  if (format === 'm4r') setMajorBrand(bytes, 'M4A ');
  return bytes;
}

/**
 * Apple audio files (.m4a, .m4r) declare the "M4A " brand in their `ftyp`
 * box; Mediabunny writes "isom". The major brand is informative only, so it
 * is rewritten in place for the best compatibility with iTunes and Finder.
 */
export function setMajorBrand(bytes: Uint8Array, brand: string): void {
  const ascii = (offset: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (bytes.length < 12 || ascii(4) !== 'ftyp') return;
  for (let i = 0; i < 4; i++) bytes[8 + i] = brand.charCodeAt(i);
}
