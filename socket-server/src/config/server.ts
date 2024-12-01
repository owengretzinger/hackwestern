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
      origin: [
        "http://localhost:3000",
        "http://172.20.10.5:3000",
        "https://hackwestern11main-91370a9c09b3.herokuapp.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type"],
    },
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