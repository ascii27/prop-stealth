import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    // Allow .js import specifiers (NodeNext) to resolve in tests
    extensions: [".ts", ".js"],
  },
});
