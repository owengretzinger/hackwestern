// src/providers/GameStateProvider.tsx
import { createContext, useState, useEffect } from "react";
import { GameState } from "@/types/game";
import { Socket } from "socket.io-client";
import { useGameConnection } from "@/hooks/use-game-connection";

interface GameStateContextType {
  socket: Socket | null;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  joinGame: (nickname: string) => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

const initialGameState: GameState = {
  playerId: null,
  nickname: "",
  hasJoined: false,
  players: [],
  isHost: false,
  song: null,
  isLoadingSong: false,
  hasSubmittedDrawing: false,
  isSubmittingDrawing: false,
  waitingForOthersToSubmit: false,
  allPlayersSubmitted: false,
  submitError: null,
  joinError: null,
};

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  const { socket, connect, disconnect } = useGameConnection(updateGameState);

  const joinGame = (nickname: string) => {
    if (socket) disconnect();
    connect(nickname);
  };

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return (
    <GameStateContext.Provider
      value={{
        socket,
        gameState,
        setGameState,
        updateGameState,
        joinGame,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}
