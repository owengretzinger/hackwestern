import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

export const createExpressApp = () => {
  const app = express();
  app.use(cors());
  return app;
};

export const createSocketServer = (
  httpServer: ReturnType<typeof createServer>
) => {
  return new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });
};

export const initializeServer = (port: number = 3001) => {
  const app = createExpressApp();
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  return {
    app,
    httpServer,
    io,
    start: () => {
      httpServer.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    },
  };
};
