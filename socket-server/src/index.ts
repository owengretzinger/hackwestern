import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import OpenAI from "openai";
import Instructor from "@instructor-ai/instructor";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Verify API key is present
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = Instructor({
  client: openai,
  mode: "FUNCTIONS",
});

const DrawingAnalysisSchema = z.object({
  lyrics: z
    .array(z.string().max(80))
    .min(4)
    .max(4)
    .describe("A 4-line verse of a song about the drawing"),
});

const GenreAnalysisSchema = z.object({
  genre: z
    .string()
    .describe("The most fitting musical genre for these drawings and lyrics"),
});

const GameRoundSchema = z.object({
  lyrics: z.string(),
  genre: z.string(),
  url: z.string(),
});

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
  socketId: string;
  hasSubmitted?: boolean;
}

// Add new interface for drawing submissions
interface DrawingSubmission {
  playerId: string;
  imageData: string;
  lyrics?: string[];
}

const mockSongData = {
  lyrics:
    "[Verse 1]\n" +
    "A shape so round, what could it be?\n" +
    "A doodle lost in its own mystery.\n" +
    "Dreams and laughs in a single line,\n" +
    "In this simple art, the joy is mine.\n" +
    "\n" +
    "[Verse 2]\n" +
    "A triangle stands in a world so bare,\n" +
    "Its lines are shaky, yet it doesn't care.\n" +
    "In simplicity, it finds its form,\n" +
    "A little off, but still it's warm.",
  genre: "Acoustic Folk Pop with Whimsical Elements and Childlike Imagery",
  url: "https://cdn1.suno.ai/7e87ed30-23b9-404d-aa30-75881cd57c04.mp3",
};

