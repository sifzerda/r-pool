// src/pages/About.js

 

export default function AboutPage() {
    return (

 
             <section className="relative z-10 px-6 py-4 flex-1 flex flex-col min-h-0">
                <div className="mx-auto max-w-7xl">
                    <div className="relative w-full max-w-md overflow-hidden rounded-[36px] border border-fuchsia-400/15 bg-black/40 p-10 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.08)]">
                        <div className="font-mono text-[#39ff14]/80">

                            <div className="text-left py-2 mx-auto inline-block text-xs tracking-[0.2em]">
                                <p className="space-y-1 text-white/90">This is the About page. A game of asteroids made in React, TailwindCSS, using Three-Fiber + post-processing, Miniplex, an ECS structure, and Memoized components.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>
 

    );
}