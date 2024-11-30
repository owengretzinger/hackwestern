"use client";

import { useEffect } from "react";
import { useGameState } from "@/context/game-state";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";

const Lobby = () => {
  const { socket, gameState } = useGameState();
  const router = useRouter();

  useEffect(() => {
    if (!gameState.hasJoined || !gameState.playerId || !socket) {
      router.push("/");
      return;
    }

    socket.emit("joinLobby", {
      playerId: gameState.playerId,
      nickname: gameState.nickname,
    });

    socket.on("gameStarted", () => {
      router.push("/draw");
    });

    return () => {
      socket.off("gameStarted");
    };
  }, [
    gameState.hasJoined,
    gameState.playerId,
    gameState.nickname,
    router,
    socket,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Lobby</CardTitle>
          <CardDescription>
            {gameState.isHost
              ? "Start once you're ready!"
              : "Waiting for the host to start the game..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-6">
            <div className="flex flex-col space-y-1.5">
              <Label>Your Details</Label>
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-sm text-muted-foreground">
                  ID: {gameState.playerId || "Loading..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Nickname: {gameState.nickname}
                </p>
                {gameState.isHost && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                    You are the host
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label>Players in Lobby</Label>
              <div className="space-y-2">
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className="p-3 bg-muted rounded-lg flex justify-between items-center"
                  >
                    <span className="text-sm">
                      {player.nickname || player.id}
                    </span>
                    {player.isHost && (
                      <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        {gameState.isHost && (
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={() => socket?.emit("startGame")}
              className="w-full"
              disabled={gameState.players.length < 2}
            >
              Start Game
            </Button>
            {gameState.players.length < 2 && (
              <p className="text-sm text-muted-foreground">
                Waiting for at least 1 more player
              </p>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Lobby;
