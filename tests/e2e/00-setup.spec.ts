import { expect, test } from "@playwright/test";
import { ADMIN, E2E_ENV, MODERATOR } from "./env";

test.describe("first-time setup", () => {
  test("login page points to setup while no admin exists", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByText("এখনো কোনো অ্যাডমিন অ্যাকাউন্ট নেই।")).toBeVisible();
    await page.getByRole("link", { name: "প্রথম অ্যাডমিন তৈরি করুন" }).click();
    await expect(page).toHaveURL(/\/admin\/setup$/);
  });

  test("a wrong setup code is rejected", async ({ page }) => {
    await page.goto("/admin/setup");
    await page.getByLabel("সেটআপ কোড (SETUP_TOKEN)").fill("wrong-token-wrong-token");
    await page.getByLabel("আপনার নাম").fill("Intruder");
    await page.getByLabel("ইমেইল").fill("intruder@example.com");
    await page.getByLabel("পাসওয়ার্ড", { exact: true }).fill("intruder-password");
    await page.getByLabel("পাসওয়ার্ড আবার লিখুন").fill("intruder-password");
    await page.getByRole("button", { name: "অ্যাডমিন তৈরি করুন" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "সেটআপ কোডটি সঠিক নয়" })).toBeVisible();
  });

  test("the first admin is created with the setup code, then setup closes", async ({ page }) => {
    await page.goto("/admin/setup");
    await page.getByLabel("সেটআপ কোড (SETUP_TOKEN)").fill(E2E_ENV.SETUP_TOKEN);
    await page.getByLabel("আপনার নাম").fill("পরীক্ষা অ্যাডমিন");
    await page.getByLabel("ইমেইল").fill(ADMIN.email);
    await page.getByLabel("পাসওয়ার্ড", { exact: true }).fill(ADMIN.password);
    await page.getByLabel("পাসওয়ার্ড আবার লিখুন").fill(ADMIN.password);
    await page.getByRole("button", { name: "অ্যাডমিন তৈরি করুন" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: /স্বাগতম, পরীক্ষা অ্যাডমিন/ })).toBeVisible();

    // A moderator is added from the admin users page
    await page.goto("/admin/users");
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "অ্যাকাউন্ট তৈরি করুন" }) });
    await form.getByLabel("নাম").fill("পরীক্ষা মডারেটর");
    await form.getByLabel("ইমেইল").fill(MODERATOR.email);
    await form.getByLabel("প্রাথমিক পাসওয়ার্ড").fill(MODERATOR.password);
    await form.getByRole("button", { name: "অ্যাকাউন্ট তৈরি করুন" }).click();
    await expect(page.getByText(/নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি হয়েছে/)).toBeVisible();

    // Setup can no longer be used, even with the right code
    await page.context().clearCookies();
    await page.goto("/admin/setup");
    await expect(page.getByText("সেটআপ আগেই সম্পন্ন হয়েছে।")).toBeVisible();
    await expect(page.getByRole("button", { name: "অ্যাডমিন তৈরি করুন" })).toHaveCount(0);
  });
});
