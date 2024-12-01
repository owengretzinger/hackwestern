"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: string;
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
  isAdmin: boolean;
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
  submittedDrawings: Array<{
    playerId: string;
    nickname: string;
    imageData: string;
  }>;
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
  playerId: null,
  nickname: "",
  isAdmin: false,

  isSubmittingDrawing: false,
  hasSubmittedDrawing: false,
  waitingForOthersToSubmit: false,
  allPlayersSubmitted: false,
  submitError: null,

  isLoadingSong: true,
  song: null,
  hasJoined: false,
  joinError: null, // Add this line
  submittedDrawings: [],
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

    const newSocket = io(
      // "https://hackwestern11controller-88dfdd62efd5.herokuapp.com", // Change to wss:// protocol
      // "https://9199-129-100-255-24.ngrok-free.app/",
      "http://localhost:3001",
      {
        transports: ["websocket"], // Remove polling to prevent transport switching
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
        secure: true,
        rejectUnauthorized: false,
        autoConnect: true,
      }
    );

    // Add reconnection handling
    let reconnectAttempts = 0;
    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reconnectAttempts < 5) {
        reconnectAttempts++;
        setTimeout(() => newSocket.connect(), 1000);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      updateGameState({
        joinError: "Failed to connect to server",
        hasJoined: false,
      });
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinLobby", {
        playerId,
        nickname,
      });
    });

    newSocket.on("adminJoined", () => {
      console.log("admin joined");
      updateGameState({
        isAdmin: true,
        hasJoined: true,
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
      console.log("my id:", playerId);
      console.log("lobby update", updatedPlayers);
      updateGameState({
        players: updatedPlayers,
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

    newSocket.on(
      "drawingSubmitted",
      (drawing: { playerId: string; nickname: string; imageData: string }) => {
        console.log("drawing submitted", drawing.nickname);
        setGameState((prev: GameState) => ({
          ...prev,
          submittedDrawings: [...prev.submittedDrawings, drawing],
        }));
      }
    );
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
