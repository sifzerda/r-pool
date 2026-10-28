// src/screens/HowToPlayScreen.jsx

import { useEffect, useRef } from "react";
import useGameStore from "../store/useGameStore.js";

export default function HowToPlayScreen() {

  const closeInfo = useGameStore((s) => s.closeInfo);
  const panel = useRef(null);

  useEffect(() => { panel.current?.focus(); }, []);

  return (

    <div className="absolute inset-0 z-10 grid min-h-0 place-items-center bg-[#030a11]/85 p-4 sm:p-5">
      <section ref={panel} tabIndex={-1} aria-label="How to play"
        className="grid max-h-full w-full max-w-90 min-h-0 gap-3.5 overflow-y-auto overscroll-contain rounded-3xl border border-[#285562] bg-[#091820] p-5 font-sans text-cyan-50 outline-none sm:p-7">
        <h1 className="mb-2 text-[28px] font-bold">How to play</h1>
        <ol className="list-decimal space-y-1 pl-5.5 leading-relaxed">
          <li>Choose Play to start a fresh rack.</li>
          <li>Use the cue and aim guide to line up your shot.</li>
          <li>Set your shot power and strike the cue ball.</li>
          <li>Wait for the balls to stop before your next shot.</li>
        </ol>
        <p>Press Escape or select Pause to pause. Choose Resume to continue the same rack.</p>
        <p>Settings lets you toggle the aim guide and HUD. New rack starts over.</p>

        <button type="button"
          className="rounded-xl border border-[#3f6470] bg-[#142a33] px-4.5 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={closeInfo}>
          Back</button>

      </section>
    </div>
  );
}
