import type { Server, Socket } from "socket.io";

const connection: {
  socket: Socket | null;
} = {
  socket: null,
};

export const initSocketIO = (io: Server) => {
  io.on("connection", (sock) => {
    console.info("a user connected");

    connection.socket = sock;

    connection.socket.on("disconnect", () => {
      console.info("user disconnected");
    });
  });

  return io;
};
