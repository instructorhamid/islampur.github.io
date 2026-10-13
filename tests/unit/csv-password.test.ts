import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("CSV export safety", () => {
  it("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+123")).toBe("'+123");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("quotes commas and newlines and keeps Bengali", () => {
    expect(csvCell("করিম, রহিম")).toBe('"করিম, রহিম"');
    expect(toCsv(["নাম"], [["করিম"]])).toBe("﻿নাম\r\nকরিম\r\n");
  });
});

describe("password hashing", () => {
  it("verifies correct passwords and rejects wrong ones", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
    expect(await verifyPassword("anything", "garbage")).toBe(false);
  });
});
