"use client";

import { useEffect } from "react";
import { useGameState } from "@/context/game-state";
import { useRouter } from "next/navigation";

const Lobby = () => {
  const { socket, gameState } = useGameState();
  const router = useRouter();

  useEffect(() => {
    if (!gameState.playerId || !socket) return;

    socket.emit("joinLobby", { 
      playerId: gameState.playerId, 
      nickname: gameState.nickname 
    });

    socket.on("gameStarted", () => {
      router.push("/draw");
    });

    return () => {
      socket.off("gameStarted");
    };
  }, [gameState.playerId, gameState.nickname, router, socket]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Game Lobby</h1>
        <div className="mb-4">
          <p className="text-gray-600">Your ID: {gameState.playerId || "Loading..."}</p>
          <p className="text-gray-600">Nickname: {gameState.nickname}</p>
          {gameState.isHost && (
            <p className="text-green-600 font-semibold">You are the host</p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Players in Lobby:</h2>
          <ul className="space-y-2">
            {gameState.players.map((player) => (
              <li
                key={player.id}
                className="p-2 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <span>{player.nickname || player.id}</span>
                {player.isHost && (
                  <span className="text-sm text-green-600">Host</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {gameState.isHost && (
          <button
            onClick={() => socket?.emit("startGame")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            disabled={gameState.players.length < 2}
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
};

export default Lobby;
