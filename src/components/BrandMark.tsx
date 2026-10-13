import Image from "next/image";
import { school } from "@/config/site";

/**
 * Typographic placeholder identity. Replace by setting `school.logoPath` in src/config/site.ts
 * once an official logo is supplied — no official logo is invented here.
 */
export function BrandMark({ size = 44, inverted = false }: { size?: number; inverted?: boolean }) {
  if (school.logoPath) {
    return <Image src={school.logoPath} alt={`${school.nameBn} লোগো`} width={size} height={size} className="rounded-full" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="18" fill={inverted ? "#ffffff" : "var(--green)"} />
      <path d="M6 47c9-7 17-9 26-6.5S48 42 58 35v15a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8z" fill={inverted ? "var(--green-light)" : "var(--green-deep)"} />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="30"
        fontWeight="700"
        fill={inverted ? "var(--green-deep)" : "#ffffff"}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        ই
      </text>
    </svg>
  );
}
