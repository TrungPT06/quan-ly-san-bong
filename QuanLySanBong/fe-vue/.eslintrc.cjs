module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ["eslint:recommended", "plugin:vue/vue3-essential"],
  ignorePatterns: ["dist", ".eslintrc.cjs", "tests"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  overrides: [{ files: ["vite.config.js"], env: { node: true } }],
  rules: { "vue/multi-word-component-names": "off" },
};
