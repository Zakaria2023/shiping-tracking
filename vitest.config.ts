import { configDefaults, defineConfig } from "vitest/config";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// `import "server-only"` throws outside Next's server runtime; a test is server
// code too, so it gets the same empty module Next resolves it to.
const serverOnlyEmpty = join(
  dirname(createRequire(import.meta.url).resolve("server-only")),
  "empty.js",
);

export default defineConfig({
  resolve: { alias: { "server-only": serverOnlyEmpty, "@": join(import.meta.dirname, "src") } },
  test: {
    include: ["src/**/*.test.ts", "db/**/*.test.ts"],
    exclude: [...configDefaults.exclude],
    environment: "node",
  },
});
