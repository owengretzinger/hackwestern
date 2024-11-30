const express = require("express");
const OpenAI = require("openai");
const Instructor = require("@instructor-ai/instructor").default;
const { z } = require("zod");
const cors = require("cors");
const fetch = require("node-fetch");
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

async function createSongFromAnalysis(analysisResults) {
    try {
        // Combine all identifications and lyrics
        const combinedStory = analysisResults.drawings
            .map(d => d.identification)
            .join(" and ");
        
        const allLyrics = analysisResults.drawings
            .flatMap(d => d.lyrics)
            .join("\n");

        // Create prompt for song creation
        const songPrompt = `Create a song that combines these stories:\nStory: ${combinedStory}\nLyrics to incorporate: ${allLyrics}`;

        // Send to song creation service
        const response = await fetch('https://09be-129-100-255-24.ngrok-free.app/createSong', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: songPrompt
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create song');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating song:', error);
        throw error;
    }
}

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
            content: "You are an expert at identifying poorly drawn images and writing song lyrics about them. Take this base64 image and:\n" +
                     "1. Identify what it shows\n" +
                     "2. Write exactly 4 lines of song lyrics about it.\n" +
                     "IMPORTANT: Each line MUST be 60 characters or less.\n" +
                     "Keep lyrics simple and short.\n\n" +
                     "Here's the base64 image: " + drawing
          }
        ],
        model: "gpt-4",
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

    // Create song from the analysis
    const songResult = await createSongFromAnalysis(gameRound);

    // Return both the analysis and the song
    res.json({
      analysis: gameRound,
      song: songResult
    });

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
