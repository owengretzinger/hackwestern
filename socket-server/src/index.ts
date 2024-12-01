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
  description: z.string(),
  lyrics: z.array(z.string()).min(4).max(4),
});

const GenreAnalysisSchema = z.object({
  genre: z
    .string()
    .describe(
      "A detailed, specific musical genre description using several words"
    ),
  shortGenre: z
    .string()
    .max(20)
    .describe("A short, 1-2 word version of the genre"),
  title: z
    .string()
    .describe("A creative and relevant title for the song based on the lyrics"),
});

const GameRoundSchema = z.object({
  cover: z.string(),
  verses: z.array(
    z.object({
      author: z.string(),
      lyrics: z.string(),
      image: z.string(),
    })
  ),
  genre: z.string(),
  shortGenre: z.string(),
  title: z.string(),
  url: z.string(),
});

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://172.20.10.5:3000", "http://localhost:3000"],
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
  nickname: string; // Added this line
  imageData: string;
  lyrics?: string[];
  description?: string;
}

const mockSongData = {
  verses: [
    {
      lyrics:
        "A shape so round, what could it be?\n" +
        "A doodle lost in its own mystery.\n" +
        "Dreams and laughs in a single line,\n" +
        "In this simple art, the joy is mine.",
      image: "", // This would be the base64 image data
    },
    {
      lyrics:
        "A triangle stands in a world so bare,\n" +
        "Its lines are shaky, yet it doesn't care.\n" +
        "In simplicity, it finds its form,\n" +
        "A little off, but still it's warm.",
      image: "", // This would be the base64 image data
    },
  ],
  genre: "Acoustic Folk Pop with Whimsical Elements and Childlike Imagery",
  url: "https://cdn1.suno.ai/7e87ed30-23b9-404d-aa30-75881cd57c04.mp3",
};

