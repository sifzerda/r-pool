// src/lab/labStore.js
// Tiny external store for appearance settings (no extra dependencies).
// Persists to localStorage; useLabParams() re-renders on change.

// Preset-only appearance store. The selected name persists across reloads.
import { useSyncExternalStore } from "react";
import { DEFAULT_PRESET, PRESET_NAMES, isPreset, presetValues } from "./schema.js";

const STORAGE_KEY = "pool-appearance-preset-v1";
const LEGACY_KEY = "pool-lab-v1";
function loadPreset() {
  try {
    const selected = localStorage.getItem(STORAGE_KEY);
    if (isPreset(selected)) return selected;
    // Preserve an old preset only if every saved appearance value matches it.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (legacy && typeof legacy === "object") {
      for (const name of PRESET_NAMES) {
        const values = presetValues(name);
        if (Object.keys(values).every((key) => legacy[key] === values[key])) return name;
      }
    }
  } catch { /* Use the default if storage is unavailable or corrupt. */ }
  return DEFAULT_PRESET;
}
let selectedPreset = loadPreset();
let params = Object.freeze(presetValues(selectedPreset));
const serverParams = Object.freeze(presetValues(DEFAULT_PRESET));
const listeners = new Set();
export const getParams = () => params;
export const getPreset = () => selectedPreset;
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function applyPreset(name) {
  if (!isPreset(name)) return false;
  if (name === selectedPreset) return true;
  selectedPreset = name;
  params = Object.freeze(presetValues(name));
  try { localStorage.setItem(STORAGE_KEY, name); } catch { /* Keep the choice in memory. */ }
  for (const listener of listeners) listener();
  return true;
}
export const useLabParams = () => useSyncExternalStore(subscribe, getParams, () => serverParams);
export const useAppearancePreset = () => useSyncExternalStore(subscribe, getPreset, () => DEFAULT_PRESET);
