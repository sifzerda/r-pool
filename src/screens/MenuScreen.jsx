// src/screens/MenuScreen.jsx

import { useEffect, useRef } from "react";
import useGameStore from "../store/useGameStore.js";

export default function MenuScreen() {

  const startGame = useGameStore((s) => s.startGame);
  const openScoreboard = useGameStore((s) => s.openScoreboard);
  const openSettings = useGameStore((s) => s.openSettings);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);
  const panel = useRef(null);
  
  useEffect(() => { panel.current?.focus(); }, []);

  return (
    <div className="absolute inset-0 z-10 grid min-h-0 place-items-center p-4 sm:p-5">
      <section ref={panel} tabIndex={-1} aria-label="Pool"
        className="grid max-h-full w-full max-w-90 min-h-0 gap-3.5 overflow-y-auto overscroll-contain rounded-3xl border border-[#285562] bg-[#091820] p-5 font-sans text-cyan-50 outline-none sm:p-7">
        <h1 className="mb-2 text-[28px] font-bold">Pool</h1>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-4.5 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={startGame} >Play</button>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-4.5 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={openScoreboard} >Scoreboard</button>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-4.5 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={openSettings} >Settings</button>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-4.5 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={openHowToPlay} >How to play</button>
      </section>
    </div>
  );
}
