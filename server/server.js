const express = require('express');
const OpenAI = require('openai');
const Instructor = require('@instructor-ai/instructor').default;
const { z } = require('zod');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize OpenAI with Instructor
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const client = Instructor({
    client: openai,
    mode: "FUNCTIONS"
});

// Define the schema for single drawing analysis
const DrawingAnalysisSchema = z.object({
    identification: z.string().describe("A clear description of what the drawing appears to be"),
    story: z.string().describe("A creative short story about what's happening in the drawing"),
    lyrics: z.array(z.string()).min(8).max(8).describe("An 8-line song telling the story of the drawing")
});

// Define schema for all players' drawings
const GameRoundSchema = z.object({
    drawings: z.array(DrawingAnalysisSchema).length(4).describe("Analysis for all 4 players' drawings")
});

// Endpoint to analyze drawings
app.post('/api/analyze-drawings', async (req, res) => {
    try {
        const { drawings } = req.body; // Expect array of base64 images
        
        if (!Array.isArray(drawings) || drawings.length !== 4) {
            return res.status(400).json({ 
                error: 'Please provide exactly 4 drawings (one from each player)' 
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
                                text: "You are a creative songwriter and storyteller. Look at this drawing and:\n" +
                                      "1. Identify what it shows\n" +
                                      "2. Create a brief story about it\n" +
                                      "3. Write exactly 8 lines of song lyrics that tell this story" 
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: drawing
                                }
                            }
                        ]
                    }
                ],
                model: "gpt-4-vision-preview",
                response_model: {
                    schema: DrawingAnalysisSchema,
                    name: "DrawingAnalysis"
                },
                max_tokens: 1000
            });
            return analysis;
        });

        // Wait for all analyses to complete
        const allAnalyses = await Promise.all(analysisPromises);

        // Structure the response according to the game round schema
        const gameRound = {
            drawings: allAnalyses
        };

        res.json(gameRound);

    } catch (error) {
        console.error('Error analyzing drawings:', error);
        res.status(500).json({ 
            error: 'Error analyzing drawings',
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
