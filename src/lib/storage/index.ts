import "server-only";
import { env } from "../env";
import { localStorageDriver } from "./local";
import { supabaseStorageDriver } from "./supabase";
import type { StorageDriver } from "./types";

export type { StorageDriver } from "./types";

export function storage(): StorageDriver {
  return env.storageDriver === "supabase" ? supabaseStorageDriver : localStorageDriver;
}
