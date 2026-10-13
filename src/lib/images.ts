import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { ALLOWED_IMAGE_TYPES } from "./constants";
import { env } from "./env";
import { storage } from "./storage";

export class ImageValidationError extends Error {
  constructor(public reason: "type" | "size" | "invalid" | "missing") {
    super(reason);
  }
}

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

/**
 * Validate an uploaded file by its declared type, its size AND its actual decoded content.
 * Returns the raw bytes. Throws ImageValidationError for anything unacceptable.
 */
async function readValidatedImage(file: unknown): Promise<Buffer> {
  if (!(file instanceof File) || file.size === 0) throw new ImageValidationError("missing");
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) throw new ImageValidationError("type");
  if (file.size > env.maxUploadBytes) throw new ImageValidationError("size");
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const meta = await sharp(buffer, { limitInputPixels: 50_000_000 }).metadata();
    if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new ImageValidationError("type");
    if (!meta.width || !meta.height || meta.width < 64 || meta.height < 64) throw new ImageValidationError("invalid");
  } catch (err) {
    if (err instanceof ImageValidationError) throw err;
    throw new ImageValidationError("invalid");
  }
  return buffer;
}

/**
 * Re-encode a profile photo to WebP. Re-encoding strips EXIF/GPS metadata and any
 * non-image payload. Produces a full-size image and a square thumbnail.
 * Returns the storage prefix (key) under which "<key>/full.webp" and "<key>/thumb.webp" are stored.
 */
export async function storeProfilePhoto(file: unknown): Promise<string> {
  const input = await readValidatedImage(file);
  const base = sharp(input, { limitInputPixels: 50_000_000 }).rotate(); // honour EXIF orientation
  const [full, thumb] = await Promise.all([
    base.clone().resize(1000, 1000, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    base.clone().resize(480, 480, { fit: "cover", position: sharp.strategy.attention }).webp({ quality: 78 }).toBuffer(),
  ]);
  const key = `alumni/${randomUUID()}`;
  const store = storage();
  await store.put(`${key}/full.webp`, full, "image/webp");
  try {
    await store.put(`${key}/thumb.webp`, thumb, "image/webp");
  } catch (err) {
    await store.delete([`${key}/full.webp`]).catch(() => {});
    throw err;
  }
  return key;
}

export function photoObjectKeys(key: string) {
  return [`${key}/full.webp`, `${key}/thumb.webp`];
}

/** Sponsor logos keep transparency and are fitted inside 800×400. */
export async function storeSponsorLogo(file: unknown): Promise<string> {
  const input = await readValidatedImage(file);
  const logo = await sharp(input, { limitInputPixels: 50_000_000 })
    .rotate()
    .resize(800, 400, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
  const key = `sponsors/${randomUUID()}.webp`;
  await storage().put(key, logo, "image/webp");
  return key;
}

/** Best-effort removal; never throws (used in cleanup paths). */
export async function deleteObjects(keys: string[]) {
  try {
    await storage().delete(keys);
  } catch (err) {
    console.error("Failed to delete storage objects", keys, err);
  }
}
