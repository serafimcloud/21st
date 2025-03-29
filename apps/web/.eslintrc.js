/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/next.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  rules: {
    "@next/next/no-img-element": "off",
  },
  overrides: [
    {
      files: ["tailwind.config.js"],
      parser: "espree",
      parserOptions: {
        ecmaVersion: 2020,
      },
    },
  ],
}
