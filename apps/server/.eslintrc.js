module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    overrides: [],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["react", "@typescript-eslint"],
    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-var-requires": "warn",
        // console logs are not allowed
        "no-console": ["warn", { allow: ["warn", "error", "info"] }],
        // "@typescript-eslint/explicit-module-boundary-types": [
        //   {
        //     allowTypedFunctionExpressions: true,
        //   },
        //   "warn",
        // ],
    },
};
