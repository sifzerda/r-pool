
// src/components/HUD.js

// Ball tray: Player (left) vs AI (right), with the 8-ball slot in the centre.
// Slots start empty and fill with balls as they are potted.

import { memo } from "react";
import { BALLS, SOLIDS, STRIPES, EIGHT } from "../ecs/constants/balls.js";
import useGameStore from "../store/useGameStore.js";

const BALL_BY_ID = new Map(BALLS.map((b) => [b.id, b]));
const GROUP_IDS = {
  solids: SOLIDS.map((b) => b.id),
  stripes: STRIPES.map((b) => b.id),
};
const SOLO_IDS = [...GROUP_IDS.solids, ...GROUP_IDS.stripes];
const LABEL_CLASS = "text-[clamp(8px,1.9vw,11px)] font-bold tracking-wider uppercase";

const Slot = memo(function Slot({ ball }) {
  if (!ball) {
    return (
      <div className="flex-none rounded-full w-[clamp(12px,3.7vw,26px)] h-[clamp(12px,3.7vw,26px)] bg-[radial-gradient(circle,#08080a,#222226)] shadow-[inset_0_2px_4px_#000]" />
    );
  }

  const background = ball.type === "stripe"
    ? `linear-gradient(#fff 0 22%,${ball.color} 22% 78%,#fff 78%)`
    : ball.color;

  return (
    <div
      title={`${ball.id}`}
      style={{ background }}
      className="relative flex-none rounded-full w-[clamp(12px,3.7vw,26px)] h-[clamp(12px,3.7vw,26px)] shadow-[0_2px_3px_#0009]"
    >
      <div className="absolute left-[22%] top-[22%] w-[56%] h-[56%] rounded-full bg-white text-[#111] grid place-items-center font-bold font-[Arial] text-[clamp(7px,1.8vw,11px)]">
        {ball.id}
      </div>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_26%,#fffb,transparent_38%),radial-gradient(circle_at_60%_75%,#0006,transparent_65%)]" />
    </div>
  );
});

const TraySide = memo(function TraySide({ label, groupName, ids, count, pottedIds, active }) {
  const filled = ids ? [...pottedIds].filter((id) => ids.includes(id)) : [];
  const slots = Array.from(
    { length: count },
    (_, i) => filled[i] !== undefined ? BALL_BY_ID.get(filled[i]) : null
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${LABEL_CLASS} ${active ? "text-[#9dffbd]" : "text-[#aaa]"}`}>
        {label}
        {groupName && <span className="ml-1 font-normal opacity-80">· {groupName}</span>}
      </div>
      <div className="flex gap-[clamp(2px,.6vw,5px)]">
        {slots.map((ball, i) => <Slot key={i} ball={ball} />)}
      </div>
    </div>
  );
});

const EightBallSlot = memo(function EightBallSlot({ potted }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${LABEL_CLASS} text-[#aaa]`}>Eight Ball</div>
      <Slot ball={potted ? EIGHT : null} />
    </div>
  );
});

const BallTray = memo(function BallTray() {
  const pottedIds = useGameStore((s) => s.pottedIds);
  const playerGroups = useGameStore((s) => s.playerGroups);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const solo = useGameStore((s) => Boolean(s.settings.solo));
  const eightPotted = pottedIds.has(8);

  const frame = "flex items-center gap-[clamp(8px,2vw,16px)] px-3 py-1.5 rounded-2xl bg-[linear-gradient(#2a2a2e,#141416)] border border-[#3a3a40] shadow-[0_2px_8px_#0008]";

  if (solo) {
    return (
      <div aria-label={`${pottedIds.size} of 15 balls potted`} className={frame}>
        <TraySide label="Player" ids={SOLO_IDS} count={14} pottedIds={pottedIds} active />
        <EightBallSlot potted={eightPotted} />
      </div>
    );
  }

  const groupLabel = (g) => (
    g ? (g === "solids" ? "Solids" : "Stripes") : null
  );

  return (
    <div aria-label={`${pottedIds.size} of 15 balls potted`} className={frame}>
      <TraySide
        label="Player"
        groupName={groupLabel(playerGroups.human)}
        ids={playerGroups.human ? GROUP_IDS[playerGroups.human] : null}
        count={7}
        pottedIds={pottedIds}
        active={currentPlayer === "human"}
      />

      <EightBallSlot potted={eightPotted} />

      <TraySide
        label="AI"
        groupName={groupLabel(playerGroups.ai)}
        ids={playerGroups.ai ? GROUP_IDS[playerGroups.ai] : null}
        count={7}
        pottedIds={pottedIds}
        active={currentPlayer === "ai"}
      />
    </div>
  );
});

function DifficultyIndicator() {
  const difficulty = useGameStore((s) => s.difficulty || "medium");
  const solo = useGameStore((s) => Boolean(s.settings.solo));

  if (solo) return null;

  const colors = {
    easy: "text-[#9dffbd] border-[#9dffbd]/30",
    medium: "text-cyan-300 border-cyan-400/30",
    hard: "text-fuchsia-300 border-fuchsia-400/30",
  };

  const color = colors[difficulty] || colors.medium;

  return (
    <div className={`flex items-center gap-2 rounded-lg border bg-[#111d] px-3 py-1 ${color}`}>
      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
        AI Difficulty
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {difficulty}
      </span>
    </div>
  );
}

function ShotStats() {
  const shots = useGameStore((s) => s.stats.shots);
  const potted = useGameStore((s) => s.stats.potted);
  const scratches = useGameStore((s) => s.stats.scratches);
  const bestPots = useGameStore((s) => s.stats.bestPots);

  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2.25 py-0.75 rounded-lg bg-[#111b]">
      <span>Shots {shots}</span>
      <span>Potted {potted}/15</span>
      <span>Scratches {scratches}</span>
      {bestPots > 1 && <span>Best {bestPots} in one shot</span>}
    </div>
  );
}

function ShotMessage() {
  const message = useGameStore((s) => s.stats.message);
  const cleared = useGameStore((s) => s.stats.cleared);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`text-center bg-[#111a] rounded-md px-2 py-0.75 ${cleared ? "text-[#9dffbd]" : "text-[#eee]"}`}
    >
      {message}
    </div>
  );
}

export default function HUD() {
  return (
    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-12px)] flex flex-col items-center gap-1.5 pointer-events-none select-none text-[#eee] text-xs font-sans">
      <BallTray />
      <DifficultyIndicator />
      <ShotStats />
      <ShotMessage />
    </div>
  );
}
