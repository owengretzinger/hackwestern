"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
  walletAddress?: string;
}

export interface Verse {
  lyrics: string;
  image: string;
  author: string;
}

export interface Song {
  cover: string;
  verses: Verse[];
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
  joinError: string | null;
}

interface GameStateContextType {
  socket: Socket | null;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  updateGameState: (updates: Partial<GameState>) => void;
  joinGame: (nickname: string) => void;
  updateWallet: (address: string | undefined) => void;
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
  joinError: null,
};

export const useGameState = () => {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error("useGameState must be used within SocketProvider");
  return context;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  const updateWallet = (address: string | undefined) => {
    if (!socket || !gameState.playerId) return;
    
    // Find current player's wallet address
    const currentPlayer = gameState.players.find(p => p.id === gameState.playerId);
    const currentWalletAddress = currentPlayer?.walletAddress;
    
    // Only emit if the wallet address has actually changed
    if (currentWalletAddress !== address) {
      socket.emit("walletUpdate", {
        playerId: gameState.playerId,
        walletAddress: address,
      });
    }
  };

  const joinGame = (nickname: string) => {
    const playerId = Math.random().toString(36).substring(2, 7);
    updateGameState({
      playerId,
      nickname,
    });

    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinLobby", {
        playerId,
        nickname,
      });
    });

    newSocket.on("joinRejected", (reason: string) => {
      console.log("rejected");
      updateGameState({
        joinError: reason,
        hasJoined: false,
      });
      newSocket.disconnect();
      setSocket(null);
    });

    newSocket.on("lobbyUpdate", (updatedPlayers: Player[]) => {
      const currentPlayer = updatedPlayers.find((p) => p.id === playerId);
      updateGameState({
        players: updatedPlayers,
        isHost: currentPlayer?.isHost || false,
        hasJoined: true,
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
        joinGame,
        updateWallet,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
