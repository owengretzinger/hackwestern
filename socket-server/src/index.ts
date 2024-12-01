import dotenv from "dotenv";
import { initializeServer } from "./config/server";
import { createEventHandlers } from "./socket/eventHandlers";
import { GameState } from "./socket/gameState";

dotenv.config();

// Verify API key is present
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const { io, start } = initializeServer();
const gameState = new GameState();
const eventHandlers = createEventHandlers(io, gameState);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinLobby", (data) => eventHandlers.handleJoinLobby(socket, data));
  socket.on("drawingSubmitted", () =>
    eventHandlers.handleDrawingSubmitted(socket)
  );
  socket.on("startGame", () => eventHandlers.handleStartGame(socket));
  socket.on("submitDrawing", (imageData) =>
    eventHandlers.handleSubmitDrawing(socket, imageData)
  );
  socket.on("disconnect", () => eventHandlers.handleDisconnect(socket));
  socket.on("kickEveryone", () => eventHandlers.handleKickEveryone(socket));
});

start();
