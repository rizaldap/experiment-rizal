"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// IT symbols for floating background
const IT_SYMBOLS = [
  "{ }",
  "< />",
  "[ ]",
  "( )",
  "&&",
  "||",
  "!=",
  "==",
  "++",
  "--",
  "=>",
  "::",
  "/*",
  "*/",
  "//",
  "##",
  "01",
  "10",
  "<?",
  "?>",
  "<%",
  "%>",
  "${",
  "}$",
];

// Code snippets for decoration
const CODE_SNIPPETS = [
  "experiment.init();",
  "const result = test();",
  "async tryNewThing()",
  "debug.log(output)",
  "return innovation;",
  "{ status: 'beta' }",
];

export default function ExperimentLanding() {
  const [symbols, setSymbols] = useState<
    Array<{
      id: number;
      symbol: string;
      x: number;
      y: number;
      size: number;
      duration: number;
      delay: number;
    }>
  >([]);

  useEffect(() => {
    // Generate floating symbols on client side only
    const generated = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      symbol: IT_SYMBOLS[Math.floor(Math.random() * IT_SYMBOLS.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 24,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
    }));
    setSymbols(generated);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Grid background */}
      <div className="grid-bg absolute inset-0 opacity-50" />

      {/* Animated gradient orbs - white/gray */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="float absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="float-reverse absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="drift absolute left-1/2 top-1/2 h-64 w-64 rounded-full bg-white/[0.03] blur-3xl" />
      </div>

      {/* Floating IT symbols */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {symbols.map((item) => (
          <div
            key={item.id}
            className="absolute select-none font-mono text-white/10"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: `${item.size}px`,
              animation: `float ${item.duration}s ease-in-out infinite`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.symbol}
          </div>
        ))}
      </div>

      {/* Decorative code lines */}
      <div className="fade-in-up absolute left-8 top-1/4 hidden space-y-2 font-mono text-xs text-white/10 lg:block">
        {CODE_SNIPPETS.slice(0, 3).map((code, i) => (
          <div key={i} style={{ animationDelay: `${i * 0.2}s` }}>
            {code}
          </div>
        ))}
      </div>
      <div className="fade-in-up absolute bottom-1/4 right-8 hidden space-y-2 text-right font-mono text-xs text-white/10 lg:block">
        {CODE_SNIPPETS.slice(3).map((code, i) => (
          <div key={i} style={{ animationDelay: `${i * 0.2 + 0.5}s` }}>
            {code}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl text-center">
        {/* Profile Photo */}
        <div className="group relative mx-auto mb-8">
          {/* Outer ring - animated */}
          <div
            className="absolute inset-0 scale-[1.15] rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-[1.25]"
            style={{ animation: "spin-slow 30s linear infinite" }}
          />

          {/* Photo container */}
          <div className="relative mx-auto h-32 w-32">
            <div className="pulse-glow absolute inset-0 overflow-hidden rounded-full border border-white/20 bg-zinc-900 transition-transform duration-500 group-hover:scale-105">
              <Image
                src="/profil.webp"
                alt="Rizaldap"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="fade-in-up mb-2 text-5xl font-light text-white md:text-7xl">
          rizal<span className="font-bold">dap</span>
        </h1>

        {/* Subtitle */}
        <p className="delay-100 fade-in-up mb-4 font-mono text-lg text-zinc-500">
          /experiment
        </p>

        {/* Animated underline */}
        <div className="scale-pulse mx-auto mb-6 h-0.5 w-24 bg-gradient-to-r from-transparent via-white to-transparent" />

        {/* Description */}
        <p className="delay-200 fade-in-up mb-8 text-lg text-zinc-400">
          Personal experiments & creative playground
        </p>

        {/* Beta badge */}
        <div className="delay-300 fade-in-up mb-10 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="blink h-2 w-2 rounded-full bg-green-500" />
            <span className="font-mono text-sm text-zinc-400">
              experiments running
            </span>
          </div>
        </div>

        {/* Info box */}
        <div className="delay-400 fade-in-up rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="mb-4 text-zinc-300">
            🧪 Ini adalah tempat eksperimen pribadi saya.
          </p>
          <p className="text-sm text-zinc-500">
            Berbagai project, ide, dan kreasi yang sedang dalam pengembangan.
            <br />
            <span className="text-zinc-600">
              Beberapa halaman bersifat private.
            </span>
          </p>
        </div>

        {/* Terminal-style text */}
        <div className="delay-500 fade-in-up mt-12 font-mono text-sm text-zinc-600">
          <span className="text-zinc-500">$</span> rizaldap --explore{" "}
          <span className="text-white/60">experiments</span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute left-8 top-8 h-16 w-16 border-l border-t border-white/10" />
      <div className="absolute right-8 top-8 h-16 w-16 border-r border-t border-white/10" />
      <div className="absolute bottom-8 left-8 h-16 w-16 border-b border-l border-white/10" />
      <div className="absolute bottom-8 right-8 h-16 w-16 border-b border-r border-white/10" />

      {/* Footer */}
      <div className="absolute bottom-8 text-center font-mono text-sm text-zinc-600">
        <span className="text-zinc-500">&lt;</span>
        rizaldap.experiment
        <span className="text-zinc-500">/&gt;</span>
      </div>
    </div>
  );
}
