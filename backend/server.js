const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

const users = new Map();

const broadcastUserList = () => {
  io.emit("user list", Array.from(users.values()));
};

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("user joined", (username) => {
    users.set(socket.id, username);
    io.emit("chat message", {
      text: `${username} joined the chat`,
      username: "System",
      time: new Date().toLocaleTimeString(),
    });
    broadcastUserList();
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("typing", ({ user, isTyping }) => {
    socket.broadcast.emit("typing", { user, isTyping });
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    if (username) {
      io.emit("chat message", {
        text: `${username} left the chat`,
        username: "System",
        time: new Date().toLocaleTimeString(),
      });
      users.delete(socket.id);
      broadcastUserList();
    }
    console.log("user disconnected");
  });
});

server.listen(process.env.PORT || 4000, () => {
  console.log("Server running on port 4000");
});
