import { useMutation } from "@tanstack/react-query";
import { submitImageToAI } from "./images";

export const createSongFromDrawing = async (images: string[]) => {
  // First analyze the images
  const analysis = await submitImageToAI(images);

  // Create song prompt from analysis
  const lyrics = analysis.drawings
    .map((d, index) => `[Verse ${index + 1}]\n${d.lyrics}`)
    .join("\n");
  const genre = analysis.genre;

  console.log(lyrics);

  // Create the song
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_NGROK_URL}/createSong`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lyrics: lyrics, genre: genre }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create song");
  }

  return response.json();
};

export const useCreateSongFromDrawing = () => {
  return useMutation({
    mutationKey: ["create-song-from-drawing"],
    mutationFn: createSongFromDrawing,
  });
};
