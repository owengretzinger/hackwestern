"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/socket-context";

interface Song {
  lyrics: string;
  genre: string;
}

export default function ResultsPage() {
  const socket = useSocket();
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("displaySong", (songData: Song) => {
      setSong(songData);
    });

    return () => {
      socket.off("displaySong");
    };
  }, [socket]);

  if (!song) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Waiting for results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Your Generated Song</h1>
        <div className="mb-4">
          <span className="text-gray-600 text-lg">Genre: </span>
          <span className="font-semibold">{song.genre}</span>
        </div>
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-lg">{song.lyrics}</pre>
        </div>
      </div>
    </div>
  );
}
