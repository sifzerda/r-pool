// src/components/NeonLayout.jsx

export default function NeonPageLayout({ children, className = "" }) {
  return (
    <div className={`relative min-h-screen bg-[#010b16] text-white ${className}`}>

      {/* Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,170,255,0.38),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(0,65,150,0.45),transparent_45%),radial-gradient(circle_at_left,rgba(0,135,210,0.28),transparent_35%)]" />

      {/* Animated Glow Orbs */}
      <div className="absolute -left-20 top-10 h-120 w-120 rounded-full bg-cyan-500/35 blur-[100px] animate-pulse" />
      <div className="absolute -left-20 top-10 h-120 w-120 rounded-full bg-sky-400/25 blur-[60px] animate-pulse" />

      <div className="absolute -right-20 top-1/3 h-105 w-105 rounded-full bg-blue-600/35 blur-[100px] animate-pulse" />
      <div className="absolute -right-20 top-1/3 h-60 w-60 rounded-full bg-cyan-600/25 blur-[55px] animate-pulse" />

      <div className="absolute -bottom-20 left-1/2 h-90 w-20 -translate-x-1/2 rounded-full bg-cyan-500/30 blur-[90px] animate-pulse" />

      {/* Neon Grid Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] perspective-distant">
        <div className="absolute inset-0 origin-bottom rotate-x-78 bg-[linear-gradient(rgba(20,170,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(20,170,255,0.25)_1px,transparent_1px)] bg-size-[70px_70px]" />
      </div>

      {/* Outer Frame */}
      <div className="pointer-events-none absolute inset-4 rounded-[36px] border border-cyan-400/40 shadow-[0_0_60px_rgba(20,170,255,0.2),inset_0_0_80px_rgba(20,170,255,0.1)]" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}