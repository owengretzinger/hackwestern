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
    console.log(`Join lobby attempt - Player: ${nickname}, ID: ${playerId}`);

    if (nickname === "7890") {
      gameState.setAdmin(socket.id);
      socket.emit("adminJoined");
      io.emit("lobbyUpdate", gameState.getPlayers());
      console.log("Admin joined");
      return;
    }

    if (gameState.isGameInProgress()) {
      console.log(`Join rejected - Game in progress`);
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
    console.log(`Game start attempted by socket: ${socket.id}`);
    if (gameState.isAdmin(socket.id)) {
      console.log("Game started by admin");
      gameState.startGame();
      io.emit("gameStarted");
    } else {
      console.log("Non-admin attempted to start game");
    }
  };

  const handleDisconnect = (socket: Socket) => {
    const disconnectedPlayer = gameState.removePlayer(socket.id);
    io.emit("lobbyUpdate", gameState.getPlayers());
    console.log(`Player disconnected: ${disconnectedPlayer?.nickname}`);
  };

  const handleSubmitDrawing = async (socket: Socket, imageData: string) => {
    try {
      console.log(`Drawing submission received from socket: ${socket.id}`);
      const player = gameState.findPlayerBySocketId(socket.id);
      if (!player) {
        console.log("Drawing submission rejected - player not found");
        return;
      }

      gameState.addDrawingSubmission({
        playerId: player.id,
        nickname: player.nickname,
        imageData: imageData,
      });

      const adminSocketId = gameState.getAdminSocketId();
      if (adminSocketId) {
        io.to(adminSocketId).emit("drawingSubmitted", {
          playerId: player.id,
          nickname: player.nickname,
          imageData: imageData,
        });
      }

      gameState.setPlayerSubmitted(socket.id);
      socket.emit("drawingProcessed");

      if (!gameState.getPlayers().every((p) => p.hasSubmitted)) {
        console.log(
          `Waiting for ${
            gameState.getPlayers().filter((p) => !p.hasSubmitted).length
          } more submissions`
        );
        return;
      }

      console.log("All drawings submitted, starting AI generation...");
      io.emit("allDrawingsSubmitted");

      // Process drawings
      console.log("Generating descriptions and lyrics...");
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

      console.log("Descriptions:", descriptions);
      console.log("Lyrics:", lyricsString);

      console.log("Starting cover art generation...");
      // const imageResponse = generateCoverArt(descriptions);
      const imageResponse = Promise.resolve({
        data: [
          {
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE-evVoCbHwvc7LgNjNqqqmlV4jkgX6lKW8Q&s",
          },
        ],
      });

      console.log("Generating title and genre...");
      const { title, genre, shortGenre } = await generateTitleAndGenre(
        lyricsString
      );

      console.log("Generating song...");
      const songURL =
        "https://cdn1.suno.ai/7e87ed30-23b9-404d-aa30-75881cd57c04.mp3";
      // const songURL = await generateSong(lyricsString, genre);

      console.log("Song generation complete:", {
        title,
        genre,
        shortGenre,
        songURL,
      });

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

        // console log song data other than image data
        const songDataNoImage = {
          ...songData,
          cover: "image data",
          verses: songData.verses.map((verse) => ({
            ...verse,
            image: "image data",
          })),
        };
        console.log("Song data:", songDataNoImage);

        io.emit("displaySong", songData);
      } catch (error) {
        console.error("Error validating song data:", error);
        socket.emit("error", "Failed to validate song data");
      }
    } catch (error) {
      console.error("Error processing drawing:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "");
      socket.emit("error", "Failed to process drawing");
    }
  };

  const handleKickEveryone = (socket: Socket) => {
    console.log("handle kick everyone");
    if (gameState.isAdmin(socket.id)) {
      console.log("kicking everyone");
      const players = gameState.getPlayers();
      players.forEach((player) => {
        if (!gameState.isAdmin(player.socketId)) {
          console.log("kicking player", player.nickname);
          io.to(player.socketId).emit("kicked");
        }
      });
      gameState.removeAllPlayers();
      io.emit("lobbyUpdate", gameState.getPlayers());
    }
  };

  return {
    handleJoinLobby,
    handleDrawingSubmitted,
    handleStartGame,
    handleDisconnect,
    handleSubmitDrawing,
    handleKickEveryone,
  };
};
