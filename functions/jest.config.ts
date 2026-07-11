import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],

  // If you use path aliases later, you’ll map them here.
  moduleNameMapper: {
    // ts-jest ESM requires stripping ".js" that TS adds in NodeNext imports
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  testMatch: ["**/*.test.ts"],
  clearMocks: true,
};

export default config;