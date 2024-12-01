"use client";

import { Song, useGameState, Verse } from "@/context/game-state";
import {
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  TriangleAlertIcon,
} from "lucide-react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

export default function Results() {
  const { gameState } = useGameState();

  if (gameState.isLoadingSong && !gameState.submitError) {
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

  if (gameState.submitError || !gameState.song) {
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
    <div className="p-6 sm:p-8">
      <div className="max-w-sm sm:max-w-xl my-20 mx-auto flex flex-col gap-12 md:max-w-none md:flex-row-reverse">
        <SongCard song={gameState.song} />
        <div className="flex justify-center w-full lg:justify-center">
          <div className="flex flex-col gap-12 items-center sm:items-start w-full lg:w-fit">
            {gameState.song.verses.map((verse, index) => (
              <VerseDisplay key={index} index={index} verse={verse} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SongCard = ({ song }: { song: Song }) => {
  return (
    <Card className="flex flex-col items-center border-none shadow-none gap-4">
      <div className="w-[200px] lg:w-[360px] rounded-lg aspect-square shadow-lg border">
        <Image
          src={song.cover}
          alt="Generated song image"
          width={512}
          height={512}
          className="object-contain rounded-lg min-w-full h-full"
        />
      </div>
      <div className="w-full flex flex-col">
        <div className="relative flex flex-col gap-1">
          <CardTitle>{song.title}</CardTitle>
          <CardDescription>
            Inspired by drawings from{" "}
            {song.verses.map((verse) => verse.author).join(", ")}
          </CardDescription>
          <Badge className="whitespace-nowrap">{song.shortGenre}</Badge>
        </div>
      </div>
      <Audio src={song.url} />
    </Card>
  );
};

const VerseDisplay = ({ verse, index }: { verse: Verse; index: number }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-[200px] sm:h-[200px] lg:w-[256px] lg:h-[256px] aspect-square border rounded-lg bg-white shadow-md flex justify-center items-center self-center">
        <Image
          src={verse.image}
          alt="Generated verse image"
          width={300}
          height={300}
          className="object-contain rounded-lg w-full max-h-full aspect-square"
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

const Audio = ({ src }: { src: string }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlayable, setIsPlayable] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const shouldEnable =
        (audioRef.current && audioRef.current.duration > 0) || false;
      console.log("Can enable audio:", shouldEnable);
      setIsPlayable(shouldEnable);

      if (!isPlayable) {
        setKey((prev) => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [audioRef.current?.duration, isPlayable]);

  const togglePlay = () => {
    if (audioRef.current && isPlayable) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleSliderChange = (value: number) => {
    if (audioRef.current) {
      const time = (value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value);
    }
  };

  const downloadAudio = async () => {
    if (src) {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audio.mp3"; // you can set the file name here
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-full" key={key}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
      />

      <div
        className={`flex items-center gap-1 ${
          isPlayable ? "" : "opacity-25 pointer-events-none"
        }`}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          className="aspect-square"
          disabled={!isPlayable}
        >
          {playing ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
        </Button>
        <div className="min-w-[70px] text-xs text-muted-foreground text-center">
          {!isPlayable
            ? "0:00 / 0:00"
            : audioRef.current
            ? `${Math.floor(audioRef.current.currentTime / 60)}:${Math.floor(
                audioRef.current.currentTime % 60
              )
                .toString()
                .padStart(2, "0")} / ${Math.floor(
                audioRef.current.duration / 60
              )}:${Math.floor(audioRef.current.duration % 60)
                .toString()
                .padStart(2, "0")}`
            : "0:00 / 0:00"}
        </div>
        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={(value) => handleSliderChange(value[0])}
          className="w-full flex-shrink mr-2"
          disabled={!isPlayable}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={downloadAudio}
          className="aspect-square"
          disabled={!isPlayable}
        >
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </div>
      {isPlayable && (
        <p className="text-xs text-destructive mt-2">{!isPlayable}</p>
      )}
    </div>
  );
};
