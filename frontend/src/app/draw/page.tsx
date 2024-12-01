"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameState } from "@/context/game-state";
import Whiteboard from "@/components/blocks/whiteboard";

export default function DrawPage() {
  const router = useRouter();
  const { gameState } = useGameState();

  useEffect(() => {
    // Redirect to results when song is ready
    if (gameState.allPlayersSubmitted && !gameState.isLoadingSong && gameState.song) {
      router.push("/results");
    }
  }, [gameState.allPlayersSubmitted, gameState.isLoadingSong, gameState.song, router]);

  return <Whiteboard />;
}
