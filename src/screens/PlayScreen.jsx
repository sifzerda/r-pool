// src/screens/PlayScreen.jsx

import { lazy, Suspense } from "react";
import useScreenStore, { SCREEN } from "../store/useScreenStore.js";

// Loaded only after Play, preserving compatibility with browser-only textures.
const PoolGame = lazy(() => import("../PoolGame.jsx"));

export default function PlayScreen() {
  const screen = useScreenStore(state => state.screen);
  const blocked = screen !== SCREEN.PLAY;

  // PoolScreens keeps this mounted through pause, settings and completion.
  // Only starting a new session changes its React key.
  return (
    <div
      inert={blocked}
      aria-hidden={blocked}
      style={{ pointerEvents: blocked ? "none" : "auto" }}
    >
      <Suspense fallback={<p style={{ color: "#c8edf5", padding: 24 }}>Loading table…</p>}>
        <PoolGame />
      </Suspense>
    </div>
  );
}
