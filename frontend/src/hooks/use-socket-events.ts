// src/hooks/useSocketEvents.ts
import { useCallback } from "react";
import { Socket } from "socket.io-client";
import { GameState, Player, Song } from "@/types/game";

interface SocketEventHandlers {
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
  onJoinRejected: (reason: string) => void;
  onLobbyUpdate: (players: Player[]) => void;
  onDisplaySong: (song: Song) => void;
  onAllDrawingsSubmitted: () => void;
}

export const useSocketEvents = (
  socket: Socket | null,
  updateGameState: (updates: Partial<GameState>) => void,
  playerId: string | null
) => {
  const handleConnect = useCallback(() => {
    if (!playerId || !socket) return;

    socket.emit("joinLobby", {
      playerId,
      nickname: (socket.auth as { nickname: string })?.nickname,
    });
  }, [playerId, socket]);

  const handleDisconnect = useCallback(() => {
    updateGameState({
      hasJoined: false,
      players: [],
      isHost: false,
    });
  }, [updateGameState]);

  const handleError = useCallback(
    (error: string) => {
      console.error("Socket error:", error);
      updateGameState({
        submitError: error,
        isSubmittingDrawing: false,
      });
    },
    [updateGameState]
  );

  const handleJoinRejected = useCallback(
    (reason: string) => {
      console.log("Join rejected:", reason);
      updateGameState({
        joinError: reason,
        hasJoined: false,
      });
    },
    [updateGameState]
  );

  const handleLobbyUpdate = useCallback(
    (updatedPlayers: Player[]) => {
      if (!playerId) return;

      const currentPlayer = updatedPlayers.find((p) => p.id === playerId);
      console.log("Lobby update:", {
        playerId,
        players: updatedPlayers,
        isHost: currentPlayer?.isHost,
      });

      updateGameState({
        players: updatedPlayers,
        isHost: currentPlayer?.isHost || false,
        hasJoined: true,
      });
    },
    [playerId, updateGameState]
  );

  const handleDisplaySong = useCallback(
    (songData: Song) => {
      updateGameState({
        song: songData,
        isLoadingSong: false,
      });
    },
    [updateGameState]
  );

  const handleAllDrawingsSubmitted = useCallback(() => {
    console.log("All drawings submitted");
    updateGameState({
      waitingForOthersToSubmit: false,
      allPlayersSubmitted: true,
    });
  }, [updateGameState]);

  const setupEventListeners = useCallback(
    (socket: Socket) => {
      const handlers: SocketEventHandlers = {
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleError,
        onJoinRejected: handleJoinRejected,
        onLobbyUpdate: handleLobbyUpdate,
        onDisplaySong: handleDisplaySong,
        onAllDrawingsSubmitted: handleAllDrawingsSubmitted,
      };

      socket.on("connect", handlers.onConnect);
      socket.on("disconnect", handlers.onDisconnect);
      socket.on("error", handlers.onError);
      socket.on("joinRejected", handlers.onJoinRejected);
      socket.on("lobbyUpdate", handlers.onLobbyUpdate);
      socket.on("displaySong", handlers.onDisplaySong);
      socket.on("allDrawingsSubmitted", handlers.onAllDrawingsSubmitted);

      return () => {
        socket.off("connect", handlers.onConnect);
        socket.off("disconnect", handlers.onDisconnect);
        socket.off("error", handlers.onError);
        socket.off("joinRejected", handlers.onJoinRejected);
        socket.off("lobbyUpdate", handlers.onLobbyUpdate);
        socket.off("displaySong", handlers.onDisplaySong);
        socket.off("allDrawingsSubmitted", handlers.onAllDrawingsSubmitted);
      };
    },
    [
      handleConnect,
      handleDisconnect,
      handleError,
      handleJoinRejected,
      handleLobbyUpdate,
      handleDisplaySong,
      handleAllDrawingsSubmitted,
    ]
  );

  const emitDrawingSubmitted = useCallback(
    (imageData: string) => {
      if (!socket) return;
      socket.emit("submitDrawing", imageData);
      updateGameState({
        isSubmittingDrawing: true,
        hasSubmittedDrawing: true,
        waitingForOthersToSubmit: true,
      });
    },
    [socket, updateGameState]
  );

  const emitStartGame = useCallback(() => {
    if (!socket) return;
    socket.emit("startGame");
  }, [socket]);

  return {
    setupEventListeners,
    emitDrawingSubmitted,
    emitStartGame,
  };
};
