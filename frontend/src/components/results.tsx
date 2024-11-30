"use client";

import { Song, useGameState, Verse } from "@/context/game-state";
import Image from "next/image";

export default function Results() {
  const { gameState } = useGameState();

  if (gameState.isLoadingSong) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">
          {gameState.allPlayersSubmitted
            ? "Processing drawings..."
            : "Waiting for others..."}
        </p>
      </div>
    );
  }

  if (!gameState.song) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-500">
          Failed to load results. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <SongCard song={gameState.song} />
        <div className="flex flex-col gap-6">
          {gameState.song.verses.map((verse, index) => (
            <VerseDisplay key={index} index={index} verse={verse} />
          ))}
        </div>
      </div>
    </div>
  );
}

const SongCard = ({ song }: { song: Song }) => {
  return (
    <div className="flex items-center">
      <div className="flex gap-4 items-center">
        <div className="w-[150px] h-[150px] bg-red-400 rounded-lg aspect-square shadow-lg">
          <Image
            src={song.cover}
            alt="Generated song image"
            width={1000}
            height={1000}
            className="object-cover rounded-lg w-full h-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">Song Title</h2>
            <p className="text-gray-600">{song.genre}</p>
          </div>
          <audio src={song.url} controls className="" />
        </div>
      </div>
      <div className=""></div>
    </div>
  );
};

const VerseDisplay = ({ verse, index }: { verse: Verse; index: number }) => {
  return (
    <div className="flex gap-4">
      <div className="w-[200px] h-[200px] aspect-square border border-gray-400 rounded-lg shadow-md flex justify-center items-center">
        <Image
          src={verse.image}
          alt="Generated verse image"
          width={300}
          height={300}
          className="object-contain rounded-lg max-w-full max-h-full"
        />
      </div>
      <div className="flex flex-col">
        <h3 className="font-bold">
          Verse {index + 1} ({verse.author})
        </h3>
        <p className="whitespace-pre-wrap">{verse.lyrics}</p>
      </div>
    </div>
  );
};
