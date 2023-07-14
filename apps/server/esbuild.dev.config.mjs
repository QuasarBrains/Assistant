import * as esbuild from "esbuild";
import { sassPlugin, postcssModules } from "esbuild-sass-plugin";
import { config } from "dotenv";
import http from "http";
import { exec } from "child_process";

config();

const openBrowserTab = async () => {
  // make a call to the server first to see if it's up and running, if not, wait 1 second and try again
  const checkServer = async () => {
    return new Promise((resolve) => {
      const req = http.request(
        {
          host: "localhost",
          port: process.env.PORT || 3000,
          path: "/check-server-is-up",
          method: "GET",
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve(true);
          });
        }
      );
      req.on("error", (err) => {
        console.error("Error checking if server is up...", err);
        resolve(false);
      });
      req.end();
    });
  };

  const openTab = async () => {
    return new Promise((resolve) => {
      const url = `http://localhost:${process.env.PORT || 3000}`;
      const cmd = process.platform === "win32" ? "start" : "open";
      console.info(`Opening ${url} in browser...`);
      exec(`${cmd} ${url}`);
      resolve(true);
    });
  };

  let serverIsUp = await checkServer();
  while (!serverIsUp) {
    console.info("Server is not up yet, waiting 1 second...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    serverIsUp = await checkServer();
  }
  await openTab();
};

const watch = async () => {
  const ctx = await esbuild.context({
    entryPoints: ["client/index.tsx"],
    bundle: true,
    outfile: "public/build/bundle.js",
    sourcemap: true,
    minify: false,
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
      {
        name: "development-server",
        setup: (build) => {
          build.onEnd(() => {
            const now = new Date().toLocaleTimeString();
            console.info(`Build finished at ${now}. Watching for changes...`);
            console.info("Sending rebuild notification...");
            const req = http.request(
              {
                host: "localhost",
                port: process.env.PORT || 3000,
                path: "/esbuild-rebuilt",
                method: "POST",
              },
              (res) => {
                if (res.complete) {
                  console.info("Rebuild notification sent successfully.");
                } else {
                  console.error("Error sending rebuild notification:", res);
                }
              }
            );
            req.on("error", (err) => {
              console.error("Error sending rebuild notification:", err);
            });
            req.end();
          });
        },
      },
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
  });
  await ctx.watch();
  console.info("Served and Watching...");
  openBrowserTab();
};
watch();
