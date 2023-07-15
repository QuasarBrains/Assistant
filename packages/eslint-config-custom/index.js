module.exports = {
  extends: ["turbo", "prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "no-console": ["error", { allow: ["info", "error"] }],
  },
  parserOptions: {
    babelOptions: {
      presets: [require.resolve("next/babel")],
    },
  },
};
