import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { stats } from "./src/bot"; // Initialize the bot
import { listAvailableModels } from "./src/services/geminiService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/status", (req, res) => {
    const geminiKey = process.env.GEMINI_API_KEY_NEW || process.env.GEMINI_API_KEY || "";
    res.json({ 
      botActive: !!process.env.TELEGRAM_BOT_TOKEN,
      geminiActive: geminiKey.length > 10 && geminiKey !== "MY_GEMINI_API_KEY",
      stats: stats
    });
  });

  app.get("/api/diagnostic/models", async (req, res) => {
    const result = await listAvailableModels();
    res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
