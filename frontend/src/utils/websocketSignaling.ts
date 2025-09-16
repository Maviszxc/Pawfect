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

  // Update the connect method
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isIntentionalDisconnect = false;

      // Clear existing connection
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
        reject(new Error("WebSocket is not supported"));
        return;
      }

      console.log("Connecting to WebSocket server:", NEXT_PUBLIC_WS_URL);

      try {
        // Add timeout handling
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.ws = new WebSocket(NEXT_PUBLIC_WS_URL);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log("✅ Connected to signaling server");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error("WebSocket connection error:", error);
          reject(new Error("Connection failed"));
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log(`WebSocket closed: ${event.code} - ${event.reason}`);

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
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received message:", data.type);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received message:", data.type);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing message:", error);
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
