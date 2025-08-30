const WebSocket = require("ws");
const http = require("http");

const PORT = 3001;

// Create HTTP server for proper CORS handling
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const wss = new WebSocket.Server({
  server,
  clientTracking: true,
});

// Handle CORS for WebSocket connections
wss.on("headers", (headers, req) => {
  headers.push("Access-Control-Allow-Origin: http://localhost:3000");
  headers.push("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  headers.push("Access-Control-Allow-Headers: Content-Type, Authorization");
  headers.push("Access-Control-Allow-Credentials: true");
});

const rooms = new Map();
let connectionCounter = 0;

console.log(`WebSocket server started on port ${PORT}`);

// ... rest of your existing websocket-server.js code remains the same

// Change the listening method
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