let players: Player[] = [];
let songData: any = null;
let drawingSubmissions: DrawingSubmission[] = [];
let gameInProgress = false;
console.log("Server state initialized");

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinLobby", ({ playerId, nickname }) => {
    if (gameInProgress) {
      socket.emit("joinRejected", "Game is already in progress");
      return;
    }

    // Remove the same player if they're already in (handles reconnects)
    players = players.filter((p) => p.id !== playerId);

    const newPlayer: Player = {
      id: playerId,
      isHost: players.length === 0, // First player becomes host
      nickname,
      socketId: socket.id,
    };

    players.push(newPlayer);

    // Re-emit lobby update to ensure all clients have current state
    io.emit(
      "lobbyUpdate",
      players.map((p) => ({
        id: p.id,
        isHost: p.isHost,
        nickname: p.nickname,
      }))
    );

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
      gameInProgress = true;
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
        // Store the drawing along with the player's nickname
        drawingSubmissions.push({
          playerId: player.id,
          nickname: player.nickname, // Added this line
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

          // // Use submissions for mock data
          // const mockSongData = {
          //   cover:
          //     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE-evVoCbHwvc7LgNjNqqqmlV4jkgX6lKW8Q&s",
          //   verses: drawingSubmissions.map((submission, index) => ({
          //     author: submission.nickname, // Use player's nickname
          //     lyrics:
          //       "Line 1 of verse " +
          //       (index + 1) +
          //       "\n" +
          //       "Line 2 of verse " +
          //       (index + 1) +
          //       "\n" +
          //       "Line 3 of verse " +
          //       (index + 1) +
          //       "\n" +
          //       "Line 4 of verse " +
          //       (index + 1),
          //     image: submission.imageData,
          //   })),
          //   genre: "Acoustic Folk Pop with Whimsical Elements",
          //   url: "https://cdn1.suno.ai/7e87ed30-23b9-404d-aa30-75881cd57c04.mp3",
          // };

          // await new Promise((resolve) => setTimeout(resolve, 2000));
          // io.emit("displaySong", mockSongData);
          // console.log(
          //   "Generated mock song with",
          //   mockSongData.verses.length,
          //   "verses"
          // );

          // return;

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
                        "You are an expert at identifying poorly drawn images and writing epic song lyrics about them. " +
                        "First, identify the image and describe it in 3-6 words. " +
                        "Then, write exactly 4 sick lines of rap lyrics about the drawing." +
                        "Give the lyrics the 'wow' factor.",
                      // + "IMPORTANT: Each line MUST be 80 characters or less.\n"
                      // + "Keep lyrics simple and short.",
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
            submission.description = analysis.description; // Ensure description is set

            console.log("Generated lyrics:", analysis.lyrics);
            return submission;
          };

          // Process all drawings in parallel
          await Promise.all(drawingSubmissions.map(generateLyrics));
          console.log("All lyrics generated");

          console.log("Getting genre for combined lyrics");
          // Combine all lyrics with verse numbers
          const lyricsString = drawingSubmissions
            .map((submission) => submission.lyrics?.join("\n"))
            .join("\n\n");

          const descriptions = drawingSubmissions
            .map((submission) => submission.description)
            .join(", ");

          console.log("descriptions", descriptions);
          console.log(
            "image prompt:",
            `<descriptions>${descriptions}</descriptions>\n\n` +
              "Based on these descriptions of pictures that were drawn, create album cover art." +
              "IMPORTANT: Base the cover art on a couple of the descriptions."
          );

          const lyricsStringWithVerseText = drawingSubmissions
            .map((submission, index) =>
              submission.lyrics
                ? `[Verse ${index + 1}]\n${submission.lyrics.join("\n")}`
                : null
            )
            .filter(Boolean)
            .join("\n\n");

          // Run genre analysis and image generation in parallel
          const imageResponse = openai.images.generate({
            model: "dall-e-3",
            prompt:
              `<descriptions>${descriptions}</descriptions>\n\n` +
              "Based on these descriptions of pictures that were drawn, create album cover art." +
              "IMPORTANT: Base the cover art on a couple of the descriptions.",
            n: 1,
            size: "1024x1024",
          });
          console.log("started image generation");

          console.log("Generating genre analysis");
          const genreAnalysis = await client.chat.completions.create({
            messages: [
              {
                role: "user",
                content:
                  `<lyrics>${lyricsString}</lyrics>\n\n` +
                  "Based on these song lyrics, suggest two versions of a musical genre that would fit best:\n" +
                  "1. A detailed, specific genre using several descriptive words\n" +
                  "2. A short, concise 1-3 word version of the same genre\n" +
                  "IMPORTANT: the genre should be a sub-genre rap. " +
                  "Not whimsical or folk or children's music or quirky.\n" +
                  "IMPORTANT: Also provide a title for the song based on the lyrics.",
              },
            ],
            model: "gpt-4o-mini",
            response_model: {
              schema: GenreAnalysisSchema,
              name: "GenreAnalysis",
            },
            max_tokens: 150,
          });
          console.log("Generated genre:", genreAnalysis.genre);

          // Generate song
          console.log("Generating song");
          const response = await fetch(`${process.env.NGROK_URL}/createSong`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lyrics: lyricsString,
              genre: genreAnalysis.genre,
            }),
          });

          if (!response.ok) {
            socket.emit("error", "Failed to create song");
            console.error("Failed to create song, response not ok");
          }

          const song = await response.json();

          if (song.status !== true) {
            console.error("Failed to create song:", song.error);
            socket.emit("error", "Failed to create song");
          }

          const songURL = song.songURL;
          // const songURL = mockSongData.url;

          console.log("Generated song:", songURL);

          const coverImageUrl = (await imageResponse).data[0].url;
          console.log("Generated cover art:", coverImageUrl);

          console.log("Parsing song data");
          let songData;
          try {
            songData = GameRoundSchema.parse({
              cover: coverImageUrl,
              verses: drawingSubmissions.map((submission) => ({
                author: submission.nickname,
                lyrics: submission.lyrics?.join("\n") || "",
                image: submission.imageData,
              })),
              genre: genreAnalysis.genre,
              shortGenre: genreAnalysis.shortGenre,
              title: genreAnalysis.title,
              url: songURL,
            });
          } catch (error) {
            console.error("Error validating song data:", error);
            socket.emit("error", "Failed to validate song data");
            return;
          }

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
    if (players.length === 0) {
      gameInProgress = false;
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
