// components/Header.js
// header and nav combined

"use client";

import { Link, useLocation } from 'react-router-dom';
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useLocation().pathname;

  const links = [
    { label: "PLAY", href: "/" },
    { label: "ABOUT", href: "/about" },
    { label: "TOURNAMENTS", href: "/tournaments" },
    { label: "SIGNUP", href: "/signup" },
    { label: "LOGIN", href: "/login" },
    { label: "VIP", href: "/vip" },
  ];

  return (
    <header className="relative z-10 px-4 pt-4">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-cyan-400/15 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.08)]">

        {/* Top Light Strip */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

        <div className="relative px-8 py-6 md:px-14">

          {/* Corner accents (UNCHANGED) */}
          <div className="absolute left-6 top-6 h-12 w-12 border-l border-t border-cyan-400/40" />
          <div className="absolute right-6 top-6 h-12 w-12 border-r border-t border-fuchsia-400/40" />
          <div className="absolute bottom-6 left-6 h-12 w-12 border-b border-l border-fuchsia-400/20" />
          <div className="absolute bottom-6 right-6 h-12 w-12 border-b border-r border-cyan-400/20" />

          <div className="flex flex-col items-center gap-5">

            {/* Main Title (UNCHANGED) */}
            <div className="relative text-center">
              <div className="absolute inset-0 bg-cyan-400/20 blur-[80px]" />

              <p className="mb-2 text-[10px] uppercase tracking-[0.9em] text-cyan-400">Open 24/7</p>

              <h1 className="relative text-4xl tracking-[0.25em] text-cyan-100"
                style={{
                  fontFamily: "var(--font-neonderthaw)",
                  textShadow: "0 0 8px rgb(150, 255, 241), 0 0 18px rgba(34,211,238,0.95), 0 0 40px rgba(0, 153, 255, 0.8), 0 0 80px rgba(0, 98, 255, 0.5)",
                }}>
                Eight ◉ Ball
              </h1>

              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-cyan-400" />
                <span className="text-[10px] uppercase tracking-[0.6em] text-fuchsia-300/80">
                  Prisma Neon Lounge
                </span>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-400" />
              </div>
            </div>

            {/* DESKTOP NAV (UNCHANGED) */}
            <nav className="hidden md:flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.35em] text-cyan-500/70">
              {links.map((item) => (
                <Link
                  key={item.label} href={item.href} 
                  className="transition-colors duration-300 hover:text-cyan-300">
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* MOBILE HAMBURGER */}
            <div className="md:hidden w-full flex justify-center">
              <button onClick={() => setOpen(!open)}
                className="group flex flex-col gap-1.5 cursor-pointer">
                <span className="h-[2px] w-7 bg-cyan-300 group-hover:bg-fuchsia-300 transition-colors duration-300" />
                <span className="h-[2px] w-7 bg-cyan-300 group-hover:bg-fuchsia-300 transition-colors duration-300" />
                <span className="h-[2px] w-7 bg-cyan-300 group-hover:bg-fuchsia-300 transition-colors duration-300" />
              </button>
            </div>

            {/* MOBILE MENU */}
            {open && (
              <nav className="md:hidden flex flex-col items-center gap-5 text-xs uppercase tracking-[0.35em] text-cyan-500/70">
                {links.map((item) => (
                  <Link
                    key={item.label} href={item.href} onClick={() => setOpen(false)}
                    className="transition-colors duration-300 hover:text-cyan-300">
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}