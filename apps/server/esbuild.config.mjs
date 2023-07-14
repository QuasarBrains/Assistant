import * as esbuild from "esbuild";
import { sassPlugin, postcssModules } from "esbuild-sass-plugin";

await esbuild
  .build({
    entryPoints: ["client/index.tsx"],
    bundle: true,
    outfile: "public/build/bundle.js",
    sourcemap: false,
    minify: true,
    plugins: [
      sassPlugin({
        filter: /\.module\.scss$/,
        transform: postcssModules({
          generateScopedName: "[name]__[local]___[hash:base64:5]",
          basedir: "client",
        }),
        type: "css",
      }),
      sassPlugin({
        filter: /\.scss$/,
      }),
    ],
    loader: {
      ".js": "jsx",
      ".jsx": "jsx",
      ".ts": "tsx",
      ".tsx": "tsx",
      ".scss": "css",
    },
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
  })
  .catch(() => process.exit(1));
