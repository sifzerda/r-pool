// src/lab/labStore.js
// Tiny external store for appearance settings (no extra dependencies).
// Persists to localStorage; useLabParams() re-renders on change.

import { useSyncExternalStore } from "react";
import { DEFAULTS, presetValues } from "./schema";

const STORAGE_KEY = "pool-lab-v1";

function sanitize(obj) {
  const out = {};
  for (const k in DEFAULTS) {
    if (obj && k in obj && typeof obj[k] === typeof DEFAULTS[k]) out[k] = obj[k];
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...sanitize(JSON.parse(raw)) };
  } catch {
    /* storage unavailable or corrupt: fall back to defaults */
  }
  return { ...DEFAULTS };
}

let params = load();
const listeners = new Set();

function commit(next) {
  params = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  for (const l of listeners) l();
}

export const getParams = () => params;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const setParam = (key, value) => commit({ ...params, [key]: value });
export const setParams = (obj) => commit({ ...params, ...sanitize(obj) });
export const resetParams = () => commit({ ...DEFAULTS });
export const applyPreset = (name) => commit(presetValues(name));
export const exportParams = () => JSON.stringify(params, null, 2);

export function importParams(text) {
  try {
    setParams(JSON.parse(text));
    return true;
  } catch {
    return false;
  }
}

export const useLabParams = () => useSyncExternalStore(subscribe, getParams);
