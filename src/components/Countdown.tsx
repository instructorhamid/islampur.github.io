"use client";

import { useEffect, useState } from "react";
import { toBn } from "@/lib/bn";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diff(target: number): Parts | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

const LABELS: [keyof Parts, string][] = [
  ["days", "দিন"],
  ["hours", "ঘণ্টা"],
  ["minutes", "মিনিট"],
  ["seconds", "সেকেন্ড"],
];

/**
 * Live countdown to the event. Never shows negative values: once the start time passes it
 * switches to an "event day" / "event held" message. Renders a stable placeholder on the
 * server to avoid hydration mismatches.
 */
export function Countdown({ target, tone = "light" }: { target: string; tone?: "light" | "dark" }) {
  const targetMs = new Date(target).getTime();
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    setParts(diff(targetMs));
    const id = window.setInterval(() => setParts(diff(targetMs)), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const dark = tone === "dark";
  if (parts === null) {
    const sameDay = Date.now() - targetMs < 12 * 3_600_000;
    return (
      <p className={`rounded-xl px-4 py-3 font-display text-lg font-semibold ${dark ? "bg-white/10 text-white" : "bg-green-light text-green-deep"}`}>
        {sameDay ? "পুনর্মিলনী চলছে — সবাইকে স্বাগতম!" : "পুনর্মিলনী অনুষ্ঠিত হয়েছে। অংশগ্রহণের জন্য সবাইকে ধন্যবাদ।"}
      </p>
    );
  }

  return (
    <div role="timer" aria-live="off" aria-label="পুনর্মিলনী শুরু হতে বাকি সময়" className="grid grid-cols-4 gap-2 sm:gap-3">
      {LABELS.map(([key, label]) => (
        <div
          key={key}
          className={`rounded-xl px-1 py-2.5 text-center sm:py-3 ${dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-white text-ink ring-1 ring-line shadow-sm"}`}
        >
          <span className="block font-display text-2xl font-bold tabular-nums sm:text-3xl">
            {parts === undefined ? "–" : (
              <span key={parts[key]} className={key === "seconds" ? "tick" : undefined}>
                {toBn(String(parts[key]).padStart(2, "0"))}
              </span>
            )}
          </span>
          <span className={`block text-xs sm:text-sm ${dark ? "text-white/75" : "text-muted"}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}
