// utils/constants.js
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://pawfect-6zf9.onrender.com";

// Use the main server URL for Socket.IO (port 5003 where your Express app runs)
export const NEXT_PUBLIC_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "wss://pawfect-6zf9.onrender.com";
