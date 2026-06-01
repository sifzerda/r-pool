export default function Vip() {
   const vipPerks = [
        { title: "Exclusive Cues", description: "Access legendary pool cues.", color: "cyan" },
        { title: "VIP Lounge", description: "Private rooms with neon ambiance.", color: "fuchsia" },
        { title: "Special Tournaments", description: "Compete in VIP-only events.", color: "cyan" },
        { title: "Double Rewards", description: "Earn double credits per win.", color: "fuchsia" },
    ];

    const totalVIPs = 124;
    const activePerks = vipPerks.length;
    const exclusiveRewards = 8;

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
                    <h2
                        className="text-5xl italic text-cyan-100 mb-8 text-center"
                        style={{
                            fontFamily: "cursive",
                            textShadow:
                                "0 0 8px rgba(103,232,249,0.8), 0 0 20px rgba(34,211,238,0.8)",
                        }}>
                        VIP Lounge
                    </h2>

                    {/* Neon Stats Bar */}
                    <div className="grid gap-4 sm:grid-cols-3 mb-12">
                        {[
                            ["Total VIPs", totalVIPs, "cyan"],
                            ["Active Perks", activePerks, "fuchsia"],
                            ["Exclusive Rewards", exclusiveRewards, "cyan"],
                        ].map(([label, value, color]) => (
                            <div
                                key={label}
                                className={`rounded-3xl border p-5 backdrop-blur-md ${color === "cyan"
                                    ? "border-cyan-400/15 bg-cyan-500/[0.04]"
                                    : "border-fuchsia-400/15 bg-fuchsia-500/[0.04]"
                                    }`}>
                                <p
                                    className={`text-[10px] uppercase tracking-[0.35em] ${color === "cyan" ? "text-cyan-500" : "text-fuchsia-400"
                                        }`}>
                                    {label}
                                </p>
                                <p className="mt-3 text-3xl font-bold text-white">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* VIP Perks Cards */}
                    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 relative">
                        {vipPerks.map((perk) => (
                            <div
                                key={perk.title}
                                className={`relative rounded-3xl border ${perk.color === "cyan" ? "border-cyan-400/15 bg-black/40" : "border-fuchsia-400/15 bg-black/40"
                                    } p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.08)] hover:scale-105 transition-transform`}>
                                {/* Floating Neon Badge */}
                                <div
                                    className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full ${perk.color === "cyan" ? "bg-cyan-400/20 border-cyan-400" : "bg-fuchsia-400/20 border-fuchsia-400"
                                        } border shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-[float_3s_ease-in-out_infinite] flex items-center justify-center`}>
                                    <span className="text-sm font-bold text-white">VIP</span>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2">{perk.title}</h3>
                                <p className="text-sm text-zinc-400 mb-4">{perk.description}</p>
                                <button className={`mt-4 w-full rounded-2xl border px-4 py-2 text-sm font-bold text-white transition ${perk.color === "cyan"
                                    ? "border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 hover:animate-neon-pulse"
                                    : "border-fuchsia-400/30 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 hover:animate-neon-pulse"
                                    }`}>
                                    Join VIP
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Floating animation keyframes */}
            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
      `}</style>
        </main>
    );
}