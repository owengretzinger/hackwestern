"use client";

import { useEffect, useState } from "react";
import { useSocket } from '@/context/socket-context';
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
}

const Lobby = () => {
  const socket = useSocket();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    // Generate a shorter, more readable ID for testing
    const shortId = Math.random().toString(36).substring(2, 7);
    setPlayerId(shortId);
    setNickname(`Player ${shortId}`);
  }, []);

  useEffect(() => {
    if (!playerId || !socket) return;

    socket.emit("joinLobby", { playerId, nickname });

    socket.on("lobbyUpdate", (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
      const isPlayerHost = updatedPlayers[0]?.id === playerId;
      setIsHost(isPlayerHost);
    });

    socket.on("gameStarted", () => {
      router.push("/draw");
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("gameStarted");
    };
  }, [playerId, nickname, router, socket]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Game Lobby</h1>
        <div className="mb-4">
          <p className="text-gray-600">Your ID: {playerId || "Loading..."}</p>
          <p className="text-gray-600">Nickname: {nickname}</p>
          {isHost && (
            <p className="text-green-600 font-semibold">You are the host</p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Players in Lobby:</h2>
          <ul className="space-y-2">
            {players.map((player) => (
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

        {isHost && (
          <button
            onClick={() => socket?.emit("startGame")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            disabled={players.length < 2}
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
};

export default Lobby;
