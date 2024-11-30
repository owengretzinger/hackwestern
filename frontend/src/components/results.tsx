"use client";

import { useGameState } from "@/context/game-state";

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
    <div className="fixed inset-0 z-20 bg-white bg-opacity-90 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Your Song</h2>
        <p className="text-gray-600 mb-4">Genre: {gameState.song.genre}</p>
        <div className="whitespace-pre-wrap">{gameState.song.lyrics}</div>
        <audio src={gameState.song.url} controls className="mt-4" />
        <p>{gameState.song.url}</p>
      </div>
    </div>
  );
}
