const WebSocket = require("ws");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const PORT = 3001;

// Create HTTP server with proper CORS
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        connections: wss.clients.size,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false,
  clientTracking: true,
});

const rooms = new Map();
let connectionCounter = 0;

// Helper function to broadcast to all clients in a room (including sender)
function broadcastToRoom(roomId, message) {
  if (!rooms.has(roomId)) return;
  const clients = rooms.get(roomId);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending message to client:", error);
      }
    }
  });
}

// Handle WebSocket connections
wss.on("connection", (ws, req) => {
  // Log the origin for debugging CORS issues
  console.log(`WebSocket connection from origin: ${req.headers.origin}`);

  const clientId = uuidv4();
  ws.id = clientId;
  connectionCounter++;

  console.log(
    `Client connected: ${clientId}. Total connections: ${connectionCounter}`
  );
  console.log(`Origin: ${req.headers.origin}`);

  // Send welcome message immediately
  try {
    ws.send(
      JSON.stringify({
        type: "welcome",
        message: "Connected to WebSocket server",
        clientId: clientId,
      })
    );
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }

  ws.isAuthenticated = true; // Remove authentication requirement for now
  ws.userId = clientId;
  ws.isAdmin = false;
  ws.roomId = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message type: ${data.type} from ${clientId}`);

      // Skip authentication for now to simplify connection
      // if (!ws.isAuthenticated && data.type !== "auth") {
      //   ws.send(
      //     JSON.stringify({
      //       type: "error",
      //       message: "Authentication required before any other action",
      //     })
      //   );
      //   return;
      // }

      switch (data.type) {
        case "join":
          const roomId = data.roomId;
          if (!roomId) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room ID is required",
              })
            );
            return;
          }

          // Leave previous room if any
          if (ws.roomId && rooms.has(ws.roomId)) {
            rooms.get(ws.roomId).delete(ws);
            if (rooms.get(ws.roomId).size === 0) {
              rooms.delete(ws.roomId);
            }
            console.log(`Client ${clientId} left room ${ws.roomId}`);
          }

          // Join new room
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
            console.log(`Created new room: ${roomId}`);
          }
          rooms.get(roomId).add(ws);
          ws.roomId = roomId;
          ws.isAdmin = data.isAdmin || false;

          console.log(
            `Client ${clientId} joined room ${roomId} as ${
              ws.isAdmin ? "admin" : "viewer"
            }. Room size: ${rooms.get(roomId).size}`
          );

          // Notify client they've joined
          ws.send(
            JSON.stringify({
              type: "joined",
              roomId,
              clientCount: rooms.get(roomId).size,
              clientId: ws.id,
              isAdmin: ws.isAdmin,
            })
          );

          // Notify others in the room about new client
          if (ws.isAdmin) {
            broadcastToRoom(
              roomId,
              {
                type: "admin-joined",
                roomId: roomId,
                adminId: ws.id,
              },
              ws
            );
          } else {
            // Notify admins in the room that a viewer joined
            const roomClients = rooms.get(roomId);
            roomClients.forEach((client) => {
              if (
                client !== ws &&
                client.isAdmin &&
                client.readyState === WebSocket.OPEN
              ) {
                client.send(
                  JSON.stringify({
                    type: "viewer-joined",
                    roomId,
                    viewerId: ws.id,
                  })
                );
              }
            });
          }
          break;

        case "offer":
          if (!data.roomId || !data.offer) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room ID and offer are required",
              })
            );
            return;
          }

          console.log(
            `Forwarding offer from ${clientId} in room ${data.roomId}`
          );
          broadcastToRoom(
            data.roomId,
            {
              type: "offer",
              offer: data.offer,
              roomId: data.roomId,
              senderId: clientId,
            },
            ws
          );
          break;

        case "answer":
          if (!data.roomId || !data.answer) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room ID and answer are required",
              })
            );
            return;
          }

          console.log(
            `Forwarding answer from ${clientId} in room ${data.roomId}`
          );
          broadcastToRoom(
            data.roomId,
            {
              type: "answer",
              answer: data.answer,
              roomId: data.roomId,
              senderId: clientId,
            },
            ws
          );
          break;

        case "ice-candidate":
          if (!data.roomId || !data.candidate) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room ID and candidate are required",
              })
            );
            return;
          }

          console.log(
            `Forwarding ICE candidate from ${clientId} in room ${data.roomId}`
          );
          broadcastToRoom(
            data.roomId,
            {
              type: "ice-candidate",
              candidate: data.candidate,
              roomId: data.roomId,
              senderId: clientId,
            },
            ws
          );
          break;

        case "chat-message":
          if (!data.roomId || !data.message) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room ID and message are required",
              })
            );
            return;
          }

          console.log(
            `Broadcasting chat message from ${clientId} in room ${data.roomId}`
          );

          // Attach sender info (name/profile) if available
          let senderName = data.sender || "User";
          let profileUrl = data.profileUrl || "";
          if (ws.userData) {
            senderName = ws.userData.name || senderName;
            profileUrl = ws.userData.profilePicture || profileUrl;
          }

          const messageData = {
            type: "chat-message",
            message: data.message,
            sender: senderName,
            senderId: clientId,
            timestamp: data.timestamp || new Date().toISOString(),
            roomId: data.roomId,
            profileUrl,
            isStaff: ws.isAdmin || false,
          };

          // Broadcast to ALL clients in the room including sender
          broadcastToRoom(data.roomId, messageData);
          break;

        case "ping":
          // Handle ping messages for keep-alive
          ws.send(JSON.stringify({ type: "pong" }));
          break;

        default:
          console.log(`Unknown message type: ${data.type}`);
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Unknown message type: ${data.type}`,
            })
          );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  ws.on("close", (code, reason) => {
    connectionCounter--;
    console.log(
      `Client disconnected: ${clientId}. Code: ${code}, Reason: ${reason}. Total connections: ${connectionCounter}`
    );

    // Remove client from room
    if (ws.roomId && rooms.has(ws.roomId)) {
      rooms.get(ws.roomId).delete(ws);
      console.log(`Removed client ${clientId} from room ${ws.roomId}`);

      // Notify other clients about the disconnection
      if (rooms.get(ws.roomId).size > 0) {
        broadcastToRoom(ws.roomId, {
          type: "user-left",
          roomId: ws.roomId,
          userId: ws.id,
          isAdmin: ws.isAdmin,
        });
      }

      // If room is empty, remove it
      if (rooms.get(ws.roomId).size === 0) {
        rooms.delete(ws.roomId);
        console.log(`Removed empty room ${ws.roomId}`);
      }
    }
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });

  // Heartbeat to keep connection alive
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // Send initial ping to establish connection
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
    }
  }, 1000);
});

// Heartbeat interval - check every 25 seconds
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("Terminating inactive connection");
      return ws.terminate();
    }

    ws.isAlive = false;

    // Send ping instead of using WebSocket protocol ping for better compatibility
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: "ping" }));
      } catch (error) {
        console.error("Error sending ping:", error);
      }
    }
  });
}, 25000);

wss.on("close", () => {
  clearInterval(interval);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`WebSocket server listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Try: curl http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down WebSocket server...");
  wss.close(() => {
    server.close(() => {
      console.log("WebSocket server closed");
      process.exit(0);
    });
  });
});
// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down WebSocket server...");
  wss.close(() => {
    server.close(() => {
      console.log("WebSocket server closed");
      process.exit(0);
    });
  });
});
