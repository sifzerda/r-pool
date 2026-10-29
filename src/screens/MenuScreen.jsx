// src/screens/MenuScreen.jsx

import { useEffect, useRef } from "react";
import useGameStore from "../store/useGameStore.js";

export default function MenuScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const openScoreboard = useGameStore((s) => s.openScoreboard);
  const openSettings = useGameStore((s) => s.openSettings);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);

  const panel = useRef(null);

  useEffect(() => {
    panel.current?.focus();
  }, []);

  const buttons = [
    { label: "PLAY", action: startGame },
    { label: "SCOREBOARD", action: openScoreboard },
    { label: "SETTINGS", action: openSettings },
    { label: "HOW TO PLAY", action: openHowToPlay },
  ];

  return (
    <div className="absolute inset-0 z-10 grid min-h-0 place-items-center p-4 sm:p-5">

      <section ref={panel} tabIndex={-1} aria-label="Pool menu" className="relative grid max-h-full w-full max-w-90 min-h-0
          gap-3 overflow-y-auto overscroll-contain
          rounded-lg  backdrop-blur-2xl
          p-6 sm:p-8
          font-sans text-cyan-50
          shadow-[0_0_50px_rgba(15,35,100,0.2)]
          outline-none">

        {/* Heading */}
        <div className="relative mb-3 text-center">

          <div className="pointer-events-none absolute inset-0 bg-blue-400/10 blur-[45px]" />

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-linear-to-r from-transparent to-cyan-400" />
            <span className="text-[16px] uppercase tracking-[0.5em] text-blue-300">
              Main Menu
            </span>
            <div className="h-px w-10 bg-linear-to-l from-transparent to-cyan-400" />
          </div>
        </div>

        {/* Menu buttons */}
        <div className="relative grid gap-3">
          {buttons.map((button, index) => (
            <button
              key={button.label}
              type="button"
              onClick={button.action}
              className="
                group relative overflow-hidden
                rounded-md border border-cyan-400/20
                bg-[#091a32]/80
                px-4 py-3
                text-xs font-semibold uppercase tracking-[0.35em]
                text-cyan-100
                transition-all duration-300
                hover:border-cyan-300/70
                hover:bg-[#102b48]
                hover:text-cyan-200
                hover:shadow-[0_0_18px_rgba(34,211,238,0.18)]
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-cyan-300
                cursor-pointer touch-manipulation">
             
              {/* Hover light */}
              <span className="pointer-events-none absolute inset-0
                bg-linear-to-r from-transparent via-cyan-300/5 to-transparent
                opacity-0 transition-opacity duration-300
                group-hover:opacity-100" />

              <span className="relative flex items-center justify-center gap-3">
                {button.label}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-center">
            <div className="h-px w-30 bg-linear-to-r from-transparent to-cyan-400" />
            <div className="h-px w-30 bg-linear-to-l from-transparent to-cyan-400" />
        </div>

      </section>
    </div>
  );
}
