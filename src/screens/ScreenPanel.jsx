// src/screens//ScreenPanel.jsx

import { useEffect, useRef } from "react";
export const buttonStyle = { padding: "10px 18px", borderRadius: 12, border: "1px solid #3f6470", background: "#142a33", color: "#ecfeff", cursor: "pointer", font: "600 14px system-ui" };

export default function ScreenPanel({ title, children }) {

  const panel = useRef(null);
  useEffect(() => { panel.current?.focus(); }, []);
  return (

    <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "grid", placeItems: "center", background: "rgba(3,10,17,.86)", padding: 20 }}>

      <section ref={panel} tabIndex={-1} aria-label={title} style={{ width: "min(360px,100%)", display: "grid", gap: 14, maxHeight: "100%", overflowY: "auto", boxSizing: "border-box", padding: 28, borderRadius: 24, border: "1px solid #285562", background: "#091820", color: "#ecfeff", fontFamily: "system-ui" }}>

        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>{title}</h1>{children}

      </section>
    </div>

  )
}
