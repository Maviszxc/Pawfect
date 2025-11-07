/** @format */

const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const dbConnect = require("./Utilities/databaseUtil");
const userRoutes = require("./Routes/userRoutes");
const petRoutes = require("./Routes/petRoutes");
const adoptionRoutes = require("./Routes/adoptionRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const scheduleRoutes = require("./Routes/scheduleRoutes");
const contactRoutes = require("./Routes/contactRoutes");
const donationRoutes = require("./Routes/donationRoutes");
const scheduleReminderService = require("./Utilities/scheduleReminderService");

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

// Connect to MongoDB
dbConnect();

// NOTE: Auto-migration disabled for testing
// New adoptions should work without it due to:
// 1. Model has default: '' for adoptionFormUrl
// 2. Pre-save hook ensures field always exists
// 3. Controller explicitly sets the field

app.use(express.json());

// ✅ FIXED CORS CONFIGURATION - MUST BE BEFORE ROUTES
// ✅ WORKING CORS CONFIGURATION
const allowedOrigins = [
  "https://biyayaanimalcare.vercel.app",
  "https://pawfect-6zf9.onrender.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5003",
];

// Log CORS requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Explicit OPTIONS handler for all routes
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.status(204).send();
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600, // Cache preflight for 10 minutes
  })
);

// ✅ Handle preflight requests explicitly
app.options("*", cors());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/adoptions", adoptionRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/donations", donationRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || "development",
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasMongoUri: !!process.env.MONGO_URI,
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    error: true,
    message: err.message || "Internal server error",
  });
});

