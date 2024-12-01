"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameState } from "@/context/game-state";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Check } from "lucide-react";

const Admin = () => {
  const { gameState } = useGameState();
  const router = useRouter();

  useEffect(() => {
    if (gameState.song) {
      router.push("/results");
    }
  }, [gameState.song, router]);

  return (
    <div className="min-h-screen w-full flex justify-center items-center p-16">
      <div className="grid grid-cols-1 min-[860px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-4 w-full max-w-6xl">
        {gameState.players.map((player) => {
          const drawing = gameState.drawings.find(
            (d) => d.playerId === player.id
          );
          const hasSubmitted = drawing?.submitted;
          return (
            <div
              className="w-full h-full flex justify-center items-center"
              key={player.id}
            >
              <Card
                key={player.id}
                className={`relative w-fit ${
                  hasSubmitted ? "border-green-500 border-2" : ""
                }`}
              >
                {hasSubmitted && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{player.nickname}&apos;s drawing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-[300px] h-[300px] aspect-square border rounded-lg bg-white shadow-md">
                    {drawing ? (
                      <Image
                        src={drawing.imageData}
                        alt={`${player.nickname}'s drawing`}
                        width={300}
                        height={300}
                        className="object-contain rounded-lg w-full max-h-full aspect-square"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Waiting for drawing...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;
