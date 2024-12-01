"use client";

import { useGameState } from "@/context/game-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const Lobby = () => {
  const router = useRouter();
  const { gameState, socket } = useGameState();

  useEffect(() => {
    if (!gameState.hasJoined || !gameState.playerId || !socket) return;

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
  }, [gameState.hasJoined, gameState.playerId, gameState.nickname, router, socket]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Lobby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Players List */}
          <div className="space-y-2">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <span>{player.nickname}</span>
                  {player.isHost && (
                    <span className="text-green-600 text-sm">Host</span>
                  )}
                  {player.walletAddress && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </div>
                {player.id === gameState.playerId && <WalletConnect />}
              </div>
            ))}
          </div>

          {/* Start Game Button */}
          {gameState.isHost && (
            <div className="space-y-2">
              <Button
                onClick={() => socket?.emit("startGame")}
                className="w-full"
                disabled={gameState.players.length < 2}
                variant="default"
              >
                Start Game
              </Button>
              {gameState.players.length < 2 && (
                <p className="text-sm text-center text-muted-foreground">
                  Waiting for at least 1 more player
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Lobby;
