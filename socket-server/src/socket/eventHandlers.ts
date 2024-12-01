import { Server, Socket } from "socket.io";
import { SongSchema } from "../types/schemas";
import { Player, DrawingSubmission } from "../types/interfaces";
import {
  generateDescriptionsAndLyrics,
  generateTitleAndGenre,
  generateCoverArt,
} from "../services/openai";
import { generateSong } from "../services/song";
import { GameState } from "./gameState";

export const createEventHandlers = (io: Server, gameState: GameState) => {
  const handleJoinLobby = (
    socket: Socket,
    { playerId, nickname }: { playerId: string; nickname: string }
  ) => {
    if (gameState.isGameInProgress()) {
      socket.emit("joinRejected", "Game is already in progress");
      return;
    }

    const newPlayer: Player = {
      id: playerId,
      isHost: false, // Initial value, will be set in addPlayer
      nickname,
      socketId: socket.id,
    };

    gameState.addPlayer(newPlayer);

    io.emit(
      "lobbyUpdate",
      gameState.getPlayers().map((p) => ({
        id: p.id,
        isHost: p.isHost,
        nickname: p.nickname,
      }))
    );

    console.log("Player joined:", newPlayer);
    console.log(
      `Lobby status: ${gameState.getPlayers().length} players connected`
    );
  };

  const handleDrawingSubmitted = (socket: Socket) => {
    const player = gameState.findPlayerBySocketId(socket.id);
    if (player) {
      gameState.setPlayerSubmitted(socket.id);
      if (gameState.getPlayers().every((p) => p.hasSubmitted)) {
        io.emit("allDrawingsSubmitted");
      }
    }
  };

  const handleStartGame = (socket: Socket) => {
    const player = gameState.findPlayerBySocketId(socket.id);
    if (player?.isHost) {
      gameState.startGame();
      io.emit("gameStarted");
    }
  };

  const handleDisconnect = (socket: Socket) => {
    const disconnectedPlayer = gameState.removePlayer(socket.id);
    io.emit("lobbyUpdate", gameState.getPlayers());
    console.log(`Player disconnected: ${disconnectedPlayer?.nickname}`);
  };

  const handleSubmitDrawing = async (socket: Socket, imageData: string) => {
    try {
      const player = gameState.findPlayerBySocketId(socket.id);
      if (!player) return;

      gameState.addDrawingSubmission({
        playerId: player.id,
        nickname: player.nickname,
        imageData: imageData,
      });

      gameState.setPlayerSubmitted(socket.id);
      socket.emit("drawingProcessed");

      if (!gameState.getPlayers().every((p) => p.hasSubmitted)) return;

      io.emit("allDrawingsSubmitted");

      // Process drawings
      await Promise.all(
        gameState.getDrawingSubmissions().map(async (submission) => {
          const analysis = await generateDescriptionsAndLyrics(submission);
          submission.lyrics = analysis.lyrics;
          submission.description = analysis.description;
        })
      );

      const lyricsString = gameState
        .getDrawingSubmissions()
        .map((submission) => submission.lyrics?.join("\n"))
        .join("\n\n");

      const descriptions = gameState
        .getDrawingSubmissions()
        .map((submission) => submission.description)
        .join(", ");

      // Don't await so it doesn't block other things. We don't need it until later.
      // const imageResponse = generateCoverArt(descriptions);
      const imageResponse = Promise.resolve({
        data: [
          {
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE-evVoCbHwvc7LgNjNqqqmlV4jkgX6lKW8Q&s",
          },
        ],
      });

      const { title, genre, shortGenre } = await generateTitleAndGenre(
        lyricsString
      );

      const songURL =
        "https://cdn1.suno.ai/7e87ed30-23b9-404d-aa30-75881cd57c04.mp3";
      //   const songURL = await generateSong(lyricsString, genreAnalysis.genre);

      const coverImageUrl = (await imageResponse).data[0].url;

      try {
        const songData = SongSchema.parse({
          cover: coverImageUrl,
          verses: gameState.getDrawingSubmissions().map((submission) => ({
            author: submission.nickname,
            lyrics: submission.lyrics?.join("\n") || "",
            image: submission.imageData,
          })),
          genre,
          shortGenre,
          title,
          url: songURL,
        });

        io.emit("displaySong", songData);
      } catch (error) {
        console.error("Error validating song data:", error);
        socket.emit("error", "Failed to validate song data");
      }
    } catch (error) {
      console.error("Error processing drawing:", error);
      socket.emit("error", "Failed to process drawing");
    }
  };

  return {
    handleJoinLobby,
    handleDrawingSubmitted,
    handleStartGame,
    handleDisconnect,
    handleSubmitDrawing,
  };
};
