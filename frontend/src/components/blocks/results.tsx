"use client";

import { Song, useGameState, Verse } from "@/context/game-state";
import { TriangleAlertIcon } from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function Results() {
  const { gameState } = useGameState();

  if (gameState.isLoadingSong) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2  ">
        <div className="flex gap-2">
          <div className="h-4 animate-bounce [animation-delay:-0.3s]">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
          <div className="h-4 animate-bounce [animation-delay:-0.15s]">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
          <div className="h-4 animate-bounce">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          </div>
        </div>
        <p className="font-semibold leading-none tracking-tight">
          {gameState.allPlayersSubmitted
            ? "Processing your masterpiece"
            : "Waiting for others to finish drawing"}
        </p>
      </div>
    );
  }

  if (!gameState.song) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-destructive">
          <TriangleAlertIcon className="h-5 w-5" />
          <p className="font-semibold leading-none tracking-tight">
            Failed to load results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl my-20 mx-auto flex flex-col gap-12">
        <SongCard song={gameState.song} />
        <div className="flex flex-col gap-12 items-center sm:items-start">
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
    <Card className="flex flex-col sm:flex-row items-center border-none shadow-none">
      <div className="w-[150px] h-[150px] rounded-lg aspect-square shadow-lg">
        <Image
          src={song.cover}
          alt="Generated song image"
          width={150}
          height={150}
          className="object-cover rounded-lg w-[150px] h-full"
        />
      </div>
      <div>
        <CardHeader>
          <CardTitle>Song Title</CardTitle>
          <CardDescription>{song.genre}</CardDescription>
        </CardHeader>
        <CardContent>
          <audio src={song.url} controls className="" />
        </CardContent>
      </div>
    </Card>
  );
};

const VerseDisplay = ({ verse, index }: { verse: Verse; index: number }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
      <div className="w-full sm:w-[200px] sm:h-[200px] aspect-square border rounded-lg bg-white shadow-md flex justify-center items-center self-center">
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
