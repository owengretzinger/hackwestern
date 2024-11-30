const express = require("express");
const OpenAI = require("openai");
const Instructor = require("@instructor-ai/instructor").default;
const { z } = require("zod");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));

// Initialize OpenAI with Instructor
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = Instructor({
  client: openai,
  mode: "FUNCTIONS",
});

// Define the schema for single drawing analysis
const DrawingAnalysisSchema = z.object({
  identification: z
    .string()
    .describe("A clear description of what the drawing appears to be"),
  lyrics: z
    .array(z.string().max(60))
    .min(4)
    .max(4)
    .describe("A 4-line song about the drawing"),
});

// Define schema for all players' drawings
const GameRoundSchema = z.object({
  drawings: z
    .array(DrawingAnalysisSchema)
    .min(1)
    .describe("Analysis for all players' drawings"),
});

// Endpoint to analyze drawings
app.post("/api/analyze-drawings", async (req, res) => {
  try {
    const { drawings } = req.body; // Expect array of base64 images

    if (!Array.isArray(drawings) || drawings.length < 1) {
      return res.status(400).json({
        error: "Please provide at least 1 drawing",
      });
    }

    // Analyze each drawing sequentially
    const analysisPromises = drawings.map(async (drawing, index) => {
      const analysis = await client.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "You are an expert at identifying poorly drawn images and writing song lyrics about them. Take a drawing and:\n" +
                  "1. Identify what it shows\n" +
                  "2. Write exactly 4 lines of song lyrics about the drawing.\n" +
                  "IMPORTANT: Each line MUST be 60 characters or less.\n" +
                  "Keep lyrics simple and short.",
              },
              {
                type: "image_url",
                image_url: {
                  url: drawing,
                },
              },
            ],
          },
        ],
        model: "gpt-4o-mini",
        response_model: {
          schema: DrawingAnalysisSchema,
          name: "DrawingAnalysis",
        },
        max_tokens: 1000,
      });
      return analysis;
    });

    // Wait for all analyses to complete
    const allAnalyses = await Promise.all(analysisPromises);

    // Structure the response according to the game round schema
    const gameRound = {
      drawings: allAnalyses,
    };

    res.json(gameRound);
  } catch (error) {
    console.error("Error analyzing drawings:", error);
    res.status(500).json({
      error: "Error analyzing drawings",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
