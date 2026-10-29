// app/home.js

import PoolGame from "../PoolGame.jsx";

export default function HomePage() {
  return (
   
   <section className="relative z-10 flex flex-1 min-h-0 items-center justify-center">
      <div className="relative w-[min(100%,900px)] h-125 shrink-0">
        <PoolGame />
      </div>
    </section>
  );
}