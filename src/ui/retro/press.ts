/**
 * Svelte attachment for phone keys: distinguishes a short press from a long
 * press (held for LONG_PRESS_MS), like on the 3310. Each press vibrates
 * (when enabled), a little more for a long press.
 */
import type { Attachment } from 'svelte/attachments';
import { haptics } from '../shared/haptics.svelte';

export const LONG_PRESS_MS = 500;

export function pressable(
  onpress: (long: boolean) => void,
): Attachment<HTMLElement> {
  return (node) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cancel = () => {
      clearTimeout(timer);
      timer = undefined;
    };

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      cancel();
      // Felt as soon as the finger lands, like a physical key.
      haptics.play('tap');
      timer = setTimeout(() => {
        timer = undefined;
        haptics.play('long');
        onpress(true);
      }, LONG_PRESS_MS);
    };

    // Released before the delay: short press.
    const up = () => {
      if (timer === undefined) return;
      cancel();
      onpress(false);
    };

    // Keyboard activation (Enter/Space on a focused key) has no pointer events.
    const click = (event: MouseEvent) => {
      if (event.detail === 0) onpress(false);
    };

    // Avoid the long-press context menu on mobile.
    const contextmenu = (event: Event) => event.preventDefault();

    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', cancel);
    node.addEventListener('click', click);
    node.addEventListener('contextmenu', contextmenu);

    return () => {
      cancel();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
      node.removeEventListener('click', click);
      node.removeEventListener('contextmenu', contextmenu);
    };
  };
}
