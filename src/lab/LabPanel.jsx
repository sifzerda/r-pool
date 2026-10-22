// src/lab/LabPanel.jsx
// Docked appearance editor. The UI is generated from schema.js.

import { useState } from "react";
import { Color, SRGBColorSpace } from "three";
import { GROUPS, PRESETS, presetValues } from "./schema";
import {
  useLabParams, setParam, setParams, applyPreset, resetParams,
  exportParams, importParams,
} from "./labStore";

const S = {
  panel: {
    width: 290,
    flex: "none",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#16161a",
    color: "#e8e8ee",
    borderLeft: "1px solid #2b2b33",
    font: "12px/1.3 system-ui, sans-serif",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px 6px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  close: { background: "none", border: 0, color: "#9a9aa6", fontSize: 18, cursor: "pointer" },
  chips: { display: "flex", flexWrap: "wrap", gap: 5, padding: "0 12px 8px" },
  chip: (on) => ({
    padding: "3px 9px",
    borderRadius: 999,
    border: `1px solid ${on ? "#7fd6ff" : "#34343e"}`,
    background: on ? "#1d3340" : "#1e1e24",
    color: on ? "#bfe9ff" : "#c4c4cf",
    cursor: "pointer",
    fontSize: 11,
  }),
  tabs: { display: "flex", borderBottom: "1px solid #2b2b33", padding: "0 6px" },
  tab: (on) => ({
    flex: 1,
    padding: "8px 0",
    background: "none",
    border: 0,
    borderBottom: `2px solid ${on ? "#7fd6ff" : "transparent"}`,
    color: on ? "#fff" : "#8d8d99",
    cursor: "pointer",
    fontWeight: 600,
  }),
  body: { flex: 1, overflowY: "auto", padding: "8px 12px" },
  row: { marginBottom: 10 },
  rowTop: { display: "flex", justifyContent: "space-between", marginBottom: 2, color: "#b5b5c0" },
  val: { color: "#7fd6ff", fontVariantNumeric: "tabular-nums" },
  range: { width: "100%", accentColor: "#7fd6ff", margin: 0 },
  colorRow: { display: "flex", alignItems: "center", gap: 8 },
  swatch: { width: 34, height: 22, padding: 0, border: "1px solid #3a3a45", borderRadius: 4, background: "none", cursor: "pointer" },
  hex: { color: "#8d8d99", fontFamily: "ui-monospace, monospace", fontSize: 11 },
  foot: { display: "flex", gap: 6, padding: 10, borderTop: "1px solid #2b2b33" },
  btn: {
    flex: 1,
    padding: "6px 0",
    borderRadius: 6,
    border: "1px solid #34343e",
    background: "#1e1e24",
    color: "#e8e8ee",
    cursor: "pointer",
    fontSize: 11,
  },
};

const sameAs = (params, name) => {
  const v = presetValues(name);
  return Object.keys(v).every((k) => params[k] === v[k]);
};

const hsl = (h, s, l) =>
  `#${new Color().setHSL(h, s, l, SRGBColorSpace).getHexString(SRGBColorSpace)}`;

function randomise() {
  const rnd = Math.random;
  setParams({
    "table.felt": hsl(rnd(), 0.55 + rnd() * 0.3, 0.18 + rnd() * 0.12),
    "table.rail": hsl(rnd(), 0.35 + rnd() * 0.4, 0.14 + rnd() * 0.18),
    "table.frame": hsl(rnd(), 0.3, 0.07),
    "table.trim": hsl(rnd(), 0.7, 0.5),
    "table.diamond": hsl(rnd(), 0.9, 0.65),
    "stick.shaft": hsl(rnd(), 0.5, 0.45),
    "stick.accent": hsl(rnd(), 0.9, 0.55),
    "stick.butt": hsl(rnd(), 0.4, 0.1),
    "scene.bg": hsl(rnd(), 0.4, 0.06),
    "scene.accent": hsl(rnd(), 1, 0.6),
    "scene.accentGlow": rnd() * 4,
    "ball.saturation": 0.8 + rnd() * 0.7,
  });
}

function Control({ ctl, value }) {
  if (ctl.type === "color") {
    return (
      <div style={S.row}>
        <div style={S.colorRow}>
          <input
            type="color"
            style={S.swatch}
            value={value}
            onChange={(e) => setParam(ctl.key, e.target.value)}
          />
          <span style={{ flex: 1, color: "#b5b5c0" }}>{ctl.label}</span>
          <span style={S.hex}>{value}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={S.row}>
      <div style={S.rowTop}>
        <span>{ctl.label}</span>
        <span style={S.val}>{Number(value).toFixed(2)}</span>
      </div>
      <input
        type="range"
        style={S.range}
        min={ctl.min}
        max={ctl.max}
        step={ctl.step}
        value={value}
        onChange={(e) => setParam(ctl.key, parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function LabPanel({ onClose }) {
  const params = useLabParams();
  const [tab, setTab] = useState(GROUPS[0].id);
  const [note, setNote] = useState("");

  const group = GROUPS.find((g) => g.id === tab);

  function flash(text) {
    setNote(text);
    setTimeout(() => setNote(""), 1400);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportParams());
      flash("Copied!");
    } catch {
      window.prompt("Copy your settings:", exportParams());
    }
  }

  function paste() {
    const text = window.prompt("Paste settings JSON:");
    if (text) flash(importParams(text) ? "Imported" : "Invalid JSON");
  }

  return (
    <aside style={S.panel}>
      <div style={S.head}>
        <span>Appearance Lab</span>
        <button style={S.close} onClick={onClose} aria-label="Close lab">×</button>
      </div>

      <div style={S.chips}>
        {Object.keys(PRESETS).map((name) => (
          <button key={name} style={S.chip(sameAs(params, name))} onClick={() => applyPreset(name)}>
            {name}
          </button>
        ))}
      </div>

      <div style={S.tabs}>
        {GROUPS.map((g) => (
          <button key={g.id} style={S.tab(g.id === tab)} onClick={() => setTab(g.id)}>
            {g.label}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {group.controls.map((ctl) => (
          <Control key={ctl.key} ctl={ctl} value={params[ctl.key]} />
        ))}
      </div>

      <div style={S.foot}>
        <button style={S.btn} onClick={resetParams}>Reset</button>
        <button style={S.btn} onClick={randomise}>Randomise</button>
        <button style={S.btn} onClick={copy}>{note || "Copy"}</button>
        <button style={S.btn} onClick={paste}>Import</button>
      </div>
    </aside>
  );
}
