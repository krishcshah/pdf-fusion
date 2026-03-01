import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API to list files
  app.get("/api/files", async (req, res) => {
    try {
      const rootDir = process.cwd();
      const files: string[] = [];

      async function scanDir(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(rootDir, fullPath);

          // Skip ignored directories
          if (
            entry.name === "node_modules" ||
            entry.name === "dist" ||
            entry.name === ".git" ||
            entry.name === ".next" ||
            entry.name === "package-lock.json"
          ) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else {
            files.push(relativePath);
          }
        }
      }

      await scanDir(rootDir);
      res.json(files);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  // API to get file content
  app.get("/api/file-content", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: "Path is required" });
    }

    try {
      const rootDir = process.cwd();
      const fullPath = path.join(rootDir, filePath);

      // Security check: ensure the path is within the root directory
      if (!fullPath.startsWith(rootDir)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const content = await fs.readFile(fullPath, "utf-8");
      res.json({ content });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the dist folder
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
