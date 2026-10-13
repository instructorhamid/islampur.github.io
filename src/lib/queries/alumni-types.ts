// Shared (client-safe) constants for directory sorting.
export const ALUMNI_SORTS = ["recent", "name", "year_desc", "year_asc"] as const;
export type AlumniSort = (typeof ALUMNI_SORTS)[number];

export const ALUMNI_SORT_LABELS: Record<AlumniSort, string> = {
  recent: "সাম্প্রতিক যুক্ত",
  name: "নাম (বর্ণানুক্রমে)",
  year_desc: "পাসের বছর (নতুন থেকে পুরোনো)",
  year_asc: "পাসের বছর (পুরোনো থেকে নতুন)",
};

export const BATCH_SORTS = ["year_desc", "year_asc", "count"] as const;
export type BatchSort = (typeof BATCH_SORTS)[number];

export const BATCH_SORT_LABELS: Record<BatchSort, string> = {
  year_desc: "নতুন ব্যাচ আগে",
  year_asc: "পুরোনো ব্যাচ আগে",
  count: "সদস্য সংখ্যা অনুযায়ী",
};
