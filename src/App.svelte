<script lang="ts">
  import ModernComposer from './ui/modern/ModernComposer.svelte';
  import { Composition } from './ui/shared/composition.svelte';

  const composition = new Composition();
</script>

<main>
  <h1>RingtoneComposer</h1>
  <ModernComposer {composition} />
</main>

<style>
  main {
    max-width: 40rem;
    margin: 0 auto;
    padding: 1rem 1rem 2rem;
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: 1.4rem;
  }
</style>
