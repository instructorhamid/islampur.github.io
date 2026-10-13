// Environment for the end-to-end test server. Uses a separate database and upload folder.
export const E2E_PORT = 3100;
export const E2E_URL = `http://localhost:${E2E_PORT}`;
export const E2E_ENV = {
  DATABASE_URL: process.env.E2E_DATABASE_URL || "postgres://reunion:reunion@localhost:5432/reunion_test",
  APP_SECRET: "e2e-test-secret-that-is-long-enough-123",
  STORAGE_DRIVER: "local",
  LOCAL_UPLOAD_DIR: "tests/.tmp/uploads",
  NEXT_PUBLIC_SITE_URL: E2E_URL,
  NEXT_DIST_DIR: ".next-test",
  MAX_UPLOAD_MB: "4",
  SETUP_TOKEN: "e2e-setup-token-0123456789",
};
export const ADMIN = { email: "admin@test.local", password: "admin-password-123" };
export const MODERATOR = { email: "moderator@test.local", password: "moderator-password-123" };
