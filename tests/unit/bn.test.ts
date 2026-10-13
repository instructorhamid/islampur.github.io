import { describe, expect, it } from "vitest";
import { formatBnDate, formatBnNumber, formatBnTime, formatTaka, fromBnDigits, fromDhakaInputValue, toBn, toDhakaInputValue } from "@/lib/bn";

describe("Bengali formatting", () => {
  it("converts digits both ways", () => {
    expect(toBn(2026)).toBe("২০২৬");
    expect(toBn("08:30")).toBe("০৮:৩০");
    expect(fromBnDigits("০১৭১২")).toBe("01712");
  });

  it("formats numbers with South Asian grouping", () => {
    expect(formatBnNumber(1234567)).toBe("১২,৩৪,৫৬৭");
    expect(formatTaka(500)).toBe("৫০০ টাকা");
  });

  it("formats times with Bengali day periods", () => {
    expect(formatBnTime("08:30")).toBe("সকাল ৮:৩০");
    expect(formatBnTime("12:30")).toBe("দুপুর ১২:৩০");
    expect(formatBnTime("14:00")).toBe("দুপুর ২:০০");
    expect(formatBnTime("16:00")).toBe("বিকেল ৪:০০");
    expect(formatBnTime("19:15")).toBe("সন্ধ্যা ৭:১৫");
    expect(formatBnTime("23:59")).toBe("রাত ১১:৫৯");
    expect(formatBnTime("05:00")).toBe("ভোর ৫:০০");
  });

  it("formats dates in Dhaka time", () => {
    // 2027-01-21T20:00Z is already 22 January in Dhaka (UTC+6)
    expect(formatBnDate(new Date("2027-01-21T20:00:00Z"))).toBe("২২ জানুয়ারি ২০২৭");
    expect(formatBnDate(new Date("2027-01-22T02:30:00Z"), { weekday: true })).toBe("শুক্রবার, ২২ জানুয়ারি ২০২৭");
  });

  it("round-trips datetime-local values in Dhaka time", () => {
    const d = fromDhakaInputValue("2027-01-22T08:30");
    expect(d?.toISOString()).toBe("2027-01-22T02:30:00.000Z");
    expect(toDhakaInputValue(d)).toBe("2027-01-22T08:30");
    expect(fromDhakaInputValue("")).toBeNull();
    expect(fromDhakaInputValue("garbage")).toBeNull();
  });
});
