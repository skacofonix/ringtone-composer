<script lang="ts">
  import { canEncode, encodeCompressed } from '../../audio/encoders/compressed';
  import { encodeWav } from '../../audio/encoders/wav';
  import { INSTRUMENTS } from '../../audio/instruments';
  import { EXPORT_SAMPLE_RATE, renderMelody } from '../../audio/render';
  import { melodyDurationMs } from '../../core/melody';
  import { encodeMidi } from '../../core/midi';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';
  import { isApplePlatform } from './platform';
  import { readSetting, writeSetting } from './storage';

  interface Props {
    open: boolean;
    composition: Composition;
  }

  let { open = $bindable(), composition }: Props = $props();

  /** iOS refuses ringtones longer than this. */
  const IPHONE_MAX_SECONDS = 30;

  const t = $derived(i18n.t.export);

  const FORMATS = ['mp3', 'm4r', 'wav'] as const;
  type Format = (typeof FORMATS)[number];
  const MIME_TYPES: Record<Format, string> = {
    mp3: 'audio/mpeg',
    m4r: 'audio/mp4',
    wav: 'audio/wav',
  };
  const FORMAT_SETTING = 'exportFormat';

  function isFormat(value: unknown): value is Format {
    return (FORMATS as readonly unknown[]).includes(value);
  }

  /** Last choice, otherwise M4R on Apple devices and MP3 elsewhere. */
  const saved = readSetting(FORMAT_SETTING);
  let format = $state<Format>(
    isFormat(saved) ? saved : isApplePlatform() ? 'm4r' : 'mp3',
  );
  /** M4R needs the browser's AAC encoder: checked when the dialog opens. */
  let m4rSupported = $state<boolean | null>(null);

  $effect(() => {
    if (!open || m4rSupported !== null) return;
    void canEncode('m4r', EXPORT_SAMPLE_RATE).then((ok) => {
      m4rSupported = ok;
      if (!ok && format === 'm4r') format = 'mp3';
    });
  });

  function chooseFormat(next: Format) {
    format = next;
    writeSetting(FORMAT_SETTING, next);
  }

  let file = $state<File | null>(null);
  let fileUrl = $state<string | null>(null);
  let busy = $state(false);
  let error = $state('');

  const seconds = $derived(melodyDurationMs(composition.melody) / 1000);
  const canShareFile = $derived(
    file !== null && navigator.canShare?.({ files: [file] }) === true,
  );

  function reset() {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    file = null;
    fileUrl = null;
    error = '';
  }

  // A new melody, instrument or format, or opening/closing the dialog,
  // discards the prepared file.
  $effect(() => {
    void composition.melody;
    void composition.instrument;
    void format;
    void open;
    return reset;
  });

  function fileName(name: string, extension: string): string {
    const slug = name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug || t.defaultFileName}.${extension}`;
  }

  async function prepare() {
    busy = true;
    error = '';
    try {
      const samples = await renderMelody(
        composition.melody,
        composition.instrument,
      );
      const bytes =
        format === 'wav'
          ? encodeWav(samples, EXPORT_SAMPLE_RATE)
          : await encodeCompressed(samples, EXPORT_SAMPLE_RATE, format);
      file = new File([bytes], fileName(composition.melody.name, format), {
        type: MIME_TYPES[format],
      });
      fileUrl = URL.createObjectURL(file);
    } catch (e) {
      error = t.failed(e instanceof Error ? e.message : String(e));
    } finally {
      busy = false;
    }
  }

  const midiName = $derived(fileName(composition.melody.name, 'mid'));

  /** The MIDI file is tiny: built and downloaded in one go. */
  function downloadMidi() {
    const bytes = encodeMidi(
      composition.melody,
      INSTRUMENTS[composition.instrument].midiProgram,
    );
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = midiName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function shareFile() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: composition.melody.name });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        error = t.shareFailed;
      }
    }
  }
</script>

<Dialog bind:open title={t.title}>
  <p>
    {t.intro(composition.melody.name, seconds.toFixed(1))}
    {t.instrument(i18n.t.instruments[composition.instrument])}
  </p>

  {#if seconds > IPHONE_MAX_SECONDS}
    <p class="warning">{t.tooLong(IPHONE_MAX_SECONDS)}</p>
  {/if}

  <div class="formats" role="radiogroup" aria-label={t.format}>
    {#each FORMATS as value (value)}
      <button
        type="button"
        role="radio"
        aria-checked={format === value}
        disabled={value === 'm4r' && m4rSupported === false}
        onclick={() => chooseFormat(value)}>{t.formats[value].label}</button
      >
    {/each}
  </div>
  <p class="hint">
    {t.formats[format].hint}
    {#if m4rSupported === false}<br />{t.m4rUnavailable}{/if}
  </p>

  {#if !file}
    <button
      type="button"
      class="primary"
      disabled={busy || composition.melody.notes.length === 0}
      onclick={prepare}
    >
      {busy ? t.creating : t.create}
    </button>
  {:else}
    <div class="actions">
      {#if canShareFile}
        <button type="button" class="primary" onclick={shareFile}
          >{t.shareFile}</button
        >
      {/if}
      <a
        class="button"
        class:primary={!canShareFile}
        href={fileUrl}
        download={file.name}>{t.download(file.name)}</a
      >
    </div>
  {/if}

  {#if error}<p class="warning" role="alert">{error}</p>{/if}

  <details>
    <summary>{t.androidSummary}</summary>
    <ol>
      {#each t.android as step (step)}<li>{step}</li>{/each}
    </ol>
  </details>

  <details>
    <summary>{t.iphoneSummary}</summary>
    <ol>
      {#each t.iphone as step (step)}<li>{step}</li>{/each}
    </ol>
  </details>

  <details>
    <summary>{t.midiSummary}</summary>
    <p class="midi">{t.midiIntro}</p>
    <button type="button" onclick={downloadMidi}
      >{t.midiDownload(midiName)}</button
    >
  </details>
</Dialog>

<style>
  p {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
  }

  .formats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
    padding: 0.2rem;
    border-radius: 0.6rem;
    background: var(--chip);
  }

  .formats button {
    padding: 0.4rem;
    font-weight: 600;
    border: 0;
    border-radius: 0.45rem;
    background: transparent;
    color: var(--muted);
  }

  .formats button[aria-checked='true'] {
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
  }

  .formats button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .hint {
    margin: 0.4rem 0 0.75rem;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .warning {
    color: var(--danger);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  button,
  .button {
    display: block;
    width: 100%;
    padding: 0.65rem;
    font: inherit;
    text-align: center;
    text-decoration: none;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
  }

  .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  details {
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
  }

  .midi {
    margin: 0.4rem 0 0.6rem;
  }

  ol {
    margin: 0.4rem 0 0;
    padding-left: 1.2rem;
  }
</style>
