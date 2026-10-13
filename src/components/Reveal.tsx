"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Subtle fade-up when the element scrolls into view. Content is visible without JS and with reduced motion. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "ready" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // already on screen: don't hide it
    setState("ready");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = state === "idle" ? "" : state === "ready" ? "reveal-ready" : "reveal-ready reveal-in";
  return (
    <div ref={ref} className={`${cls} ${className}`} style={delay && state !== "idle" ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
