// src/hooks/useGameConnection.ts
import { useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { GameState } from "@/types/game";
import { useSocketEvents } from "./use-socket-events";
import { generatePlayerId } from "@/lib/game-utils";

export const useGameConnection = (
  updateGameState: (updates: Partial<GameState>) => void
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const { setupEventListeners } = useSocketEvents(
    socket,
    updateGameState,
    playerId
  );

  const connect = useCallback(
    (nickname: string) => {
      const newPlayerId = generatePlayerId();
      const newSocket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
        { auth: { nickname } }
      );

      setPlayerId(newPlayerId);
      updateGameState({ playerId: newPlayerId, nickname });
      setSocket(newSocket);
      setupEventListeners(newSocket);
    },
    [updateGameState, setupEventListeners]
  );

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return { socket, connect, disconnect };
};
