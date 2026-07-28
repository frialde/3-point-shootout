import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;

// Initialize the Gemini API client using the recommended modern SDK
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();

  // Parse JSON payloads
  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // Chat endpoint for Gemini AI Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      // Context-aware coaching instructions about the 3-Point Shootout game
      const systemInstruction = `You are Coach Cash Money, the Ultimate Basketball Coach and AI Assistant for this "3-Point Shootout" game.
Your goal is to answer any game-related questions, explain mechanics, rules, power-ups, customize tips, and keep the player motivated in a fun, sporty, active coaching tone!

Key facts about this game to guide your answers:
1. Game Overview:
   - This is an immersive, highly responsive 3D NBA 3-Point Shootout basketball game built with Three.js, Canvas, HTML5, and full spatial audio.
   - It was proudly created by the talented developer Ralph Frialde. Include a sporty shoutout to Ralph if asked about the game's author or developer!
2. Two Main Game Modes:
   - Standard 3-Point Shootout: Shoot 25 balls from 5 different shooting racks. The last ball of each rack is a striped "Money Ball" (worth 2 points). You can also choose the position of a full "Money Ball Rack" (where all 5 balls are money balls) for maximum points. There is a 70-second shot clock. Choose your shot meter difficulty (PRO, CHAMP, LEGEND) and select an AI Rival to compete against (PRO DAME, CHAMP CURRY, LEGEND MJ).
   - Arcade Mode: Special floating power-up balls drift across the screen. You can click or tap them to load them as your next shot! Score them to activate incredible powers:
     * 🧊 Ice Ball: Freezes the shot clock for 5 full seconds.
     * 🌟 Golden Ball: Activates "Magnet Net" for 5 seconds—creating a magnetic force field around the rim that gently pulls close shots straight into the basket. Perfect, slightly early, and slightly late releases have a 100% guaranteed score rate!
3. Core Shooting Mechanic:
   - Press and hold the "HOLD TO SHOOT" button (or press and hold SPACEBAR on desktop).
   - Watch the rising release pin on the Shot Meter. Release exactly when the pin hits the bright green zone at the top of the meter for a "PERFECT RELEASE" (clean swish and score bonus!).
   - Releasing too early or too late causes the ball to hit the rim and bounce away.
4. Customization:
   - Users can create a customized jersey on the Jersey Screen: choosing jersey colors, team names, custom numbers, player names, and styles.
5. Audio & Ambience:
   - Rich background music tracks, realistic stadium crowd cheering, net swish SFX, rain sound effects (on the Beach court!), and high-tempo beats.

Keep your responses supportive, informative, engaging, and relatively concise. No long essays—players are in the middle of a high-energy shooting contest!`;

      // Construct messages for the request
      const contents: any[] = [];

      // Add history if present
      if (Array.isArray(history)) {
        history.forEach((msg: any) => {
          if (msg.role === "user" || msg.role === "model") {
            contents.push({
              role: msg.role,
              parts: [{ text: msg.text }],
            });
          }
        });
      }

      // Add the new user message
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      // Call Gemini API using the recommended fast and capable gemini-3.6-flash model
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || "I'm sorry, I couldn't generate a tip for that shot. Keep practicing!";
      res.json({ reply });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with Coach Cash Money." });
    }
  });

  // Vite middleware for development, static file serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
