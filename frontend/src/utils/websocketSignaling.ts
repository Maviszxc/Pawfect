// utils/websocketSignaling.ts
import { NEXT_PUBLIC_WS_URL } from "./constants";
import { io, Socket } from "socket.io-client";

interface SignalingCallbacks {
  onOffer: (
    offer: RTCSessionDescriptionInit,
    roomId: string,
    senderId?: string
  ) => void;
  onAnswer: (
    answer: RTCSessionDescriptionInit,
    roomId: string,
    senderId?: string
  ) => void;
  onIceCandidate: (
    candidate: RTCIceCandidateInit,
    roomId: string,
    senderId?: string
  ) => void;
  onChatMessage: (message: any, roomId: string) => void;
  onError: (error: string) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onJoined?: (data: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
}

class WebSocketSignaling {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private callbacks: Partial<SignalingCallbacks> = {};
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {}

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log("🔌 Connecting to Socket.IO server:", NEXT_PUBLIC_WS_URL);

        this.socket = io(NEXT_PUBLIC_WS_URL, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        const connectionTimeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
          this.isConnecting = false;
          this.connectionPromise = null;
        }, 10000);

        this.socket.on("connect", () => {
          clearTimeout(connectionTimeout);
          console.log("✅ Connected to signaling server:", this.socket?.id);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.callbacks.onConnected?.();
          resolve();
        });

        this.socket.on("disconnect", (reason) => {
          console.log("❌ Disconnected from signaling server:", reason);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.callbacks.onDisconnected?.();
        });

        this.socket.on("connect_error", (error) => {
          clearTimeout(connectionTimeout);
          console.error("❌ Connection error:", error.message);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.callbacks.onError?.(`Connection error: ${error.message}`);
          reject(error);
        });

        // Set up event listeners
        this.setupEventListeners();
      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("joined", (data: any) => {
      console.log("✅ Joined room:", data);
      this.callbacks.onJoined?.(data);
    });

    this.socket.on("user-joined", (data: any) => {
      console.log("👤 User joined:", data);
      this.callbacks.onUserJoined?.(data);
    });

    this.socket.on("user-left", (data: any) => {
      console.log("👤 User left:", data);
      this.callbacks.onUserLeft?.(data);
    });

    this.socket.on("offer", (data: any) => {
      console.log("📨 Offer received from:", data.senderId);
      this.callbacks.onOffer?.(data.offer, data.roomId, data.senderId);
    });

    this.socket.on("answer", (data: any) => {
      console.log("📨 Answer received from:", data.senderId);
      this.callbacks.onAnswer?.(data.answer, data.roomId, data.senderId);
    });

    this.socket.on("ice-candidate", (data: any) => {
      console.log("🧊 ICE candidate received from:", data.senderId);
      this.callbacks.onIceCandidate?.(
        data.candidate,
        data.roomId,
        data.senderId
      );
    });

    this.socket.on("chat-message", (data: any) => {
      console.log("💬 Chat message received");
      this.callbacks.onChatMessage?.(data, data.roomId);
    });

    this.socket.on("error", (data: any) => {
      console.error("❌ Signaling error:", data);
      this.callbacks.onError?.(data.message || "Unknown error");
    });
  }

  async joinRoom(roomId: string, isAdmin: boolean = false): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }

    this.roomId = roomId;
    console.log(
      `🎯 Joining room: ${roomId} as ${isAdmin ? "admin" : "viewer"}`
    );
    this.socket?.emit("join", { roomId, isAdmin });
  }

  sendOffer(offer: RTCSessionDescriptionInit, roomId: string) {
    if (!this.isConnected()) {
      console.error("❌ Not connected, cannot send offer");
      return;
    }

    console.log("📤 Sending offer");
    this.socket?.emit("offer", { offer, roomId });
  }

  sendAnswer(answer: RTCSessionDescriptionInit, roomId: string) {
    if (!this.isConnected()) {
      console.error("❌ Not connected, cannot send answer");
      return;
    }

    console.log("📤 Sending answer");
    this.socket?.emit("answer", { answer, roomId });
  }

  sendICECandidate(candidate: RTCIceCandidateInit, roomId: string) {
    if (!this.isConnected()) {
      console.error("❌ Not connected, cannot send ICE candidate");
      return;
    }

    this.socket?.emit("ice-candidate", { candidate, roomId });
  }

  sendChatMessage(message: string, sender: string, roomId: string) {
    if (!this.isConnected()) {
      console.error("❌ Not connected, cannot send chat message");
      return;
    }

    this.socket?.emit("chat-message", {
      message,
      sender,
      timestamp: new Date().toISOString(),
      roomId,
    });
  }

  setCallbacks(callbacks: Partial<SignalingCallbacks>) {
    this.callbacks = callbacks;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.roomId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    console.log("🔌 Signaling disconnected");
  }
}

export const signaling = new WebSocketSignaling();
