<script lang="ts">
  import { i18n } from '../../i18n/i18n.svelte';
  import Dialog from './Dialog.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  const sections = $derived([
    { title: i18n.t.help.retro, items: i18n.t.retro.help },
    { title: i18n.t.help.modern, items: i18n.t.modern.help },
  ]);
</script>

<Dialog bind:open title={i18n.t.menu.help}>
  {#each sections as section (section.title)}
    <h3>{section.title}</h3>
    <ul>
      {#each section.items as item (item)}
        <!-- `backticks` in the text mark keys. -->
        <li>
          {#each item.split('`') as part, i (i)}{#if i % 2}<kbd>{part}</kbd
              >{:else}{part}{/if}{/each}
        </li>
      {/each}
    </ul>
  {/each}
</Dialog>

<style>
  h3 {
    margin: 0.75rem 0 0.3rem;
    font-size: 0.95rem;
  }

  h3:first-of-type {
    margin-top: 0;
  }

  ul {
    margin: 0;
    padding-left: 1.1rem;
    font-size: 0.9rem;
  }

  kbd {
    padding: 0 0.3rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    font: 0.8rem var(--mono);
  }
</style>
