// src/screens//ScreenPanel.jsx

import { useEffect, useRef } from "react";

const BUTTON = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(34,211,238,.35)", background: "rgba(8,25,38,.9)", color: "#e4faff", font: "600 14px system-ui,sans-serif", cursor: "pointer", touchAction: "manipulation" };
const ACTIONS = { display: "grid", gap: 10, marginTop: 24 };
const SUBTLE = { color: "#a8bdc9", fontSize: 13, lineHeight: 1.6 };

function Button({ children, onClick }) {
  return <button type="button" style={BUTTON} onClick={onClick}>{children}</button>;
}

function Panel({ title, children }) {
  const panel = useRef();

  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  function trapFocus(event) {
    if (event.key !== "Tab") return;
    const elements = Array.from(panel.current.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]'));
    if (!elements.length) {
      event.preventDefault();
      return;
    }
    const first = elements[0], last = elements.at(-1), active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || active === panel.current)) {
      event.preventDefault();
      first.focus();
    }
  }

  return <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,6,14,.78)", backdropFilter: "blur(5px)", overflowY: "auto" }}>
    <section
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      onKeyDown={trapFocus}
      style={{ width: "100%", maxWidth: 460, maxHeight: "100%", overflowY: "auto", padding: 24, borderRadius: 22, border: "1px solid rgba(34,211,238,.3)", background: "linear-gradient(150deg,#102333,#080c13)", color: "#edfaff", boxShadow: "0 20px 80px #0008", outline: "none", fontFamily: "system-ui,sans-serif" }}
    >

      <h1 style={{ fontSize: 27, letterSpacing: 2, margin: "0 0 12px" }}>{title}</h1>
      {children}
    </section>
  </div>;

}

export { Panel as default, Button, ACTIONS, SUBTLE };
