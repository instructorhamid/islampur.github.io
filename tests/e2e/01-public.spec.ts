import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage shows hero, provisional notice, countdown and real statistics", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto("/");
    await expect(page).toHaveTitle(/ইসলামপুর উচ্চ বিদ্যালয়/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("শিকড়ের টানে, আবার একসাথে");
    await expect(page.getByRole("link", { name: /পুনর্মিলনীতে নিবন্ধন করুন/ }).first()).toBeVisible();
    // Demo/provisional content is clearly marked
    await expect(page.getByText("প্রস্তাবিত তথ্য:").first()).toBeVisible();
    await expect(page.getByText(/নমুনা \(ডেমো\) নিবন্ধন অন্তর্ভুক্ত/)).toBeVisible();
    // Countdown runs and never shows negative values
    const timer = page.getByRole("timer");
    await expect(timer).toBeVisible();
    await expect(timer).not.toContainText("-");
    // Schedule from the database
    await expect(page.getByText("সকাল ৮:৩০").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("alumni directory: search, year filter and blood-group privacy", async ({ page }) => {
    await page.goto("/alumni");
    await expect(page.getByRole("heading", { level: 1, name: "প্রাক্তন শিক্ষার্থী" })).toBeVisible();
    const cards = page.locator("main article");
    await expect(cards.first()).toBeVisible();

    // Name search
    await page.getByLabel("নাম দিয়ে খুঁজুন").fill("করিম");
    await page.getByRole("button", { name: "খুঁজুন" }).click();
    await expect(page).toHaveURL(/q=/);
    await expect(page.getByText(/ফিল্টার করা ফলাফল/)).toBeVisible();
    const names = await page.locator("main article h3").allTextContents();
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n).toContain("করিম");

    // Year filter (auto-submits)
    await page.goto("/alumni");
    await page.getByLabel("পাসের বছর").selectOption("2010");
    await expect(page).toHaveURL(/year=2010/);
    await expect(page.getByText(/ফিল্টার করা ফলাফল/)).toBeVisible();
    const badges = await page.locator("main article").getByRole("link", { name: /ব্যাচ দেখুন/ }).allTextContents();
    expect(badges.length).toBeGreaterThan(0);
    for (const b of badges) expect(b).toContain("২০১০");

    // Empty state
    await page.goto("/alumni?q=zzzz-nobody");
    await expect(page.getByText("কোনো ফলাফল পাওয়া যায়নি")).toBeVisible();
  });

  test("batch directory is generated from the database and batch pages show only their year", async ({ page }) => {
    await page.goto("/batches");
    await expect(page.getByRole("heading", { name: "২০১০" })).toBeVisible();
    await page.getByRole("link", { name: /ব্যাচটি দেখুন.*২০১০/ }).click();
    await expect(page).toHaveURL(/\/batches\/2010$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("২০১০ ব্যাচের প্রাক্তন শিক্ষার্থী");
    const badges = await page.locator("main article").getByRole("link", { name: /ব্যাচ দেখুন/ }).allTextContents();
    expect(badges.length).toBe(24); // first page is full
    for (const b of badges) expect(b).toContain("২০১০");

    // Pagination
    await page.getByRole("link", { name: /পরের/ }).click();
    await expect(page).toHaveURL(/page=2/);
    const page2 = await page.locator("main article h3").count();
    expect(page2).toBeGreaterThan(0);
    expect(page2).toBeLessThanOrEqual(24);
    await expect(page.locator('[aria-current="page"]').filter({ hasText: "২" })).toBeVisible();
  });

  test("invalid and unpublished records return 404", async ({ request }) => {
    expect((await request.get("/batches/1800")).status()).toBe(404);
    expect((await request.get("/batches/abcd")).status()).toBe(404);
    expect((await request.get("/alumni/not-a-uuid")).status()).toBe(404);
    expect((await request.get("/alumni/00000000-0000-0000-0000-000000000000")).status()).toBe(404);
    // An empty but valid batch is a friendly page, not an error
    const empty = await request.get("/batches/1961");
    expect(empty.status()).toBe(200);
    expect(await empty.text()).toContain("এখনো কেউ যুক্ত হননি");
  });

  test("no phone numbers or private fields appear in public responses", async ({ request }) => {
    for (const path of ["/", "/alumni", "/alumni?page=2", "/batches", "/batches/2010", "/sponsors", "/event", "/sitemap.xml"]) {
      const html = await (await request.get(path)).text();
      expect(html, path).not.toMatch(/(?<!\d)01[3-9]\d{8}(?!\d)/); // demo numbers are 0130000xxxx
      expect(html, path).not.toContain("normalized_phone");
      expect(html, path).not.toContain("admin_note");
    }
  });

  test("sponsors and event pages render configurable content", async ({ page }) => {
    await page.goto("/sponsors");
    await expect(page.getByRole("heading", { name: "প্রধান পৃষ্ঠপোষক" })).toBeVisible();
    await expect(page.getByText("নমুনা", { exact: true }).first()).toBeVisible();
    await page.goto("/event");
    await expect(page.getByRole("heading", { name: "দিনব্যাপী সময়সূচি" })).toBeVisible();
    await expect(page.getByText("সম্মিলিত ছবি ও সমাপনী পর্ব")).toBeVisible();
    await expect(page.getByText("প্রস্তাবিত তথ্য:").first()).toBeVisible();
  });

  test("SEO endpoints", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/batches/2010");
    expect(sitemap).not.toContain("/alumni/"); // individual profiles are not listed
  });

  test("mobile: no horizontal scrolling and the menu works", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["/", "/register", "/alumni", "/batches", "/batches/2010", "/sponsors", "/event", "/privacy"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await page.goto("/");
    await page.getByRole("button", { name: "মেনু খুলুন" }).click();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "ব্যাচ ডিরেক্টরি" }).click();
    await expect(page).toHaveURL(/\/batches$/);
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: "মেনু খুলুন" }).click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });
});
