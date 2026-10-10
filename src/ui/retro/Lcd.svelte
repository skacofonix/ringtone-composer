<script lang="ts">
  import { LCD_HEIGHT, LCD_WIDTH, type Frame } from './screen';

  interface Props {
    frame: Frame;
    /** Text alternative for screen readers. */
    label: string;
  }

  let { frame, label }: Props = $props();

  /** Lit part of each LCD cell; the rest is the visible pixel grid. */
  const PIXEL_FILL = 0.86;
  /** Opacity of unlit pixels, like on a real LCD. */
  const GHOST_ALPHA = 0.06;

  let canvas = $state<HTMLCanvasElement>();
  /** Canvas size in device pixels, follows the displayed size. */
  let size = $state({ width: LCD_WIDTH * 4, height: LCD_HEIGHT * 4 });

  $effect(() => {
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(entry.contentRect.width * ratio);
      size = { width, height: Math.round((width * LCD_HEIGHT) / LCD_WIDTH) };
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  });

  $effect(() => {
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const { width, height } = size;
    const styles = getComputedStyle(canvas);
    const background = styles.getPropertyValue('--lcd-bg');
    const ink = styles.getPropertyValue('--lcd-ink');
    const cell = width / LCD_WIDTH;
    const pixel = cell * PIXEL_FILL;

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = ink;
    for (let y = 0; y < LCD_HEIGHT; y++) {
      for (let x = 0; x < LCD_WIDTH; x++) {
        context.globalAlpha = frame[y * LCD_WIDTH + x] ? 1 : GHOST_ALPHA;
        context.fillRect(x * cell, y * cell, pixel, pixel);
      }
    }
    context.globalAlpha = 1;
  });
</script>

<div class="lcd" role="img" aria-label={label}>
  <canvas
    bind:this={canvas}
    width={size.width}
    height={size.height}
    aria-hidden="true"
  ></canvas>
</div>

<style>
  /* The glass around the pixel matrix, as on the real screen. */
  .lcd {
    padding: 0.45rem 0.4rem;
    border-radius: 0.25rem;
    background: var(--lcd-bg);
    box-shadow: inset 0 0 0.6rem rgb(0 0 0 / 0.15);
  }

  canvas {
    display: block;
    width: 100%;
    aspect-ratio: 84 / 48;
    background: var(--lcd-bg);
  }
</style>