// --- Socket.IO setup for live streaming signaling ---
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Use a more robust room management system
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("Socket.IO client connected:", socket.id);

  // Set up user data with proper defaults
  socket.userData = {
    id: socket.id,
    isAdmin: false,
    name: "User",
    fullname: "User",
    profilePicture: "",
    roomId: null,
    joinedAt: new Date(),
  };

  socket.on("join", ({ roomId, isAdmin, userData }) => {
    try {
      console.log(`User ${socket.id} joining room:`, {
        roomId,
        isAdmin,
        userData: {
          name: userData?.name || userData?.fullname,
          fullname: userData?.fullname || userData?.name,
          profilePicture: userData?.profilePicture ? "Yes" : "No",
          id: userData?.id,
        },
      });

      // Leave previous room if any
      if (socket.userData.roomId && socket.userData.roomId !== roomId) {
        socket.leave(socket.userData.roomId);
        removeUserFromRoom(socket.userData.roomId, socket.id);
      }

      // Join new room
      socket.join(roomId);

      // Update user data with proper fallbacks
      socket.userData = {
        ...socket.userData,
        isAdmin: isAdmin || false,
        name:
          userData?.fullname || userData?.name || (isAdmin ? "Admin" : "User"),
        fullname:
          userData?.fullname || userData?.name || (isAdmin ? "Admin" : "User"),
        profilePicture: userData?.profilePicture || "",
        roomId: roomId,
      };

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          admin: null,
          users: new Map(),
          createdAt: new Date(),
          isStreaming: false, // Track if admin is actively streaming
        });
      }

      const room = rooms.get(roomId);

      if (isAdmin) {
        room.admin = socket.id;
        room.isStreaming = true; // Admin is now streaming
        console.log(
          `Admin ${socket.id} (${socket.userData.fullname}) joined room ${roomId} and started streaming`
        );
        
        // Notify ALL connected clients (not just in the room) that admin is live
        io.emit("admin-live-status", {
          isLive: true,
          roomId: roomId,
          adminName: socket.userData.fullname,
        });
      } else {
        room.users.set(socket.id, {
          id: socket.id,
          name: socket.userData.name,
          fullname: socket.userData.fullname,
          profilePicture: socket.userData.profilePicture,
          joinedAt: new Date(),
        });
        console.log(
          `User ${socket.id} (${socket.userData.fullname}) joined room ${roomId}`
        );
      }

      // Notify the joining user
      socket.emit("joined", {
        roomId,
        success: true,
        clientId: socket.id,
        isAdmin: isAdmin,
        roomInfo: {
          admin: room.admin,
          userCount: room.users.size,
          totalParticipants: room.users.size + (room.admin ? 1 : 0),
        },
      });

      // Notify others in the room about new user (excluding sender)
      socket.to(roomId).emit("user-joined", {
        user: socket.userData,
        isAdmin: isAdmin,
        participantCount: room.users.size + (room.admin ? 1 : 0),
        viewerCount: room.users.size,
        roomId,
      });

      // Send current participants to the new user
      const participants = getRoomParticipants(room);
      socket.emit("room-info", {
        roomId,
        participants,
        participantCount: participants.length,
        viewerCount: room.users.size,
        adminPresent: !!room.admin,
      });

      console.log(
        `Room ${roomId} now has ${room.users.size} users and admin: ${
          room.admin ? `${room.admin} (${socket.userData.fullname})` : "none"
        }`
      );
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", {
        type: "join-error",
        message: "Failed to join room",
        roomId,
      });
    }
  });

  socket.on("offer", ({ offer, roomId, targetId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found for offer`);
        return;
      }

      console.log(
        `User ${socket.id} (${
          socket.userData.fullname
        }) sending offer to room ${roomId}${
          targetId ? ` (target: ${targetId})` : ""
        }`
      );

      if (targetId) {
        socket.to(targetId).emit("offer", {
          offer,
          senderId: socket.id,
          senderData: socket.userData,
          roomId,
          targetId,
          timestamp: new Date().toISOString(),
        });
      } else {
        socket.to(roomId).emit("offer", {
          offer,
          senderId: socket.id,
          senderData: socket.userData,
          roomId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  });

  socket.on("answer", ({ answer, roomId, targetId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found for answer`);
        return;
      }

      console.log(
        `User ${socket.id} (${
          socket.userData.fullname
        }) sending answer in room ${roomId}${
          targetId ? ` (target: ${targetId})` : ""
        }`
      );

      if (targetId) {
        socket.to(targetId).emit("answer", {
          answer,
          senderId: socket.id,
          senderData: socket.userData,
          roomId,
          targetId,
          timestamp: new Date().toISOString(),
        });
      } else {
        if (room.admin && room.admin !== socket.id) {
          socket.to(room.admin).emit("answer", {
            answer,
            senderId: socket.id,
            senderData: socket.userData,
            roomId,
            timestamp: new Date().toISOString(),
          });
        } else {
          socket.to(roomId).emit("answer", {
            answer,
            senderId: socket.id,
            senderData: socket.userData,
            roomId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  });

  socket.on("ice-candidate", ({ candidate, roomId, targetId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found for ICE candidate`);
        return;
      }

      console.log(
        `User ${socket.id} sending ICE candidate to room ${roomId}${
          targetId ? ` (target: ${targetId})` : ""
        }`
      );

      if (targetId) {
        socket.to(targetId).emit("ice-candidate", {
          candidate,
          senderId: socket.id,
          roomId,
          targetId,
          timestamp: new Date().toISOString(),
        });
      } else {
        socket.to(roomId).emit("ice-candidate", {
          candidate,
          senderId: socket.id,
          roomId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  });

  socket.on("chat-message", (data) => {
    try {
      const { message, roomId, sender, fullname, profileUrl } = data;
      const room = rooms.get(roomId);

      if (!room) {
        console.error(`Room ${roomId} not found for chat message`);
        return;
      }

      console.log(
        `${
          socket.userData.fullname || socket.userData.name
        } sending message to room ${roomId}`
      );

      const finalSender =
        fullname || sender || socket.userData.fullname || socket.userData.name;
      const finalProfileUrl = profileUrl || socket.userData.profilePicture;

      const messageData = {
        message,
        sender: finalSender,
        fullname: finalSender,
        profileUrl: finalProfileUrl,
        senderId: socket.id,
        isAdmin: socket.userData.isAdmin,
        isStaff: socket.userData.isAdmin,
        roomId,
        timestamp: new Date().toISOString(),
      };

      io.to(roomId).emit("chat-message", messageData);

      console.log(
        `Message broadcast to ${
          room.users.size + 1
        } participants from ${finalSender}`
      );
    } catch (error) {
      console.error("Error handling chat message:", error);
    }
  });

  socket.on("heart-reaction", (data) => {
    try {
      const { roomId, timestamp } = data;
      const room = rooms.get(roomId);

      if (!room) {
        console.error(`Room ${roomId} not found for heart reaction`);
        return;
      }

      console.log(
        `${
          socket.userData.fullname || socket.userData.name
        } sent heart reaction to room ${roomId}`
      );

      // Broadcast heart reaction to all participants in the room
      io.to(roomId).emit("heart-reaction", {
        roomId,
        timestamp: timestamp || Date.now(),
        senderId: socket.id,
        sender: socket.userData.fullname || socket.userData.name,
      });

      console.log(
        `Heart reaction broadcast to ${
          room.users.size + (room.admin ? 1 : 0)
        } participants`
      );
    } catch (error) {
      console.error("Error handling heart reaction:", error);
    }
  });

  socket.on("stream-control", (data) => {
    try {
      const { action, roomId } = data;
      const room = rooms.get(roomId);

      if (!room) {
        console.error(`Room ${roomId} not found for stream control`);
        return;
      }

      // Only admin can control the stream
      if (!socket.userData.isAdmin) {
        console.log(`Non-admin ${socket.id} attempted stream control`);
        return;
      }

      console.log(
        `Admin ${socket.userData.fullname} ${action} stream in room ${roomId}`
      );

      // Broadcast stream control to all participants
      io.to(roomId).emit("stream-control", {
        action,
        roomId,
        timestamp: Date.now(),
      });

      console.log(
        `Stream control (${action}) broadcast to ${
          room.users.size + (room.admin ? 1 : 0)
        } participants`
      );
    } catch (error) {
      console.error("Error handling stream control:", error);
    }
  });

  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() });
  });

  // Handle request to check if admin is live
  socket.on("check-live-status", ({ roomId }) => {
    const room = rooms.get(roomId);
    const isLive = room && room.admin && room.isStreaming;
    
    socket.emit("admin-live-status", {
      isLive: isLive,
      roomId: roomId,
    });
  });

  socket.on("disconnecting", (reason) => {
    console.log(
      `User ${socket.id} (${
        socket.userData.fullname || socket.userData.name
      }) disconnecting:`,
      reason
    );

    if (socket.userData.roomId) {
      removeUserFromRoom(socket.userData.roomId, socket.id);

      const updatedRoom = rooms.get(socket.userData.roomId);
      const participantCount = updatedRoom
        ? updatedRoom.users.size + (updatedRoom.admin ? 1 : 0)
        : 0;
      const viewerCount = updatedRoom ? updatedRoom.users.size : 0;

      socket.to(socket.userData.roomId).emit("user-left", {
        userId: socket.id,
        userData: socket.userData,
        roomId: socket.userData.roomId,
        reason: reason,
        participantCount: participantCount,
        viewerCount: viewerCount,
      });

      if (updatedRoom && participantCount > 0) {
        io.to(socket.userData.roomId).emit("room-info", {
          roomId: socket.userData.roomId,
          participants: getRoomParticipants(updatedRoom),
          participantCount: participantCount,
          viewerCount: viewerCount,
          adminPresent: !!updatedRoom.admin,
        });
      }
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `User ${socket.id} (${
        socket.userData.fullname || socket.userData.name
      }) disconnected:`,
      reason
    );
  });

  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Helper functions
function removeUserFromRoom(roomId, userId) {
  if (!rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  const wasAdmin = room.admin === userId;

  if (room.admin === userId) {
    room.admin = null;
    room.isStreaming = false; // Admin stopped streaming
    console.log(`👑 Admin ${userId} removed from room ${roomId} - Stream ended`);
    
    // Notify ALL connected clients that admin is no longer live
    io.emit("admin-live-status", {
      isLive: false,
      roomId: roomId,
    });
  } else {
    room.users.delete(userId);
    console.log(`👤 User ${userId} removed from room ${roomId}`);
  }

  if (!room.admin && room.users.size === 0) {
    rooms.delete(roomId);
    console.log(`🧹 Room ${roomId} cleaned up (empty)`);
  }
}

function getRoomParticipants(room) {
  const participants = [];

  if (room.admin) {
    participants.push({
      id: room.admin,
      isAdmin: true,
      name: "Admin",
      fullname: "Admin",
    });
  }

  room.users.forEach((user, userId) => {
    participants.push({
      id: userId,
      isAdmin: false,
      name: user.name || user.fullname,
      fullname: user.fullname || user.name,
      profilePicture: user.profilePicture,
      joinedAt: user.joinedAt,
    });
  });

  return participants;
}

// Room cleanup interval
setInterval(() => {
  let cleanedCount = 0;
  const now = new Date();

  for (const [roomId, room] of rooms.entries()) {
    if (!room.admin && room.users.size === 0) {
      const roomAge = now - room.createdAt;
      if (roomAge > 3600000) {
        rooms.delete(roomId);
        cleanedCount++;
      }
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} inactive rooms`);
  }
}, 300000);

const PORT = process.env.PORT || 5003;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/health`);
  console.log(`📌 WebSocket server ready for connections`);
 
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down server gracefully...");
  io.disconnectSockets();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

module.exports = { app, server, io };
