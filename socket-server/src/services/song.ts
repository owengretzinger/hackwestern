export const generateSong = async (lyrics: string, genre: string) => {
  const response = await fetch(`${process.env.SONG_API}/createSong`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lyrics,
      genre,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create song");
  }

  const song = await response.json();
  if (song.status !== true) {
    throw new Error(song.error || "Failed to create song");
  }

  return song.songURL;
};
