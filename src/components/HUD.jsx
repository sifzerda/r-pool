// src/components/HUD.js

// Ball tray: coloured ball = still on the table, dark empty slot = potted.

import { memo, useSyncExternalStore } from "react";
import { SOLIDS, STRIPES, EIGHT } from "../ecs/constants/balls";
import { subscribe, getSnapshot, isPotted } from "../store/pottedStore.js";

// Solids (1-7), the 8-ball in the middle, then stripes (9-15), on one line.
const ALL_BALLS = [...SOLIDS, EIGHT, ...STRIPES];

const SIZE = 26;

const styles = {
  wrap: {
    position: "absolute",
    top: 10,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    pointerEvents: "none",
    userSelect: "none",
  },
  tray: {
    display: "flex",
    gap: 5,
    padding: "6px 10px",
    borderRadius: 999,
    background: "linear-gradient(#2a2a2e, #141416)",
    boxShadow: "0 2px 8px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)",
    border: "1px solid #3a3a40",
  },
  slot: {
    position: "relative",
    width: SIZE,
    height: SIZE,
    borderRadius: "50%",
    flex: "none",
  },
  empty: {
    background: "radial-gradient(circle at 50% 60%, #0c0c0e, #1c1c20)",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,.9), 0 1px 0 rgba(255,255,255,.06)",
  },
  gloss: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 32% 26%, rgba(255,255,255,.75) 0, rgba(255,255,255,0) 38%)," +
      "radial-gradient(circle at 60% 75%, rgba(0,0,0,.35) 0, rgba(0,0,0,0) 65%)",
  },
  badge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "56%",
    height: "56%",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "#fff",
    color: "#111",
    font: "700 11px/1 Arial, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

function ballBackground({ type, color }) {
  if (type === "stripe") {
    return `linear-gradient(#fff 0 22%, ${color} 22% 78%, #fff 78%)`;
  }
  return color;
}

const Slot = memo(function Slot({ ball, potted }) {
  if (potted) return <div style={{ ...styles.slot, ...styles.empty }} />;

  return (
    <div
      style={{
        ...styles.slot,
        background: ballBackground(ball),
        boxShadow: "0 2px 3px rgba(0,0,0,.6)",
      }}
    >
      <div style={styles.badge}>{ball.id}</div>
      <div style={styles.gloss} />
    </div>
  );
});

function Tray({ balls }) {
  return (
    <div style={styles.tray}>
      {balls.map((ball) => (
        <Slot key={ball.id} ball={ball} potted={isPotted(ball.id)} />
      ))}
    </div>
  );
}

export default function HUD() {
  // Re-render only when the potted set changes.
  useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div style={styles.wrap}>
      <Tray balls={ALL_BALLS} />
    </div>
  );
}