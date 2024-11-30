import OpenAI from "openai";
import Instructor from "@instructor-ai/instructor";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const client = Instructor({
  client: openai,
  mode: "FUNCTIONS",
});

// Define the schema for single drawing analysis
const DrawingAnalysisSchema = z.object({
  lyrics: z
    .array(z.string().max(80))
    .min(4)
    .max(4)
    .describe("A 4-line verse of a song about the drawing"),
});

// Define schema for genre analysis
const GenreAnalysisSchema = z.object({
  genre: z
    .string()
    .describe("The most fitting musical genre for these drawings and lyrics"),
});

// Define the schema for the game round
const GameRoundSchema = z.object({
  lyrics: z.string().describe("The lyrics of the song"),
  genre: z.string().describe("The genre of the song"),
});

type GameRoundResponse = z.infer<typeof GameRoundSchema>;

// Update the submitImageToAI function
export const submitImageToAI = async (
  images: string[]
): Promise<GameRoundResponse> => {
  const allLyrics = await Promise.all(
    images.map(async (image) => {
      const analysis = await client.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "You are an expert at identifying poorly drawn images and writing song lyrics about them. " +
                  "Take a drawing and write exactly 4 lines of song lyrics about the drawing.\n" +
                  "IMPORTANT: Each line MUST be 80 characters or less.\n" +
                  "Keep lyrics simple and short.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
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
    })
  );

  const lyricsString = allLyrics
    .map((a, index) => `[Verse ${index + 1}]\n${a.lyrics.join("\n")}`)
    .join("\n\n");

  // Get genre suggestion based on all analyses
  const genreAnalysis = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content:
          `<lyrics>${lyricsString}</lyrics>\n\n` +
          "Based on these song lyrics, suggest a musical genre that would fit best.\n" +
          "IMPORTANT: Make the genre extremely specific, using several words to make it really interesting.",
      },
    ],
    model: "gpt-4o-mini",
    response_model: {
      schema: GenreAnalysisSchema,
      name: "GenreAnalysis",
    },
    max_tokens: 100,
  });

  // Validate the response using GameRoundSchema
  const gameRound = GameRoundSchema.parse({
    lyrics: lyricsString,
    genre: genreAnalysis.genre,
  });

  return gameRound;
};
