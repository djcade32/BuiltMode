// Run with the Firestore emulator: firebase emulators:exec --only firestore
// --project demo-builtmode-rules "npm run test:rules"
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("Run test:rules through the local Firestore emulator.");
}

module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/security/firestore.rules.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      tsconfig: { module: "Node16", moduleResolution: "Node16", target: "es2020", esModuleInterop: true, isolatedModules: true, rootDir: __dirname },
    }],
  },
  testTimeout: 20000,
  maxWorkers: 1,
  watchman: false,
};
