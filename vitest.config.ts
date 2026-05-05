import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: [
      "lib/**/*.test.ts",
      "lib/**/*.spec.ts",
      "lib/**/__tests__/**/*.test.ts",
      "scripts/**/*.test.ts",
      "scripts/**/*.spec.ts",
      "scripts/**/__tests__/**/*.test.ts",
      "app/**/*.test.ts",
      "app/**/*.spec.ts",
      "db/**/*.test.ts",
      "runner/**/*.test.ts",
      "runner/**/__tests__/**/*.test.ts",
    ],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
