import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative z-10 px-4 pb-4">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-cyan-400/15 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.08)]">
        {/* Top Light Strip */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

        <div className="relative px-4 py-4 md:px-14">
          {/* Corner accents */}
          <div className="absolute left-6 top-6 h-4 w-8 border-l border-t border-cyan-400/40" />
          <div className="absolute right-6 top-6 h-4 w-8 border-r border-t border-fuchsia-400/40" />
          <div className="absolute bottom-6 left-6 h-4 w-8 border-b border-l border-fuchsia-400/20" />
          <div className="absolute bottom-6 right-6 h-4 w-8 border-b border-r border-cyan-400/20" />

          {/* Neon Glow Background Orbs */}
          <div className="absolute -left-12 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[80px]" />
          <div className="absolute -right-12 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[80px]" />

          {/* Footer Content */}
          <div className="relative flex flex-col items-center gap-2 text-center">
            {/* Brand / Title */}

            {/* Small Footer Info */}
            <p className="text-[10px] text-cyan-100 uppercase tracking-[0.5em]"
              style={{ textShadow: "0 0 8px rgba(103,232,249,0.8), 0 0 20px rgba(34,211,238,0.8)", }}>
              sifzerda || 2026
            </p>

            {/* GitHub Link */}
            <a href="https://github.com/sifzerda/nx-pool" target="_blank" rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 text-cyan-400/70 transition-all duration-300 hover:text-cyan-300 hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              <FaGithub className="h-5 w-5" />
              <span className="text-[10px] uppercase tracking-[0.4em]">GitHub</span>
            </a>

          </div>
        </div>
      </div>
    </footer>
  );
}