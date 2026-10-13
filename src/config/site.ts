// Central school identity and static content.
// Event details, schedule, FAQs, announcements, contacts and sponsors live in the database
// and are edited from /admin. Only identity and evergreen copy live here.

export const school = {
  nameBn: "ইসলামপুর উচ্চ বিদ্যালয়",
  nameEn: "Islampur High School",
  locationBn: "ছাতক, সুনামগঞ্জ, সিলেট",
  locationEn: "Chhatak, Sunamganj, Sylhet, Bangladesh",
  schoolCode: "2713",
  eiin: "129817",
  /**
   * Path to an official logo in /public (e.g. "/images/logo.png").
   * Leave null to use the typographic placeholder mark — do not invent an official logo.
   */
  logoPath: null as string | null,
  /**
   * Optional real photograph of the school for the homepage hero (e.g. "/images/school.jpg").
   * Leave null to show the illustrated landscape.
   */
  heroImage: null as { src: string; alt: string } | null,
};

export const site = {
  name: `${school.nameBn} প্রাক্তন শিক্ষার্থী পুনর্মিলনী`,
  shortName: "ইসলামপুর পুনর্মিলনী",
  description:
    "ইসলামপুর উচ্চ বিদ্যালয়, ছাতক, সুনামগঞ্জের প্রাক্তন শিক্ষার্থী পুনর্মিলনী — নিবন্ধন, ব্যাচ ডিরেক্টরি, অনুষ্ঠানসূচি ও হালনাগাদ তথ্য।",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
};

export const mainNav = [
  { href: "/", label: "হোম" },
  { href: "/#about", label: "পুনর্মিলনী সম্পর্কে" },
  { href: "/register", label: "নিবন্ধন" },
  { href: "/alumni", label: "প্রাক্তন শিক্ষার্থী" },
  { href: "/batches", label: "ব্যাচ ডিরেক্টরি" },
  { href: "/sponsors", label: "স্পনসর" },
  { href: "/event", label: "ইভেন্ট" },
] as const;

export const heroCopy = {
  headline: "শিকড়ের টানে, আবার একসাথে",
  text: "স্মৃতির আঙিনায় ফিরে চলুন। প্রিয় বিদ্যালয়, পুরোনো বন্ধু আর হারানো দিনের গল্পে মিলিত হই ইসলামপুর উচ্চ বিদ্যালয়ের পুনর্মিলনীতে।",
  primaryCta: "পুনর্মিলনীতে নিবন্ধন করুন",
  secondaryCta: "প্রাক্তন শিক্ষার্থীদের দেখুন",
};

export const aboutCopy = {
  title: "পুনর্মিলনী সম্পর্কে",
  paragraphs: [
    "সুরমার তীরে ছাতকের সবুজ প্রকৃতির মাঝে ইসলামপুর উচ্চ বিদ্যালয় প্রজন্মের পর প্রজন্ম শিক্ষার্থীকে গড়ে তুলেছে। সেই আঙিনা থেকে বেরিয়ে আমরা আজ ছড়িয়ে আছি দেশ-বিদেশের নানা প্রান্তে।",
    "এই পুনর্মিলনী সব ব্যাচের প্রাক্তন শিক্ষার্থীদের আবার এক ছাদের নিচে আনার একটি উদ্যোগ — পুরোনো বন্ধুদের খুঁজে পাওয়া, শ্রদ্ধেয় শিক্ষকদের সান্নিধ্য, আর প্রিয় বিদ্যালয়ের জন্য কিছু করার অঙ্গীকার নিয়ে।",
  ],
  pillars: [
    { title: "স্মৃতির টানে", text: "ক্লাসরুম, মাঠ আর টিফিনের ঘণ্টার গল্পগুলো আবার একসাথে মনে করা।" },
    { title: "বন্ধুত্বের বন্ধন", text: "হারিয়ে যাওয়া সহপাঠীদের খুঁজে পাওয়া ও নতুন করে যোগাযোগ।" },
    { title: "বিদ্যালয়ের পাশে", text: "প্রিয় প্রতিষ্ঠানের উন্নয়নে প্রাক্তনদের সম্মিলিত ভূমিকা।" },
  ],
};

export const highlights = [
  { icon: "users", title: "সব ব্যাচের মিলনমেলা", text: "পুরোনো ও নতুন সব ব্যাচের প্রাক্তন শিক্ষার্থীদের একসাথে দেখা হওয়ার সুযোগ।" },
  { icon: "award", title: "শিক্ষক সম্মাননা", text: "যাঁদের হাত ধরে আমাদের পথচলা, সেই শ্রদ্ধেয় শিক্ষকদের প্রতি কৃতজ্ঞতা।" },
  { icon: "music", title: "সাংস্কৃতিক আয়োজন", text: "গান, কবিতা আর স্মৃতিচারণে ভরা প্রাণবন্ত বিকেল।" },
  { icon: "camera", title: "ব্যাচভিত্তিক ছবি", text: "নিজের ব্যাচের বন্ধুদের সঙ্গে স্মরণীয় মুহূর্ত ধরে রাখা।" },
  { icon: "utensils", title: "মধ্যাহ্নভোজ ও আড্ডা", text: "দুপুরের খাবারের সঙ্গে পুরোনো দিনের গল্প।" },
  { icon: "heart", title: "বিদ্যালয়ের জন্য উদ্যোগ", text: "প্রিয় বিদ্যালয়ের উন্নয়নে প্রাক্তনদের সম্মিলিত পরিকল্পনা।" },
] as const;
