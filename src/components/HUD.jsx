// src/components/HUD.js

// Ball tray: coloured ball = still on the table, dark empty slot = potted.

import { memo } from "react";
import { SOLIDS, STRIPES, EIGHT } from "../ecs/constants/balls.js";
import useGameStore from "../store/useGameStore.js";

const ALL_BALLS = [...SOLIDS, EIGHT, ...STRIPES];
const Slot = memo(function Slot({ ball, potted }) {
  const background = ball.type === "stripe"
    ? `linear-gradient(#fff 0 22%,${ball.color} 22% 78%,#fff 78%)`
    : ball.color;

  return (
    <div title={`${ball.id}${potted ? " potted" : " on table"}`}
      style={potted ? undefined : { background }}
      className={`relative flex-none rounded-full w-[clamp(12px,3.7vw,26px)] h-[clamp(12px,3.7vw,26px)] ${potted ? "bg-[radial-gradient(circle,#08080a,#222226)] shadow-[inset_0_2px_4px_#000]" : "shadow-[0_2px_3px_#0009]"
        }`}>
      {!potted && <>
        <div className="absolute left-[22%] top-[22%] w-[56%] h-[56%] rounded-full bg-white text-[#111] grid place-items-center font-bold font-[Arial] text-[clamp(7px,1.8vw,11px)]">{ball.id}</div>
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_26%,#fffb,transparent_38%),radial-gradient(circle_at_60%_75%,#0006,transparent_65%)]" />
      </>}
    </div>
  );
});

const BallTray = memo(function BallTray() {
  const pottedIds = useGameStore((s) => s.pottedIds);
  return <div aria-label={`${pottedIds.size} of 15 balls potted`}
    className="flex gap-[clamp(2px,.6vw,5px)] px-2 py-1.5 rounded-full bg-[linear-gradient(#2a2a2e,#141416)] border border-[#3a3a40] shadow-[0_2px_8px_#0008]">
    {ALL_BALLS.map((ball) => <Slot key={ball.id} ball={ball} potted={pottedIds.has(ball.id)} />)}
  </div>;
});

function ShotStats() {
  const shots = useGameStore((s) => s.stats.shots);
  const potted = useGameStore((s) => s.stats.potted);
  const scratches = useGameStore((s) => s.stats.scratches);
  const bestPots = useGameStore((s) => s.stats.bestPots);
  return <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2.25 py-0.75 rounded-lg bg-[#111b]">
    <span>Shots {shots}</span><span>Potted {potted}/15</span><span>Scratches {scratches}</span>
    {bestPots > 1 && <span>Best {bestPots} in one shot</span>}
  </div>;
}

function ShotMessage() {
  const message = useGameStore((s) => s.stats.message);
  const cleared = useGameStore((s) => s.stats.cleared);

  return <div role="status" aria-live="polite"
    className={`text-center bg-[#111a] rounded-md px-2 py-0.75 ${cleared ? "text-[#9dffbd]" : "text-[#eee]"}`}>
    {message}
  </div>;
}

export default function HUD() {
  const debugShowHand = useGameStore((s) => Boolean(s.debugShowHand));

  function toggleHandDebug() {
    useGameStore.setState((state) => ({
      debugShowHand: !state.debugShowHand,
    }));
  }

  return (

    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-12px)] flex flex-col items-center gap-1.5 pointer-events-none select-none text-[#eee] text-xs font-sans">
      <BallTray />
      <ShotStats />
      <ShotMessage />

      <button
  type="button"
  onClick={toggleHandDebug}
  className={`pointer-events-auto px-3 py-1 rounded-md border text-xs font-bold tracking-wider transition-colors ${
    debugShowHand
      ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
      : "bg-[#111b] border-[#555] text-white hover:bg-[#333]"
  }`}
>
  {debugShowHand ? "HIDE HAND" : "SHOW HAND"}
</button>

    </div>
  )
}
