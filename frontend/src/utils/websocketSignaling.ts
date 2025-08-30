// utils/websocketSignaling.ts
import { NEXT_PUBLIC_WS_URL } from "./constants";

class WebSocketSignaling {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private onOfferCallback: ((offer: any, roomId: string) => void) | null = null;
  private onAnswerCallback: ((answer: any, roomId: string) => void) | null =
    null;
  private onIceCandidateCallback:
    | ((candidate: any, roomId: string) => void)
    | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;

  constructor() {}

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  isConnecting(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.CONNECTING;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Reset intentional disconnect flag
      this.isIntentionalDisconnect = false;

      // Clear any existing connection
      if (this.ws) {
        try {
          this.ws.close();
        } catch (error) {
          console.warn("Error closing existing connection:", error);
        }
        this.ws = null;
      }

      // Check if WebSocket is supported
      if (typeof WebSocket === "undefined") {
        reject(new Error("WebSocket is not supported in this environment"));
        return;
      }

      console.log("Connecting to WebSocket server:", NEXT_PUBLIC_WS_URL);

      try {
        this.ws = new WebSocket(NEXT_PUBLIC_WS_URL);

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (!this.isConnected()) {
            console.error("WebSocket connection timeout");
            this.ws?.close();
            reject(new Error("Connection timeout after 10 seconds"));
          }
        }, 10000);

        this.ws.onopen = () => {
          console.log("✅ Connected to signaling server");
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        };

        this.ws.onclose = (event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          const closeReasons: Record<number, string> = {
            1000: "Normal closure",
            1001: "Endpoint going away",
            1002: "Protocol error",
            1003: "Unsupported data",
            1005: "No status received",
            1006: "Abnormal closure",
            1007: "Invalid frame payload data",
            1008: "Policy violation",
            1009: "Message too big",
            1010: "Missing extension",
            1011: "Internal error",
            1012: "Service restart",
            1013: "Try again later",
            1014: "Bad gateway",
            1015: "TLS handshake failed",
          };

          const reason =
            closeReasons[event.code] || `Unknown code: ${event.code}`;
          console.log(
            `WebSocket closed: ${reason} - ${
              event.reason || "No reason provided"
            }`
          );

          // Only attempt reconnect if not intentional and not too many attempts
          if (
            !this.isIntentionalDisconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (event) => {
          // WebSocket error event doesn't provide much information in browsers
          // We'll get more details from the onclose event
          console.error("WebSocket connection error occurred");

          // Try to get more information from the readyState
          if (this.ws) {
            const states: Record<number, string> = {
              0: "CONNECTING",
              1: "OPEN",
              2: "CLOSING",
              3: "CLOSED",
            };
            console.error(`WebSocket state: ${states[this.ws.readyState]}`);
          }
        };
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `Max reconnect attempts (${this.maxReconnectAttempts}) reached. Please check if the WebSocket server is running.`
      );
      console.error(`WebSocket server URL: ${NEXT_PUBLIC_WS_URL}`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnect failed:", error);
      });
    }, delay);
  }

  async joinRoom(roomId: string): Promise<void> {
    if (!this.isConnected()) {
      try {
        await this.connect();
      } catch (error) {
        throw new Error("Failed to connect to signaling server");
      }
    }

    this.roomId = roomId;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "join",
          roomId: roomId,
        })
      );
    }
  }

  sendOffer(offer: any, roomId: string) {
    if (this.isConnected()) {
      this.ws!.send(
        JSON.stringify({
          type: "offer",
          offer,
          roomId,
        })
      );
    } else {
      console.warn("Cannot send offer: WebSocket not connected");
    }
  }

  sendAnswer(answer: any, roomId: string) {
    if (this.isConnected()) {
      this.ws!.send(
        JSON.stringify({
          type: "answer",
          answer,
          roomId,
        })
      );
    } else {
      console.warn("Cannot send answer: WebSocket not connected");
    }
  }

  sendICECandidate(candidate: any, roomId: string) {
    if (this.isConnected()) {
      this.ws!.send(
        JSON.stringify({
          type: "ice-candidate",
          candidate,
          roomId,
        })
      );
    } else {
      console.warn("Cannot send ICE candidate: WebSocket not connected");
    }
  }

  handleMessage(data: any) {
    if (!data?.type) return;

    switch (data.type) {
      case "offer":
        this.onOfferCallback?.(data.offer, data.roomId);
        break;
      case "answer":
        this.onAnswerCallback?.(data.answer, data.roomId);
        break;
      case "ice-candidate":
        this.onIceCandidateCallback?.(data.candidate, data.roomId);
        break;
      case "welcome":
        console.log("Welcome message:", data.message);
        break;
      case "joined":
        console.log("Joined room:", data.roomId, "Clients:", data.clients);
        break;
      case "error":
        console.error("Server error:", data.message);
        break;
      default:
        console.log("Unknown message type:", data.type);
    }
  }

  onOffer(callback: (offer: any, roomId: string) => void) {
    this.onOfferCallback = callback;
  }

  onAnswer(callback: (answer: any, roomId: string) => void) {
    this.onAnswerCallback = callback;
  }

  onICECandidate(callback: (candidate: any, roomId: string) => void) {
    this.onIceCandidateCallback = callback;
  }

  disconnect() {
    this.isIntentionalDisconnect = true;

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.ws) {
      try {
        this.ws.close(1000, "Intentional disconnect");
      } catch (error) {
        console.warn("Error during disconnect:", error);
      }
      this.ws = null;
    }

    this.roomId = null;
    console.log("Disconnected from signaling server");
  }

  // Add a method to check server status
  async checkServerStatus(): Promise<boolean> {
    try {
      // Simple fetch to check if server might be reachable
      const response = await fetch("http://localhost:3001", {
        method: "HEAD",
        mode: "no-cors",
      }).catch(() => null);

      return response !== null;
    } catch (error) {
      return false;
    }
  }
}

export const signaling = new WebSocketSignaling();
