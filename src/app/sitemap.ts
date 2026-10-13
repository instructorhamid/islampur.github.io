import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { listBatches } from "@/lib/queries/alumni";

export const dynamic = "force-dynamic";

// Individual alumni profiles are intentionally excluded (they are marked noindex for privacy).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = ["", "/event", "/register", "/alumni", "/batches", "/sponsors", "/privacy"].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  let batches: { passing_year: number }[] = [];
  try {
    batches = await listBatches();
  } catch (err) {
    console.error("sitemap: could not load batches", err);
  }
  return [
    ...staticPages,
    ...batches.map((b) => ({ url: `${site.url}/batches/${b.passing_year}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
