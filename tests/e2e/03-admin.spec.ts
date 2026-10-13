import { expect, test, type Page } from "@playwright/test";
import { ADMIN, MODERATOR } from "./env";

const NEW_NAME = "পরীক্ষা নিবন্ধনকারী"; // registered in 02-registration.spec.ts

async function login(page: Page, who: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("ইমেইল").fill(who.email);
  await page.getByLabel("পাসওয়ার্ড").fill(who.password);
  await page.getByRole("button", { name: "প্রবেশ করুন" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("admin access control", () => {
  test("anonymous visitors are redirected away from every admin page and export", async ({ page, request }) => {
    for (const path of ["/admin", "/admin/registrations", "/admin/settings", "/admin/event", "/admin/users"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/admin\/login$/);
    }
    const res = await request.get("/admin/export", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(res.status());
    // A forged cookie is not a session
    const forged = await request.get("/admin/export", { headers: { cookie: "ihs_admin_session=forged-token" }, maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(forged.status());
  });

  test("wrong credentials are rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("ইমেইল").fill(ADMIN.email);
    await page.getByLabel("পাসওয়ার্ড").fill("not-the-password");
    await page.getByRole("button", { name: "প্রবেশ করুন" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "ইমেইল বা পাসওয়ার্ড সঠিক নয়" })).toBeVisible();
  });

  test("moderators cannot open admin-only settings or export data", async ({ page }) => {
    await login(page, MODERATOR);
    await expect(page.getByRole("link", { name: "সেটিংস ও গোপনীয়তা" })).toHaveCount(0);
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\?error=forbidden/);
    await expect(page.getByRole("alert").filter({ hasText: "শুধু প্রধান অ্যাডমিনের জন্য" })).toBeVisible();
    const res = await page.request.get("/admin/export");
    expect(res.status()).toBe(403);
  });
});

test.describe("admin workflows", () => {
  test.beforeEach(async ({ page }) => login(page, ADMIN));

  test("dashboard shows real counts", async ({ page }) => {
    await expect(page.getByRole("link", { name: /অপেক্ষমাণ/ }).first()).toBeVisible();
    await expect(page.getByText(/নমুনা \(ডেমো\)/)).toBeVisible();
  });

  test("admin pages fit on a phone screen", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["/admin", "/admin/registrations", "/admin/event", "/admin/content", "/admin/sponsors", "/admin/settings", "/admin/batches"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("approving a registration publishes it in the directory and its batch", async ({ page, request }) => {
    await page.goto(`/admin/registrations?status=pending&q=${encodeURIComponent(NEW_NAME)}`);
    const row = page.locator("li", { hasText: NEW_NAME });
    await row.getByRole("button", { name: "অনুমোদন" }).click();
    await expect(page.getByRole("status").filter({ hasText: "অনুমোদিত করা হয়েছে" })).toBeVisible();

    // Public directory, batch directory and batch page
    await page.goto(`/alumni?q=${encodeURIComponent(NEW_NAME)}`);
    const card = page.locator("main article", { hasText: NEW_NAME });
    await expect(card).toBeVisible();
    await expect(card.getByRole("link", { name: /২০০৫/ })).toBeVisible();
    // Blood group was not consented → not shown
    await expect(card.getByText("AB+")).toHaveCount(0);
    // Photo was consented → served publicly
    const src = await card.locator("img").getAttribute("src");
    expect(src).toMatch(/^\/media\/alumni\/[0-9a-f-]+\/thumb/);
    const img = await request.get(src!);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toBe("image/webp");

    await page.goto("/batches");
    await expect(page.getByRole("heading", { name: "২০০৫" })).toBeVisible();
    await page.goto("/batches/2005");
    await expect(page.locator("main article", { hasText: NEW_NAME })).toBeVisible();
    const other = await page.locator("main article").getByRole("link", { name: /ব্যাচ দেখুন/ }).allTextContents();
    for (const b of other) expect(b).toContain("২০০৫");

    // Profile page
    await page.locator("main article", { hasText: NEW_NAME }).getByRole("link", { name: NEW_NAME }).click();
    await expect(page.getByRole("heading", { level: 1, name: NEW_NAME })).toBeVisible();
    const html = await page.content();
    expect(html).not.toContain("01811000222");
    expect(html).toContain('name="robots" content="noindex, follow"');
  });

  test("removing a photo hides it publicly at once", async ({ page, request }) => {
    await page.goto(`/admin/registrations?q=${encodeURIComponent(NEW_NAME)}`);
    await page.getByRole("link", { name: NEW_NAME }).first().click();
    const id = page.url().split("/").pop()!;
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "ছবি মুছে ফেলুন" }).click();
    await expect(page.getByText("ছবিটি স্থায়ীভাবে মুছে ফেলা হয়েছে।")).toBeVisible();
    expect((await request.get(`/media/alumni/${id}/thumb`)).status()).toBe(404);
  });

  test("event details are editable and the provisional notice can be turned off", async ({ page }) => {
    await page.goto("/admin/event");
    await page.getByLabel("ভেন্যুর নাম").fill("পরীক্ষামূলক ভেন্যু মিলনায়তন");
    await page.getByLabel("নিবন্ধন ফি (টাকা)").fill("500");
    await page.getByLabel(/তথ্যগুলো এখনো প্রস্তাবিত/).uncheck();
    await page.getByRole("button", { name: "সংরক্ষণ করুন" }).click();
    await expect(page.getByText("অনুষ্ঠানের তথ্য হালনাগাদ করা হয়েছে।")).toBeVisible();

    await page.goto("/event");
    await expect(page.getByText("পরীক্ষামূলক ভেন্যু মিলনায়তন").first()).toBeVisible();
    await expect(page.getByText("৫০০ টাকা")).toBeVisible();
    await expect(page.getByText("প্রস্তাবিত তথ্য:")).toHaveCount(0);
    // Structured data appears only for confirmed details
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(1);

    // Invalid input keeps the organizer's typing and shows a Bengali error
    await page.goto("/admin/event");
    await page.getByLabel("ম্যাপ লিংক (ঐচ্ছিক)").fill("javascript:alert(1)");
    await page.getByRole("button", { name: "সংরক্ষণ করুন" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "সঠিক ওয়েব ঠিকানা দিন" })).toBeVisible();
    await expect(page.getByLabel("ম্যাপ লিংক (ঐচ্ছিক)")).toHaveValue("javascript:alert(1)");

    // Restore provisional flag
    await page.goto("/admin/event");
    await page.getByLabel(/তথ্যগুলো এখনো প্রস্তাবিত/).check();
    await page.getByRole("button", { name: "সংরক্ষণ করুন" }).click();
    await expect(page.getByText("অনুষ্ঠানের তথ্য হালনাগাদ করা হয়েছে।")).toBeVisible();
  });

  test("schedule items can be added and appear on the site", async ({ page }) => {
    await page.goto("/admin/event");
    const add = page.locator("form", { has: page.getByRole("button", { name: "যুক্ত করুন" }) });
    await add.getByLabel("কার্যক্রম").fill("প্রীতি ফুটবল ম্যাচ");
    await add.getByLabel("শুরু").fill("17:00");
    await add.getByLabel("শেষ").fill("18:00");
    await add.getByRole("button", { name: "যুক্ত করুন" }).click();
    await expect(page.getByText("নতুন কার্যক্রম যুক্ত করা হয়েছে।")).toBeVisible();
    await page.goto("/event");
    await expect(page.getByText("প্রীতি ফুটবল ম্যাচ")).toBeVisible();
    await expect(page.getByText("বিকেল ৫:০০").filter({ visible: true }).first()).toBeVisible();
  });

  test("sponsors can be added with a logo and published", async ({ page, request }) => {
    await page.goto("/admin/sponsors");
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "যুক্ত করুন" }) }).first();
    await form.getByLabel("নাম").fill("পরীক্ষা স্পনসর লিমিটেড");
    await form.getByLabel("পৃষ্ঠপোষকতার শ্রেণি").selectOption({ label: "স্বর্ণ পৃষ্ঠপোষক" });
    await form.getByLabel("ওয়েবসাইট (ঐচ্ছিক)").fill("https://example.com");
    await form.locator('input[name="logo"]').setInputFiles("tests/.tmp/logo.png");
    await form.getByRole("button", { name: "যুক্ত করুন" }).click();
    await expect(page.getByText("নতুন পৃষ্ঠপোষক যুক্ত করা হয়েছে।")).toBeVisible();

    await page.goto("/sponsors");
    const card = page.locator("article", { hasText: "পরীক্ষা স্পনসর লিমিটেড" });
    await expect(card).toBeVisible();
    await expect(card.getByText("স্বর্ণ পৃষ্ঠপোষক")).toBeVisible();
    const logo = await card.locator("img").getAttribute("src");
    expect((await request.get(logo!)).status()).toBe(200);
  });

  test("CSV export includes phone numbers for admins only, with a BOM for Excel", async ({ page }) => {
    const res = await page.request.get("/admin/export?year=2005");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const body = await res.text();
    expect(body.charCodeAt(0)).toBe(0xfeff);
    expect(body).toContain("নাম,মোবাইল");
    expect(body).toContain("01811000222");
  });

  test("settings: closing registration shows a closed message", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("নিবন্ধন চালু রাখুন").uncheck();
    await page.getByRole("button", { name: "সংরক্ষণ করুন" }).click();
    await expect(page.getByText("সেটিংস সংরক্ষণ করা হয়েছে।")).toBeVisible();
    await page.goto("/register");
    await expect(page.getByText("নিবন্ধন সাময়িকভাবে বন্ধ রয়েছে")).toBeVisible();
    const api = await page.request.post("/api/register", { headers: { "x-requested-with": "fetch" }, multipart: { full_name: "x" } });
    expect(api.status()).toBe(403);

    await page.goto("/admin/settings");
    await page.getByLabel("নিবন্ধন চালু রাখুন").check();
    await page.getByRole("button", { name: "সংরক্ষণ করুন" }).click();
    await expect(page.getByText("সেটিংস সংরক্ষণ করা হয়েছে।")).toBeVisible();
  });

  test("demo data can be removed before launch, leaving real records", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("আমি নিশ্চিত, সব নমুনা তথ্য মুছে ফেলতে চাই।").check();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "নমুনা তথ্য মুছে ফেলুন" }).click();
    await expect(page.getByText(/নমুনা তথ্য মুছে ফেলা হয়েছে/)).toBeVisible();

    await page.goto("/alumni");
    await expect(page.locator("main article", { hasText: NEW_NAME })).toBeVisible();
    await expect(page.getByText("নমুনা", { exact: true })).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByText(/নমুনা \(ডেমো\)/)).toHaveCount(0);
  });

  test("logout ends the session", async ({ page }) => {
    await page.getByRole("button", { name: "বের হোন" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
