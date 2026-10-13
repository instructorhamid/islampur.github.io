import { describe, expect, it } from "vitest";
import { normalizeBdPhone } from "@/lib/phone";

describe("normalizeBdPhone", () => {
  it.each([
    ["01712345678", "01712345678"],
    ["+8801712345678", "01712345678"],
    ["8801712345678", "01712345678"],
    ["008801712345678", "01712345678"],
    ["+880 1712-345678", "01712345678"],
    ["(017) 1234 5678", "01712345678"],
    ["০১৭১২৩৪৫৬৭৮", "01712345678"],
    ["+৮৮০১৯১২৩৪৫৬৭৮", "01912345678"],
    ["1712345678", "01712345678"],
    ["01312345678", "01312345678"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeBdPhone(input)).toBe(expected);
  });

  it.each(["", "12345", "01212345678", "0171234567", "017123456789", "01712abc678", "+1 415 555 0100", "01112345678"])(
    "rejects %s",
    (input) => {
      expect(normalizeBdPhone(input)).toBeNull();
    },
  );
});
