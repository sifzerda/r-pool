// app/home.js

import PoolGame from "../PoolGame.jsx";

 
export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-[#020308] text-white">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.12),transparent_35%),radial-gradient(circle_at_left,rgba(59,130,246,0.1),transparent_30%)]" />

      {/* Animated Glow Orbs */}
      <div className="absolute -left-30 top-10 h-105 w-105 rounded-full bg-cyan-500/10 blur-[140px] animate-pulse" />
      <div className="absolute -right-30 top-1/3 h-95 w-95 rounded-full bg-fuchsia-500/10 blur-[140px] animate-pulse" />
      <div className="absolute -bottom-30 left-1/2 h-75 w-75 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />

      {/* Neon Grid Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] perspective-distant">
        <div className="absolute inset-0 origin-bottom rotate-x-78 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-size-[70px_70px]" />
      </div>

      {/* Outer Frame */}
      <div className="pointer-events-none absolute inset-4 rounded-[36px] border border-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.08),inset_0_0_60px_rgba(34,211,238,0.04)]" />

      {/* Main Content */}
      <section className="relative z-10 px-6 py-4">

        {/* Main Card */}
        <div className="mx-auto relative w-full max-w-3xl overflow-hidden rounded-[36px] border border-cyan-400/15 bg-black/40 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <div className="absolute left-0 top-0 h-1 w-full bg-linear-to-r from-transparent via-cyan-400 to-transparent" />

           <PoolGame />         
        </div>

      </section>
    </main>
  );
}

