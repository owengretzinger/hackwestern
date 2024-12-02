import OpenAI from "openai";
import Instructor from "@instructor-ai/instructor";
import {
  DescriptionsAndLyricsSchema,
  TitleAndGenreSchema,
} from "../types/schemas";
import { DrawingSubmission } from "../types/interfaces";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = Instructor({
  client: openai,
  mode: "FUNCTIONS",
});

export const generateDescriptionsAndLyrics = async (
  submission: DrawingSubmission
) => {
  const analysis = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "You are an expert at identifying poorly drawn images and writing epic song lyrics about them. " +
              "First, identify the image and describe it in 3-6 words. " +
              "Then, write exactly 4 sick lines of rap lyrics about the drawing." +
              "Give the lyrics the 'wow' factor.",
          },
          {
            type: "image_url",
            image_url: { url: submission.imageData },
          },
        ],
      },
    ],
    model: "gpt-4o-mini",
    response_model: {
      schema: DescriptionsAndLyricsSchema,
      name: "DescriptionsAndLyrics",
    },
    max_tokens: 1000,
  });
  return analysis;
};

export const generateTitleAndGenre = async (lyricsString: string) => {
  return await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content:
          `<lyrics>${lyricsString}</lyrics>\n\n` +
          "Based on these song lyrics, suggest two versions of a hip-hop genre that would fit best:\n" +
          "1. A detailed, specific genre using several descriptive words\n" +
          "2. A short, concise 1-3 word version of the same genre\n" +
          "IMPORTANT: the genre should be a sub-genre of hip-hop. " +
          "Not whimsical or folk or children's music or quirky.\n" +
          "IMPORTANT: Also provide a title for the song based on the lyrics.",
      },
    ],
    model: "gpt-4o-mini",
    response_model: {
      schema: TitleAndGenreSchema,
      name: "TitleAndGenre",
    },
    max_tokens: 150,
  });
};

export const generateCoverArt = async (descriptions: string) => {
  return await openai.images.generate({
    model: "dall-e-3",
    prompt:
      `<descriptions>${descriptions}</descriptions>\n\n` +
      "Based on these descriptions of pictures that were drawn, create album cover art." +
      "IMPORTANT: Base the cover art on a couple of the descriptions.",
    n: 1,
    size: "1024x1024",
  });
};
