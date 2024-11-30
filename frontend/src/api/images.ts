import { useMutation } from "@tanstack/react-query";
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
  identification: z
    .string()
    .describe("A clear description of what the drawing appears to be"),
  lyrics: z
    .array(z.string().max(80))
    .min(4)
    .max(4)
    .describe("A 4-line song about the drawing"),
});

// Define the schema for the game round
const GameRoundSchema = z.object({
  drawings: z
    .array(DrawingAnalysisSchema)
    .min(1)
    .describe("Analysis for all drawings"),
});

type GameRoundResponse = z.infer<typeof GameRoundSchema>;

// Update the submitImageToAI function
export const submitImageToAI = async (
  images: string[]
): Promise<GameRoundResponse> => {
  const analyses = await Promise.all(
    images.map(async (image) => {
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

  // Validate the response using GameRoundSchema
  const gameRound = GameRoundSchema.parse({ drawings: analyses });

  return gameRound;
};

export const useSubmitImage = () => {
  return useMutation({
    mutationKey: ["submit-images"],
    mutationFn: submitImageToAI,
  });
};
