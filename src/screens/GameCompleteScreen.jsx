// src/screens/GameCompleteScreen.jsx

import { useEffect, useRef } from "react";
import useGameStore from "../store/useGameStore.js";

export default function GameCompleteScreen() {

  const result = useGameStore((s) => s.result);
  const startGame = useGameStore((s) => s.startGame);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);
  const openScoreboard = useGameStore((s) => s.openScoreboard);
  const panel = useRef(null);

  useEffect(() => { panel.current?.focus(); }, []);

  return (

    <div className="absolute inset-0 z-10 grid min-h-0 place-items-center bg-[#030a11]/85 p-4 sm:p-5">
      <section ref={panel} tabIndex={-1} aria-label="Game complete"
        className="grid max-h-full w-full max-w-[360px] min-h-0 gap-3.5 overflow-y-auto overscroll-contain rounded-3xl border border-[#285562] bg-[#091820] p-5 font-sans text-cyan-50 outline-none sm:p-7">
        <h1 className="mb-2 text-[28px] font-bold">Game complete</h1>
        <p role="status">{result?.message || "Rack complete!"}</p>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-[18px] py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={startGame} >Play again</button>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-[18px] py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={openScoreboard} >Scoreboard</button>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-[18px] py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={openHowToPlay} >How to play</button>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-[18px] py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={returnToMenu} >Main menu</button>
      </section>
    </div>
    
  );
}
