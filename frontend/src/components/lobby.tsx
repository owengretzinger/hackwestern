"use client";

import { useEffect, useState } from "react";
import { useGameState } from "@/context/game-state";
import { useRouter } from "next/navigation";
import { WalletConnect } from "./WalletConnect";
import { connect } from "starknetkit";

const Lobby = () => {
  const router = useRouter();
  const { gameState, socket, joinGame } = useGameState();
  const [nicknameInput, setNicknameInput] = useState("");
  const [address, setAddress] = useState<string>();

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
  }, [
    gameState.hasJoined,
    gameState.playerId,
    gameState.nickname,
    router,
    socket,
  ]);

  const handleCreateRoom = async () => {
    if (!address) {
      const result = await connect();
      if (result && result.wallet) {
        setAddress(result.wallet.account.address);
      } else {
        return;
      }
    }
    socket?.emit("create_room", { userAddress: address });
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!address) {
      const result = await connect();
      if (result && result.wallet) {
        setAddress(result.wallet.account.address);
      } else {
        return;
      }
    }
    socket?.emit("join_room", { roomId, userAddress: address });
    router.push(`/room/${roomId}`);
  };

  if (!gameState.hasJoined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold">Welcome to the Game</h2>
            <p className="mt-2 text-sm text-gray-600">Connect your wallet to start playing</p>
          </div>

          <div className="mt-8 space-y-6">
            <WalletConnect />
            
            {address && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  joinGame(nicknameInput);
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Your nickname"
                  required
                />
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Join Game
                </button>
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Room
                </button>
              </form>
            )}
          </div>
          
          {gameState.joinError && (
            <p className="text-red-500 mt-2 text-sm text-center">{gameState.joinError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
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
          <>
            <button
              onClick={() => socket?.emit("startGame")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={gameState.players.length < 2}
            >
              Start Game
            </button>
            {gameState.players.length < 2 && (
              <p className="text-sm text-center pt-2">
                Waiting for at least 1 more player
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Lobby;