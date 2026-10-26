// src/screens/HowToPlayScreen.jsx

import useGameStore from "../store/useGameStore.js";
import ScreenPanel, { buttonStyle } from "./ScreenPanel.jsx";

export default function HowToPlayScreen() {
    const closeInfo = useGameStore((s) => s.closeInfo);

    return (

        <ScreenPanel title="How to play">

            <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.7 }}>

                <li>Choose Play to start a fresh rack.</li>
                <li>Use the cue and aim guide to line up your shot.</li>
                <li>Set your shot power and strike the cue ball.</li>
                <li>Wait for the balls to stop before your next shot.</li>

            </ol>
            <p style={{ margin: 0 }}>Press Escape or select Pause to pause. Choose Resume to continue the same rack.</p>
            <p style={{ margin: 0 }}>Settings lets you toggle the aim guide and HUD. New rack starts over.</p>

            <button style={buttonStyle} onClick={closeInfo}>Back</button>

        </ScreenPanel>

    )
}
