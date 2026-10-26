// src/screens/SettingsScreen.jsx

import { useEffect, useRef } from "react";
import { PRESET_NAMES } from "../lab/schema.js";
import { applyPreset, useAppearancePreset } from "../lab/labStore.js";
import useGameStore from "../store/useGameStore.js";

import PreviewTable from "../renderers/PreviewRenderer.jsx";

export default function SettingsScreen() {

    const settings = useGameStore((s) => s.settings);
    const setSetting = useGameStore((s) => s.setSetting);
    const closeSettings = useGameStore((s) => s.closeSettings);
    const selectedPreset = useAppearancePreset();
    const panel = useRef(null);

    useEffect(() => { panel.current?.focus(); }, []);

    return (
        <div className="absolute inset-0 z-10 grid min-h-0 place-items-center bg-[#030a11]/85 p-4 sm:p-5">
            <section ref={panel} tabIndex={-1} aria-label="Settings"
                className="grid max-h-full w-full max-w-[360px] min-h-0 gap-3.5 overflow-y-auto overscroll-contain rounded-3xl border border-[#285562] bg-[#091820] p-5 font-sans text-cyan-50 outline-none sm:p-7">
                <h1 className="mb-2 text-[28px] font-bold">Settings</h1>

                <div className="h-[300px] w-full overflow-hidden rounded-2xl border border-cyan-400/20">
                    <PreviewTable />
                </div>

                <label className="grid gap-2 text-sm font-semibold">
                    Appearance preset
                    <select value={selectedPreset} onChange={(event) => applyPreset(event.target.value)}
                        className="w-full cursor-pointer rounded-xl border border-[#285562] bg-[#142a33] px-3 py-3 text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                        {PRESET_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                </label>
                <p className="text-sm text-slate-300">Choose a complete look for the table, cue, balls and lighting.</p>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#285562] p-3">
                    <input type="checkbox" className="h-4 w-4 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
                        checked={settings.showAimGuide} onChange={(event) => setSetting("showAimGuide", event.target.checked)} />
                    Show aim guide
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#285562] p-3">
                    <input type="checkbox" className="h-4 w-4 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
                        checked={settings.showHUD} onChange={(event) => setSetting("showHUD", event.target.checked)} />
                    Show HUD
                </label>
                <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-[18px] py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={closeSettings} >Back</button>
            </section>
        </div>
    );
}
