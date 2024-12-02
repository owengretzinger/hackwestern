import { z } from "zod";

export const DescriptionsAndLyricsSchema = z.object({
  description: z.string(),
  lyrics: z.array(z.string()).min(4).max(4),
});

export const TitleAndGenreSchema = z.object({
  genre: z.string(),
  shortGenre: z.string().max(20),
  title: z.string(),
});

export const SongSchema = z.object({
  cover: z.string(),
  verses: z.array(
    z.object({
      author: z.string(),
      lyrics: z.string(),
      image: z.string(),
    })
  ),
  genre: z.string(),
  shortGenre: z.string(),
  title: z.string(),
  url: z.string(),
});
