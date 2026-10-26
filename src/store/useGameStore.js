//src/store/useGameStore.js

import { create } from "zustand";

export const SCREENS = Object.freeze({ MENU: "menu", PLAY: "play", PAUSE: "pause", SETTINGS: "settings", COMPLETE: "complete", HIGH_SCORES: "highscores", HOW_TO_PLAY: "howtoplay" });
const SCORE_KEY = "pool-high-scores-v1";
function validScores(value) {
  return Array.isArray(value) ? value.filter((v) => v && typeof v.name === "string" && Number.isFinite(v.score) && v.score >= 0 && typeof v.date === "string").sort((a, b) => b.score - a.score).slice(0, 10) : [];
}
function loadScores() {
  try { return validScores(JSON.parse(localStorage.getItem(SCORE_KEY) || "[]")); }
  catch { return []; }
}
function saveScores(scores) {
  try { localStorage.setItem(SCORE_KEY, JSON.stringify(scores)); } catch { /* Keep scores in memory when storage is unavailable. */ }
}
const useGameStore = create((set) => ({
  highScores: loadScores(),
  infoReturnScreen: SCREENS.MENU,
  openHighScores: () => set((s) => [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen) ? { screen: SCREENS.HIGH_SCORES, infoReturnScreen: s.screen } : {}),
  openHowToPlay: () => set((s) => [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen) ? { screen: SCREENS.HOW_TO_PLAY, infoReturnScreen: s.screen } : {}),
  closeInfo: () => set((s) => [SCREENS.HIGH_SCORES, SCREENS.HOW_TO_PLAY].includes(s.screen) ? { screen: s.infoReturnScreen } : {}),
  screen: SCREENS.MENU,
  settingsReturnScreen: SCREENS.MENU,
  sessionId: 0,
  result: null,
  settings: { showAimGuide: true, showHUD: true },
  startGame: () => set((s) => ({ screen: SCREENS.PLAY, sessionId: s.sessionId + 1, result: null })),
  pauseGame: () => set((s) => s.screen === SCREENS.PLAY ? { screen: SCREENS.PAUSE } : {}),
  resumeGame: () => set((s) => s.screen === SCREENS.PAUSE ? { screen: SCREENS.PLAY } : {}),
  openSettings: () => set((s) => s.screen === SCREENS.SETTINGS ? {} : { screen: SCREENS.SETTINGS, settingsReturnScreen: s.screen === SCREENS.PLAY ? SCREENS.PAUSE : s.screen }),
  closeSettings: () => set((s) => s.screen === SCREENS.SETTINGS ? { screen: s.settingsReturnScreen } : {}),
  returnToMenu: () => set({ screen: SCREENS.MENU, result: null }),
  completeGame: (result = { message: "Rack complete!" }) => set((s) => {
    if (s.screen !== SCREENS.PLAY) return {};
    const finalResult = result || { message: "Rack complete!" };
    let highScores = s.highScores;
    if (Number.isFinite(finalResult.score) && finalResult.score >= 0) {
      const name = typeof finalResult.name === "string" ? finalResult.name.trim().slice(0, 24) || "Player" : "Player";
      highScores = validScores([...highScores, { name, score: finalResult.score, date: new Date().toISOString() }]);
      saveScores(highScores);
    }
    return { screen: SCREENS.COMPLETE, result: finalResult, highScores };
  }),
  setSetting: (key, value) => set((s) => Object.hasOwn(s.settings, key) && typeof value === "boolean" ? { settings: { ...s.settings, [key]: value } } : {}),
}));
export default useGameStore;
