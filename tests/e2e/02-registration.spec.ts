import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const PHOTO = "tests/.tmp/photo.jpg";
export const NEW_ALUMNUS = { name: "পরীক্ষা নিবন্ধনকারী", phone: "01811000222", year: "2005" };

test.describe("registration", () => {
  test("client-side validation lists every problem in Bengali", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "নিবন্ধন সম্পন্ন করুন" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "কিছু তথ্য সঠিক নয়" })).toBeVisible();
    await expect(page.getByText("অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।")).toBeVisible();
    await expect(page.getByText("অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।")).toBeVisible();
    await expect(page.getByText("অনুগ্রহ করে রক্তের গ্রুপ নির্বাচন করুন।")).toBeVisible();
    await expect(page.getByText("অনুগ্রহ করে পাসের বছর নির্বাচন করুন।")).toBeVisible();
    await expect(page.getByText("অনুগ্রহ করে একটি প্রোফাইল ছবি যুক্ত করুন।")).toBeVisible();
    await expect(page.getByText("নিবন্ধনের জন্য গোপনীয়তা নীতিতে সম্মতি দেওয়া প্রয়োজন।")).toBeVisible();
    // Focus moves to the first invalid field
    await expect(page.getByLabel(/পূর্ণ নাম/)).toBeFocused();

    await page.getByLabel(/মোবাইল নম্বর/).fill("12345");
    await page.getByLabel(/মোবাইল নম্বর/).blur();
    await expect(page.getByText(/সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন/)).toBeVisible();
  });

  test("non-image files are rejected in the browser", async ({ page }) => {
    await page.goto("/register");
    await page.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByText("শুধু JPG, PNG বা WebP ছবি গ্রহণযোগ্য।")).toBeVisible();
  });

  test("the server rejects fake images, missing fields and duplicates on its own", async ({ request }) => {
    const fake = await request.post("/api/register", {
      headers: { "x-requested-with": "fetch" },
      multipart: {
        full_name: "Server Check",
        phone: "01811999000",
        blood_group: "A+",
        passing_year: "2001",
        privacy_accepted: "on",
        photo: { name: "x.jpg", mimeType: "image/jpeg", buffer: readFileSync("tests/.tmp/not-an-image.jpg") },
      },
    });
    expect(fake.status()).toBe(422);
    expect((await fake.json()).fields.photo).toBeTruthy();

    const missing = await request.post("/api/register", { headers: { "x-requested-with": "fetch" }, multipart: { full_name: "" } });
    expect(missing.status()).toBe(422);
    expect(Object.keys((await missing.json()).fields).sort()).toEqual(
      ["blood_group", "full_name", "passing_year", "phone", "photo", "privacy_accepted"].sort(),
    );

    const wrongType = await request.post("/api/register", {
      headers: { "x-requested-with": "fetch" },
      multipart: {
        full_name: "Gif Person",
        phone: "01811999001",
        blood_group: "A+",
        passing_year: "2001",
        privacy_accepted: "on",
        photo: { name: "x.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") },
      },
    });
    expect(wrongType.status()).toBe(422);

    // A crafted request cannot set approval status or admin fields
    const sneaky = await request.post("/api/register", {
      headers: { "x-requested-with": "fetch" },
      multipart: {
        full_name: "Sneaky Person",
        phone: "01811999002",
        blood_group: "O+",
        passing_year: "2001",
        privacy_accepted: "on",
        approval_status: "approved",
        role: "admin",
        photo: { name: "p.jpg", mimeType: "image/jpeg", buffer: readFileSync(PHOTO) },
      },
    });
    expect(sneaky.status()).toBe(201);
    expect((await sneaky.json()).status).toBe("pending");
  });

  test("a valid alumnus can register with a photo and sees a Bengali confirmation", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/পূর্ণ নাম/).fill(`  ${NEW_ALUMNUS.name}  `);
    await page.getByLabel(/মোবাইল নম্বর/).fill("+880 1811-000222");
    await page.getByRole("combobox", { name: /রক্তের গ্রুপ/ }).selectOption("AB+");
    await page.getByRole("combobox", { name: /পাসের বছর/ }).selectOption(NEW_ALUMNUS.year);
    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    await expect(page.getByAltText("নির্বাচিত ছবির প্রিভিউ")).toBeVisible();
    await expect(page.getByRole("button", { name: "ছবি পরিবর্তন করুন" })).toBeVisible();
    await page.getByLabel(/আমার ছবি প্রাক্তন শিক্ষার্থী তালিকায় প্রকাশ করা যাবে/).check();
    await page.getByLabel(/গোপনীয়তা নীতি/).check();

    const submit = page.getByRole("button", { name: "নিবন্ধন সম্পন্ন করুন" });
    await submit.click();
    await expect(page.getByRole("heading", { name: "নিবন্ধন জমা হয়েছে!" })).toBeVisible();
    await expect(page.getByText(/আপনার নিবন্ধন সফলভাবে গ্রহণ করা হয়েছে/)).toBeVisible();
    await expect(page.getByText(/অনুমোদনের অপেক্ষায়/)).toBeVisible();
  });

  test("the same phone number in another format is reported as a duplicate", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/পূর্ণ নাম/).fill("Duplicate Person");
    await page.getByLabel(/মোবাইল নম্বর/).fill("০১৮১১০০০২২২");
    await page.getByRole("combobox", { name: /রক্তের গ্রুপ/ }).selectOption("O-");
    await page.getByRole("combobox", { name: /পাসের বছর/ }).selectOption("2012");
    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    await page.getByLabel(/গোপনীয়তা নীতি/).check();
    await page.getByRole("button", { name: "নিবন্ধন সম্পন্ন করুন" }).click();
    await expect(page.getByText(/ইতিমধ্যে নিবন্ধন করা হয়েছে/).first()).toBeVisible();
  });

  test("a pending registration is not public yet", async ({ page }) => {
    await page.goto(`/alumni?q=${encodeURIComponent(NEW_ALUMNUS.name)}`);
    await expect(page.getByText("কোনো ফলাফল পাওয়া যায়নি")).toBeVisible();
  });
});
