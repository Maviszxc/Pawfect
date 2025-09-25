// utils/constants.js
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5003";

// Use the main server URL for Socket.IO (port 5003 where your Express app runs)
export const NEXT_PUBLIC_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5003";
