import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "lib",
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: false,
  bundle: true,

  /**
   * Force local workspace package into the bundle.
   */
  noExternal: ["@builtmode/shared"],

  /**
   * Keep Firebase server dependencies external.
   */
  external: ["firebase-admin", "firebase-functions"],
});
