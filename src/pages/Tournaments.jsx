export default function Tournaments() {
const tournaments = [
    { name: "City League", players: 32, prize: 500 },
    { name: "Neon Open", players: 24, prize: 1200 },
    { name: "After Dark Cup", players: 16, prize: 2000 },
    { name: "Pro Challenge", players: 8, prize: 5000 },
  ];

  const totalTournaments = tournaments.length;
  const totalPlayers = tournaments.reduce((sum, t) => sum + t.players, 0);
  const totalPrize = tournaments.reduce((sum, t) => sum + t.prize, 0);

  return (
    <main className="relative overflow-hidden bg-[#020308] text-white">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.12),transparent_35%),radial-gradient(circle_at_left,rgba(59,130,246,0.1),transparent_30%)]" />

      {/* Animated Glow Orbs */}
      <div className="absolute left-[-120px] top-10 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse" />
      <div className="absolute right-[-120px] top-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-500/10 blur-[140px] animate-pulse" />
      <div className="absolute bottom-[-120px] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />

      {/* Neon Grid Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] perspective-[1200px]">
        <div className="absolute inset-0 origin-bottom rotate-x-[78deg] bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      {/* Outer Frame */}
      <div className="pointer-events-none absolute inset-4 rounded-[36px] border border-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.08),inset_0_0_60px_rgba(34,211,238,0.04)]" />

      {/* Main Content */}
      <section className="relative z-10 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          {/* Page Title */}
          <h2 className="text-3xl italic text-cyan-100 mb-8 text-center"
            style={{
              fontFamily: "cursive",
              textShadow:
                "0 0 8px rgba(103,232,249,0.8), 0 0 20px rgba(34,211,238,0.8)",
            }}>
            Tournaments
          </h2>

          {/* Neon Stats Bar */}
          <div className="grid gap-4 sm:grid-cols-3 mb-12">
            {[
              ["Tournaments", totalTournaments, "cyan"],
              ["Players", totalPlayers, "fuchsia"],
              ["Prize Pool", `$${totalPrize.toLocaleString()}`, "cyan"],
            ].map(([label, value, color]) => (
              <div key={label}
                className={`rounded-3xl border py-3 p-5 backdrop-blur-md ${
                  color === "cyan"
                    ? "border-cyan-400/15 bg-cyan-500/[0.04]"
                    : "border-fuchsia-400/15 bg-fuchsia-500/[0.04]"
                }`}>
                <p className={`text-[10px] uppercase tracking-[0.35em] ${
                    color === "cyan" ? "text-cyan-500" : "text-fuchsia-400"
                  }`}>
                  {label}
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Tournament Cards */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <div
                key={tournament.name}
                className="relative rounded-3xl border border-cyan-400/15 bg-black/40 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.08)] hover:scale-105 transition-transform">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tournament.name}
                </h3>
                <p className="text-sm text-zinc-400">
                  Players: {tournament.players}
                </p>
                <p className="text-sm text-zinc-400">
                  Prize: ${tournament.prize.toLocaleString()}
                </p>
                {/* Pulsing on hover only */}
                <button className="mt-4 w-full rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:animate-pulse">
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}