// src/screens/PlayScreen.jsx

import HUD from "../components/HUD.jsx";
import useGameStore from "../store/useGameStore.js";
import { buttonStyle } from "./ScreenPanel.jsx";

export default function PlayScreen({ labOpen, onToggleLab }) {

    const showHUD = useGameStore((s) => s.settings.showHUD);
    const pauseGame = useGameStore((s) => s.pauseGame);
    const startGame = useGameStore((s) => s.startGame);

    return (
        <>

            {showHUD && <HUD />}

            <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button style={buttonStyle} onClick={pauseGame}>Pause</button>
                <button style={buttonStyle} onClick={startGame}>New rack</button>
                <button style={buttonStyle} onClick={onToggleLab} aria-expanded={labOpen}>Lab</button>
            </div>
        </>
    )

}
