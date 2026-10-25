// src/PoolGame.jsx

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { setupGame } from "./ecs/setupGame.js";
import { clearWorld } from "./ecs/world.js";
import { TABLE_W, TABLE_H } from "./ecs/constants/table.js";
import PoolScene from "./PoolScene.jsx";
import HUD from "../src/components/HUD.jsx";
import LabPanel from "./lab/LabPanel";

const BUTTON = { padding: "7px 12px", borderRadius: 999, border: "1px solid #50505b", background: "rgba(22,22,26,.9)", color: "#e8e8ee", font: "600 12px system-ui,sans-serif", cursor: "pointer", touchAction: "manipulation" };
const POSITION = [0, 10, 0], ROTATION = [-Math.PI / 2, 0, 0];

function FittedCamera() {
  const camera = useRef();
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    if (!camera.current) return;
    camera.current.zoom = Math.max(1, Math.min(80, (size.width - 24) / (TABLE_W + 0.8), (size.height - 120) / (TABLE_H + 0.8)));
    camera.current.updateProjectionMatrix();
    invalidate();
  }, [size.width, size.height, invalidate]);

  return <OrthographicCamera ref={camera} makeDefault position={POSITION} rotation={ROTATION} zoom={80} />;
}

function PoolGame() {
  const [session, setSession] = useState(null);
  const [labOpen, setLabOpen] = useState(false);
  const nextSession = useRef(0);
  const restart = useCallback(() => setSession({ cueBall: setupGame(), key: ++nextSession.current }), []);

  useEffect(() => {
    restart();
    return clearWorld;
  }, [restart]);

  return <div style={{ width: "100%", height: 560, display: "flex", position: "relative", minWidth: 0 }}>
    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
    
      <Canvas shadows dpr={[1, 1.5]} frameloop="demand" gl={{ powerPreference: "high-performance" }}>
        <FittedCamera />
        {session && <PoolScene key={session.key} cueBall={session.cueBall} />}
      </Canvas>

      <HUD />
      
      <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 }}>
        <button type="button" style={BUTTON} onClick={restart} title="Start a fresh rack">New rack</button>
        <button type="button" style={BUTTON} onClick={() => setLabOpen((open) => !open)} aria-expanded={labOpen}>Lab</button>
      </div>
    </div>
    {labOpen && <div style={{ position: "absolute", top: 0, right: 0, bottom: 52, maxWidth: "100%", overflow: "auto", zIndex: 5 }}><LabPanel onClose={() => setLabOpen(false)} /></div>}
  </div>;
}

export {
  PoolGame as default
};