let players: Player[] = [];
let songData: any = null;
let drawingSubmissions: DrawingSubmission[] = [];
console.log("Server state initialized");

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinLobby", ({ playerId, nickname }) => {
    const newPlayer: Player = {
      id: playerId,
      isHost: players.length === 0, // First player becomes host
      nickname,
      socketId: socket.id,
    };

    players.push(newPlayer);
    io.emit("lobbyUpdate", players);
    console.log("Player joined:", newPlayer);
    console.log(`Lobby status: ${players.length} players connected`);
    console.log(
      "Current players:",
      players.map((p) => ({ id: p.id, nickname: p.nickname }))
    );
  });

  socket.on("drawingSubmitted", () => {
    console.log(`Drawing submitted by socket ${socket.id}`);
    const player = players.find((p) => p.socketId === socket.id);
    if (player) {
      player.hasSubmitted = true;

      // Check if all players have submitted
      const allSubmitted = players.every((p) => p.hasSubmitted);
      if (allSubmitted) {
        console.log("All drawings have been submitted");
        io.emit("allDrawingsSubmitted");
      }
    }
  });

  socket.on("songCreated", (data) => {
    console.log("New song created:", data);
    songData = data;
    io.emit("displaySong", data);
  });

  socket.on("startGame", () => {
    const player = players.find((p) => p.socketId === socket.id);
    console.log(`Game start requested by ${player?.nickname} (${socket.id})`);
    if (player?.isHost) {
      console.log("Starting new game, resetting game state");
      // Reset submissions when starting new game
      players.forEach((p) => (p.hasSubmitted = false));
      songData = null;
      drawingSubmissions = []; // Reset submissions
      io.emit("gameStarted");
    }
  });

  socket.on("submitDrawing", async (imageData: string) => {
    try {
      console.log(`Processing drawing from socket ${socket.id}`);
      const player = players.find((p) => p.socketId === socket.id);
      if (player) {
        // Store the drawing
        drawingSubmissions.push({
          playerId: player.id,
          imageData: imageData,
        });

        player.hasSubmitted = true;
        socket.emit("drawingProcessed");

        // If all players submitted, process all drawings
        if (players.every((p) => p.hasSubmitted)) {
          console.log(
            "All players have submitted their drawings - starting processing"
          );
          io.emit("allDrawingsSubmitted");
          console.log(
            "Processing all drawings for lyrics generation in parallel"
          );

          await new Promise((resolve) => setTimeout(resolve, 2000));
          io.emit("displaySong", mockSongData);
          console.log("Generated mock song");

          return;

          // Helper function to generate lyrics for a single drawing
          const generateLyrics = async (submission: DrawingSubmission) => {
            console.log(`Generating lyrics for player ${submission.playerId}`);
            const analysis = await client.chat.completions.create({
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text:
                        "You are an expert at identifying poorly drawn images and writing song lyrics about them. " +
                        "Take a drawing and write exactly 4 lines of song lyrics about the drawing.\n" +
                        "IMPORTANT: Each line MUST be 80 characters or less.\n" +
                        "Keep lyrics simple and short.",
                    },
                    {
                      type: "image_url",
                      image_url: { url: submission.imageData },
                    },
                  ],
                },
              ],
              model: "gpt-4o-mini",
              response_model: {
                schema: DrawingAnalysisSchema,
                name: "DrawingAnalysis",
              },
              max_tokens: 1000,
            });
            submission.lyrics = analysis.lyrics;
            console.log("Generated lyrics:", analysis.lyrics);
            return submission;
          };

          // Process all drawings in parallel
          await Promise.all(drawingSubmissions.map(generateLyrics));

          console.log("Getting genre for combined lyrics");
          // Combine all lyrics with verse numbers
          const allLyrics = drawingSubmissions
            .map((submission, index) =>
              submission.lyrics
                ? `[Verse ${index + 1}]\n${submission.lyrics.join("\n")}`
                : null
            )
            .filter(Boolean)
            .join("\n\n");
          const lyricsString = allLyrics;

          // Get genre for combined lyrics
          const genreAnalysis = await client.chat.completions.create({
            messages: [
              {
                role: "user",
                content:
                  `<lyrics>${lyricsString}</lyrics>\n\n` +
                  "Based on these song lyrics, suggest a musical genre that would fit best.\n" +
                  "IMPORTANT: Make the genre extremely specific, using several words to make it really interesting.",
              },
            ],
            model: "gpt-4o-mini",
            response_model: {
              schema: GenreAnalysisSchema,
              name: "GenreAnalysis",
            },
            max_tokens: 100,
          });

          console.log("Generated genre:", genreAnalysis.genre);

          // Generate song
          const response = await fetch(`${process.env.NGROK_URL}/createSong`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: lyricsString }),
          });

          if (!response.ok) {
            throw new Error("Failed to create song");
          }

          const song = await response.json();

          if (song.status !== true) {
            console.error("Failed to create song:", song.error);
            socket.emit("error", "Failed to create song");
          }

          const songURL = song.songURL;

          console.log("Generated song:", songURL);

          const songData = GameRoundSchema.parse({
            lyrics: lyricsString,
            genre: genreAnalysis.genre,
            url: songURL,
          });

          console.log("Final song data:", songData);
          io.emit("displaySong", songData);
          io.emit("allDrawingsSubmitted");
        }
      }
    } catch (error) {
      console.error("Error processing drawing:", error);
      socket.emit("error", "Failed to process drawing");
    }
  });

  socket.on("disconnect", () => {
    const disconnectedPlayer = players.find((p) => p.socketId === socket.id);
    console.log(
      `Player disconnected: ${disconnectedPlayer?.nickname} (${socket.id})`
    );
    players = players.filter((p) => p.socketId !== socket.id);
    if (players.length > 0 && !players[0].isHost) {
      players[0].isHost = true; // Make first remaining player the host
    }
    io.emit("lobbyUpdate", players);
    console.log(
      "Updated player list:",
      players.map((p) => ({ id: p.id, nickname: p.nickname }))
    );
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
