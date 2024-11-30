import { useMutation } from "@tanstack/react-query";
import { submitImageToAI } from "./images";

export const createSongFromDrawing = async (images: string[]) => {
  const { lyrics, genre } = await submitImageToAI(images);

  console.log(lyrics);
  console.log("Genre:", genre);

  return { lyrics, genre };

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
