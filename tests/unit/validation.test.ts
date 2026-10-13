import { describe, expect, it } from "vitest";
import { cleanText, fieldErrors, registrationSchema } from "@/lib/validation";

const schema = registrationSchema({ min: 1960, max: 2026 });
const valid = {
  full_name: "  মোহাম্মদ   আব্দুল করিম ",
  phone: "+880 1712-345678",
  blood_group: "B+",
  passing_year: "২০০৫",
  photo_consent: "on",
  blood_group_public_consent: undefined,
  privacy_accepted: "on",
};

describe("registrationSchema", () => {
  it("accepts and normalizes a valid Bengali registration", () => {
    const r = schema.parse(valid);
    expect(r).toEqual({
      full_name: "মোহাম্মদ আব্দুল করিম",
      phone: "01712345678",
      blood_group: "B+",
      passing_year: 2005,
      photo_consent: true,
      blood_group_public_consent: false,
      privacy_accepted: true,
    });
  });

  it("accepts English names with dots and hyphens", () => {
    expect(schema.parse({ ...valid, full_name: "Md. Abdul-Karim O'Neil" }).full_name).toBe("Md. Abdul-Karim O'Neil");
  });

  it("rejects missing and invalid fields with Bengali messages", () => {
    const r = schema.safeParse({ full_name: "", phone: "123", blood_group: "C+", passing_year: "1800" });
    expect(r.success).toBe(false);
    const errors = fieldErrors(r.error!);
    expect(Object.keys(errors).sort()).toEqual(["blood_group", "full_name", "passing_year", "phone", "privacy_accepted"]);
    expect(errors.phone).toContain("মোবাইল");
    expect(errors.passing_year).toContain("১৯৬০");
  });

  it("rejects names with digits or markup", () => {
    expect(schema.safeParse({ ...valid, full_name: "Karim 123" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, full_name: "<script>alert(1)</script>" }).success).toBe(false);
  });

  it("requires privacy consent", () => {
    expect(schema.safeParse({ ...valid, privacy_accepted: "" }).success).toBe(false);
  });

  it("enforces the configured year range", () => {
    expect(schema.safeParse({ ...valid, passing_year: "2027" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, passing_year: "1960" }).success).toBe(true);
  });

  it("cleans whitespace", () => {
    expect(cleanText("  a \n\t b  ")).toBe("a b");
  });
});
