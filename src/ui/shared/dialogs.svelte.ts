/**
 * Which app dialog is open. Shared so that both the bottom bar and the
 * retro phone menu can open them.
 */
export const dialogs = $state({
  catalog: false,
  share: false,
  export: false,
  more: false,
});
