"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
}

interface Song {
  lyrics: string;
  genre: string;
  url: string;
}

interface GameState {
  players: Player[];
  isHost: boolean;
  playerId: string | null;
  nickname: string;
  hasSubmittedDrawing: boolean;
  waitingForOthersToSubmit: boolean;
  isSubmittingDrawing: boolean;
  submitError: string | null;
  song: Song | null;
  isLoadingSong: boolean;
  allPlayersSubmitted: boolean;
  hasJoined: boolean;
}

interface GameStateContextType {
  socket: Socket | null;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  updateGameState: (updates: Partial<GameState>) => void;
  leaveLobby: () => void;
  joinGame: () => void;
}

const SocketContext = createContext<GameStateContextType | null>(null);

const initialGameState: GameState = {
  players: [],
  isHost: false,
  playerId: null,
  nickname: "",

  isSubmittingDrawing: false,
  hasSubmittedDrawing: false,
  waitingForOthersToSubmit: false,
  allPlayersSubmitted: false,
  submitError: null,

  isLoadingSong: true,
  song: null,
  hasJoined: false,
};

export const useGameState = () => {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error("useGameState must be used within SocketProvider");
  return context;
};

// Generate player ID and nickname
const shortId = Math.random().toString(36).substring(2, 7);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  const leaveLobby = () => {
    if (socket) {
      socket.emit("leaveLobby", { playerId: gameState.playerId });
      socket.disconnect();
      setSocket(null);
    }
    setGameState(initialGameState);
  };

  const joinGame = () => {
    const playerId = shortId; // Capture this before socket setup

    // Update state first
    updateGameState({
      playerId,
      nickname: `Player ${playerId}`,
      hasJoined: true,
    });

    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    // Use captured playerId in listeners
    newSocket.on("joinRejected", (reason: string) => {
      alert(reason);
      leaveLobby();
    });

    newSocket.on("lobbyUpdate", (updatedPlayers: Player[]) => {
      const currentPlayer = updatedPlayers.find((p) => p.id === playerId);
      console.log("my id:", playerId);
      console.log("lobby update", updatedPlayers);
      console.log("this player is host", currentPlayer?.isHost);
      updateGameState({
        players: updatedPlayers,
        isHost: currentPlayer?.isHost || false,
      });
    });

    newSocket.on("displaySong", (songData: Song) => {
      updateGameState({
        song: songData,
        isLoadingSong: false,
      });
    });

    newSocket.on("allDrawingsSubmitted", () => {
      console.log("all submitted");
      updateGameState({
        waitingForOthersToSubmit: false,
        allPlayersSubmitted: true,
      });
    });
  };

  useEffect(() => {
    return () => {
      if (socket) socket.close();
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        gameState,
        setGameState,
        updateGameState,
        leaveLobby,
        joinGame,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
