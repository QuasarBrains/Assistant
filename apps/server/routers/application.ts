import Express, { Router } from "express";
import path from "path";

const router = Router();

router.get("/build/bundle.js", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "build", "bundle.js"));
});
router.get("/build/bundle.js.map", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "build", "bundle.js.map"));
});
router.get("/build/bundle.css", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "build", "bundle.css"));
});

router.use("/", Express.static(path.join(process.cwd(), "public")));
router.get("/*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

export default router;
