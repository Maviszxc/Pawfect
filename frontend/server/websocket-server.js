const WebSocket = require("ws");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const PORT = 3001;

// Create HTTP server for proper CORS handling
const server = http.createServer((req, res) => {
  // Handle CORS for HTTP requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

const wss = new WebSocket.Server({
  server,
  clientTracking: true,
});

// Handle CORS for WebSocket connections
wss.on("headers", (headers, req) => {
  headers.push("Access-Control-Allow-Origin: *");
  headers.push("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  headers.push("Access-Control-Allow-Headers: Content-Type, Authorization");
  headers.push("Access-Control-Allow-Credentials: true");
});

// Track active connections
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
});

// Implement ping-pong for connection health checks
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

const rooms = new Map();
let connectionCounter = 0;

// Helper function to broadcast to all clients in a room except the sender
function broadcastToRoom(roomId, message, excludeClient) {
  if (!rooms.has(roomId)) return;
  
  const clients = rooms.get(roomId);
  clients.forEach(client => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  ws.id = clientId;
  connectionCounter++;
  console.log(`Client connected: ${clientId}. Total connections: ${connectionCounter}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to WebSocket server',
    clientId
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message type: ${data.type} from ${clientId}`);

      switch (data.type) {
        case 'join':
          // Join a room
          const roomId = data.roomId;
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          rooms.get(roomId).add(ws);
          console.log(`Client ${clientId} joined room ${roomId}`);
          
          // Notify client they've joined
          ws.send(JSON.stringify({
            type: 'joined',
            roomId,
            clients: rooms.get(roomId).size
          }));
          break;

        case 'offer':
          // Forward offer to all clients in the room
          console.log(`Forwarding offer from ${clientId} in room ${data.roomId}`);
          broadcastToRoom(data.roomId, {
            type: 'offer',
            offer: data.offer,
            roomId: data.roomId
          }, ws);
          break;

        case 'answer':
          // Forward answer to all clients in the room
          console.log(`Forwarding answer from ${clientId} in room ${data.roomId}`);
          broadcastToRoom(data.roomId, {
            type: 'answer',
            answer: data.answer,
            roomId: data.roomId
          }, ws);
          break;

        case 'ice-candidate':
          // Forward ICE candidate to all clients in the room
          console.log(`Forwarding ICE candidate from ${clientId} in room ${data.roomId}`);
          broadcastToRoom(data.roomId, {
            type: 'ice-candidate',
            candidate: data.candidate,
            roomId: data.roomId
          }, ws);
          break;

        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    connectionCounter--;
    console.log(`Client disconnected: ${clientId}. Total connections: ${connectionCounter}`);
    
    // Remove client from all rooms
    rooms.forEach((clients, roomId) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        console.log(`Removed client ${clientId} from room ${roomId}`);
        
        // If room is empty, remove it
        if (clients.size === 0) {
          rooms.delete(roomId);
          console.log(`Removed empty room ${roomId}`);
        }
      }
    });
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
