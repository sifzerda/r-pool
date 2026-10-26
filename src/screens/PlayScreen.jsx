// src/screens/PlayScreen.jsx

import HUD from "../components/HUD.jsx";
import useGameStore from "../store/useGameStore.js";

export default function PlayScreen() {
  const showHUD = useGameStore((s) => s.settings.showHUD);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const startGame = useGameStore((s) => s.startGame);

  return (
    <>
      {showHUD && <HUD />}
      <div className="absolute bottom-3 right-3 flex flex-wrap gap-2">
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-[18px] py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={pauseGame} >Pause</button>
        <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-[18px] py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={startGame} >New rack</button>
      </div>
    </>
  );
}
