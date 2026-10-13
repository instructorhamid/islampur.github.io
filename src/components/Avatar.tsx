/** Profile photo, or initials on a green tile when there is no public photo. */
export function Avatar({
  name,
  src,
  className = "",
  size = "card",
}: {
  name: string;
  src: string | null;
  className?: string;
  size?: "card" | "large" | "small";
}) {
  const initials = initialsOf(name);
  if (src) {
    return (
      // Photos are pre-resized WebP served by /media; next/image is not needed here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name}-এর প্রোফাইল ছবি`}
        loading={size === "large" ? "eager" : "lazy"}
        decoding="async"
        width={size === "large" ? 480 : 240}
        height={size === "large" ? 480 : 240}
        className={`aspect-square w-full bg-green-light object-cover ${className}`}
      />
    );
  }
  const text = size === "small" ? "text-lg" : size === "large" ? "text-6xl" : "text-4xl";
  return (
    <div
      role="img"
      aria-label={`${name} (ছবি প্রকাশিত নয়)`}
      className={`grid aspect-square w-full place-items-center bg-gradient-to-br from-green-light to-green-soft font-display font-bold text-green-deep ${text} ${className}`}
    >
      <span aria-hidden="true">{initials}</span>
    </div>
  );
}

export function initialsOf(name: string): string {
  // Skip common honorific/prefix words so "মোহাম্মদ রফিক" → "র"
  const skip = new Set(["মোহাম্মদ", "মোঃ", "মো.", "মোছাঃ", "md", "md.", "mohammad", "muhammad"]);
  const words = name.split(/\s+/).filter(Boolean);
  const meaningful = words.filter((w) => !skip.has(w.toLowerCase()));
  const first = (meaningful[0] ?? words[0] ?? "?");
  // Take the first grapheme cluster so Bengali vowel signs stay attached.
  const seg = new Intl.Segmenter("bn", { granularity: "grapheme" });
  const g = seg.segment(first)[Symbol.iterator]().next().value?.segment ?? "?";
  return g.toUpperCase();
}
