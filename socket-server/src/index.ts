// server/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

interface Player {
  id: string;
  isHost: boolean;
  nickname: string;
  socketId: string;
}

let players: Player[] = [];

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinLobby", ({ playerId, nickname }) => {
    const newPlayer: Player = {
      id: playerId,
      isHost: players.length === 0, // First player becomes host
      nickname,
      socketId: socket.id
    };
    
    players.push(newPlayer);
    io.emit("lobbyUpdate", players);
    console.log("Player joined:", newPlayer);
  });

  socket.on("startGame", () => {
    const player = players.find(p => p.socketId === socket.id);
    if (player?.isHost) {
      io.emit("gameStarted");
    }
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.socketId !== socket.id);
    if (players.length > 0 && !players[0].isHost) {
      players[0].isHost = true; // Make first remaining player the host
    }
    io.emit("lobbyUpdate", players);
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});