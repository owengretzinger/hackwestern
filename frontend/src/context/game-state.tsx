"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
}

export interface Verse {
  lyrics: string;
  image: string;
  author: string;
}

export interface Song {
  title: string;
  cover: string;
  verses: Verse[];
  genre: string;
  shortGenre: string;
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
  joinError: string | null; // Add this line
}

interface GameStateContextType {
  socket: Socket | null;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  updateGameState: (updates: Partial<GameState>) => void;
  joinGame: (nickname: string) => void;
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
  joinError: null, // Add this line
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

  const joinGame = (nickname: string) => {
    const playerId = Math.random().toString(36).substring(2, 7);
    console.log("joining game with nickname", nickname);
    updateGameState({
      playerId,
      nickname,
    }); // removed hasJoined: true from here

    const newSocket = io("https://hackwestern11main-91370a9c09b3.herokuapp.com/");
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
      console.log("my id:", playerId);
      console.log("lobby update", updatedPlayers);
      console.log("this player is host", currentPlayer?.isHost);
      updateGameState({
        players: updatedPlayers,
        isHost: currentPlayer?.isHost || false,
        hasJoined: true, // Set hasJoined here on successful lobby update
      });
    });

    newSocket.on("displaySong", (songData: Song) => {
      updateGameState({
        song: songData,
        isLoadingSong: false,
      });
    });

    // Add a listener for the "error" event
    newSocket.on("error", (errorMessage: string) => {
      console.log("Server error:", errorMessage);
      updateGameState({
        submitError: errorMessage,
        isSubmittingDrawing: false,
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
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
