<script lang="ts">
  import { encodeWav } from '../../audio/encoders/wav';
  import { EXPORT_SAMPLE_RATE, renderMelody } from '../../audio/render';
  import { melodyDurationMs } from '../../core/melody';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';

  interface Props {
    open: boolean;
    composition: Composition;
  }

  let { open = $bindable(), composition }: Props = $props();

  /** iOS refuses ringtones longer than this. */
  const IPHONE_MAX_SECONDS = 30;

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

  // A new melody, or opening/closing the dialog, discards the prepared file.
  $effect(() => {
    void composition.melody;
    void open;
    return reset;
  });

  function fileName(name: string): string {
    const slug = name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug || 'sonnerie'}.wav`;
  }

  async function prepare() {
    busy = true;
    error = '';
    try {
      const samples = await renderMelody(composition.melody);
      const wav = encodeWav(samples, EXPORT_SAMPLE_RATE);
      file = new File([wav], fileName(composition.melody.name), {
        type: 'audio/wav',
      });
      fileUrl = URL.createObjectURL(file);
    } catch (e) {
      error = `Création du fichier impossible : ${e instanceof Error ? e.message : e}`;
    } finally {
      busy = false;
    }
  }

  async function shareFile() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: composition.melody.name });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        error = 'Partage impossible : utilise « Télécharger ».';
      }
    }
  }
</script>

<Dialog bind:open title="Utiliser comme sonnerie">
  <p>
    « {composition.melody.name} » dure {seconds.toFixed(1)} s. Le fichier exporté
    est au format WAV, lisible par Android et par GarageBand sur iPhone.
  </p>

  {#if seconds > IPHONE_MAX_SECONDS}
    <p class="warning">
      Plus de {IPHONE_MAX_SECONDS} s : l'iPhone coupera la sonnerie.
    </p>
  {/if}

  {#if !file}
    <button
      type="button"
      class="primary"
      disabled={busy || composition.melody.notes.length === 0}
      onclick={prepare}
    >
      {busy ? 'Création…' : 'Créer le fichier audio'}
    </button>
  {:else}
    <div class="actions">
      {#if canShareFile}
        <button type="button" class="primary" onclick={shareFile}
          >Partager / Enregistrer…</button
        >
      {/if}
      <a
        class="button"
        class:primary={!canShareFile}
        href={fileUrl}
        download={file.name}>Télécharger {file.name}</a
      >
    </div>
  {/if}

  {#if error}<p class="warning" role="alert">{error}</p>{/if}

  <details>
    <summary>Sur Android</summary>
    <ol>
      <li>Télécharge le fichier.</li>
      <li>Ouvre Paramètres → Sons (et vibrations) → Sonnerie du téléphone.</li>
      <li>
        Choisis « Ajouter » ou « + » (selon le modèle), puis sélectionne le
        fichier dans Téléchargements.
      </li>
    </ol>
  </details>

  <details>
    <summary>Sur iPhone (avec GarageBand, gratuit)</summary>
    <ol>
      <li>« Partager / Enregistrer… » → « Enregistrer dans Fichiers ».</li>
      <li>
        Dans GarageBand, crée un projet « Enregistreur audio », passe en vue
        pistes, touche l'icône des boucles → « Fichiers » et glisse le fichier
        sur la piste.
      </li>
      <li>
        Reviens à « Mes morceaux », appui long sur le projet → Partager →
        Sonnerie → Exporter.
      </li>
      <li>Puis Réglages → Sons et vibrations → Sonnerie.</li>
    </ol>
  </details>
</Dialog>

<style>
  p {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
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

  ol {
    margin: 0.4rem 0 0;
    padding-left: 1.2rem;
  }
</style>
