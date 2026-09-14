const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    // PENTING: Pattern lebih spesifik harus di atas pattern umum
    "^dotenv/config$": "<rootDir>/tests/helpers/dotenv-mock.js",
    "^uuid$": "<rootDir>/tests/helpers/uuid-mock.js",
    "^typst$": "<rootDir>/tests/helpers/typst-mock.js",
    "^multer$": "<rootDir>/tests/helpers/multer-mock.js",
    "^@/db$": "<rootDir>/tests/helpers/db-mock.ts",
    "^@/db/(.*)$": "<rootDir>/tests/helpers/db-mock.ts",
    "^@/middlewares/upload.middleware$": "<rootDir>/tests/helpers/upload-middleware-mock.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/tests/helpers/setup.ts"],
};