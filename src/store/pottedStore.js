// src/ecs/store/pottedStore.js
// Tiny external store so React (the HUD) re-renders only when a ball is
// potted, never per physics step. Works with useSyncExternalStore.

const potted = new Set();
const listeners = new Set();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

export function markPotted(id) {
  if (potted.has(id)) return;
  potted.add(id);
  emit();
}

export function resetPotted() {
  if (potted.size === 0) return;
  potted.clear();
  emit();
}

export const isPotted = (id) => potted.has(id);

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => version;