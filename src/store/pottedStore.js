// src/store/pottedStore.js
// external store so HUD re-renders only when a ball is
// potted. Works with useSyncExternalStore.

const potted = /* @__PURE__ */ new Set();
const listeners = /* @__PURE__ */ new Set();

let version = 0;

const initial = () => ({ shots: 0, scratches: 0, potted: 0, shotPots: 0, lastPots: 0, bestPots: 0, shotActive: false, cleared: false, message: "Aim \u2022 drag backwards \u2022 release to shoot" });

let stats = Object.freeze(initial());

function emit(patch) {
  stats = Object.freeze({ ...stats, ...patch });
  version++;
  for (const listener of listeners) listener();
}

function markPotted(id) {
  if (!Number.isInteger(id) || id < 1 || id > 15 || potted.has(id)) return;
  potted.add(id);
  emit({ potted: potted.size, shotPots: stats.shotPots + 1 });
}

function recordShot() {
  emit({ shots: stats.shots + 1, shotPots: 0, shotActive: true, message: "Shot in play\u2026" });
}

function recordScratch() {
  emit({ scratches: stats.scratches + 1, message: "Scratch \u2022 cue ball returns when the table settles" });
}

function finishShot() {
  if (!stats.shotActive) return;
  const cleared = potted.size === 15;
  const pots = stats.shotPots;
  emit({
    shotActive: false,
    lastPots: pots,
    bestPots: Math.max(stats.bestPots, pots),
    cleared,
    message: cleared ? "Table cleared! Rack again for another round." : pots > 1 ? `${pots} balls in one shot!` : pots === 1 ? "Nice pot!" : "Line up your next shot"
  });
}

function resetPotted() {
  potted.clear();
  stats = Object.freeze(initial());
  version++;
  for (const listener of listeners) listener();
}

const isPotted = (id) => potted.has(id);
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => version;
const getServerSnapshot = () => 0;
const getStats = () => stats;

export {
  finishShot,
  getServerSnapshot,
  getSnapshot,
  getStats,
  isPotted,
  markPotted,
  recordScratch,
  recordShot,
  resetPotted,
  subscribe
};
