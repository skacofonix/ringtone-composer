/**
 * Undo / redo over immutable states. Consecutive changes of the same group
 * (typing a name, dragging the tempo slider) are merged into one step.
 */

export interface History<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
  /** Group of the last change, merged with the next one of the same group. */
  readonly group: string | null;
}

/** Steps kept in the past; older ones are dropped. */
export const HISTORY_LIMIT = 100;

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [], group: null };
}

/** Records a new state. Clears the redo steps. */
export function record<T>(
  history: History<T>,
  next: T,
  group: string | null = null,
): History<T> {
  if (next === history.present) return history;
  if (group !== null && group === history.group) {
    return { ...history, present: next, future: [] };
  }
  const past = [...history.past, history.present].slice(-HISTORY_LIMIT);
  return { past, present: next, future: [], group };
}

export function undo<T>(history: History<T>): History<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
    group: null,
  };
}

export function redo<T>(history: History<T>): History<T> {
  const [next, ...future] = history.future;
  if (next === undefined) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future,
    group: null,
  };
}

export function canUndo(history: History<unknown>): boolean {
  return history.past.length > 0;
}

export function canRedo(history: History<unknown>): boolean {
  return history.future.length > 0;
}
