// app/home.js

import PoolGame from "../PoolGame.jsx";
import NeonLayout from "../components/NeonLayout.jsx";

export default function HomePage() {
  return (
        <NeonLayout>
      {/* Main Content */}
      <section className="relative z-10 px-6 py-4 flex-1 flex flex-col min-h-0">

        {/* Main Card */}
        <div className="mx-auto relative w-full flex-1 flex flex-col min-h-0 rounded-[36px] border border-cyan-400/15 bg-black/40 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <div className="absolute left-0 top-0 h-1 w-full bg-linear-to-r from-transparent via-cyan-400 to-transparent" />

          <PoolGame />
        </div>

      </section>
 </NeonLayout>
  );
}

