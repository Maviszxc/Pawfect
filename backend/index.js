/** @format */

const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const dbConnect = require("./Utilities/databaseUtil");
const userRoutes = require("./Routes/userRoutes");
const petRoutes = require("./Routes/petRoutes");
const adoptionRoutes = require("./Routes/adoptionRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

// Connect to MongoDB
dbConnect();

app.use(express.json());
app.use(cors({ origin: "*" }));

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/adoptions", adoptionRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// --- Socket.IO setup for live streaming signaling ---
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket.IO client connected:", socket.id);

  socket.on("join", ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", { userId: socket.id });
    socket.emit("joined", {
      roomId,
      clientCount: io.sockets.adapter.rooms.get(roomId)?.size || 1,
    });
  });

  socket.on("offer", ({ offer, roomId }) => {
    socket.to(roomId).emit("offer", { offer, senderId: socket.id, roomId });
  });

  socket.on("answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("answer", { answer, senderId: socket.id, roomId });
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket
      .to(roomId)
      .emit("ice-candidate", { candidate, senderId: socket.id, roomId });
  });

  socket.on("chat-message", (data) => {
    socket.to(data.roomId).emit("chat-message", data);
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit("user-left", { userId: socket.id });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
