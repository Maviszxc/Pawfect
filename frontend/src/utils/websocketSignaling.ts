// utils/websocketSignaling.ts
import { io, Socket } from "socket.io-client";
import { NEXT_PUBLIC_WS_URL } from "./constants";

class Signaling {
  private socket: Socket | null = null;
  private callbacks: any = {};

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to signaling server: ${NEXT_PUBLIC_WS_URL}`);

        // Use http://localhost:5003 for Socket.IO, not ws://...
        this.socket = io(NEXT_PUBLIC_WS_URL, {
          transports: ["websocket", "polling"],
          timeout: 10000,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
          console.log("Connected to signaling server");
          this.callbacks.onConnected?.();
          resolve();
        });

        this.socket.on("disconnect", (reason) => {
          console.log("Disconnected from signaling server:", reason);
          this.callbacks.onDisconnected?.();
        });

        this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          this.callbacks.onError?.(error.message);
          reject(error);
        });

        // Set up event listeners
        this.setupEventListeners();
      } catch (error) {
        console.error("Error connecting to signaling server:", error);
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("joined", (data: any) => {
      console.log("Joined room:", data);
      this.callbacks.onJoined?.(data);
    });

    this.socket.on("user-joined", (data: any) => {
      console.log("User joined:", data);
      this.callbacks.onUserJoined?.(data);
    });

    this.socket.on("offer", (data: any) => {
      console.log("Offer received:", data);
      this.callbacks.onOffer?.(data.offer, data.roomId, data.senderId);
    });

    this.socket.on("answer", (data: any) => {
      console.log("Answer received:", data);
      this.callbacks.onAnswer?.(data.answer, data.roomId, data.senderId);
    });

    this.socket.on("ice-candidate", (data: any) => {
      console.log("ICE candidate received:", data);
      this.callbacks.onIceCandidate?.(
        data.candidate,
        data.roomId,
        data.senderId
      );
    });

    this.socket.on("chat-message", (data: any) => {
      console.log("Chat message received:", data);
      this.callbacks.onChatMessage?.(data, data.roomId);
    });

    this.socket.on("user-left", (data: any) => {
      console.log("User left:", data);
      this.callbacks.onUserLeft?.(data);
    });

    this.socket.on("room-info", (data: any) => {
      console.log("Room info:", data);
      this.callbacks.onRoomInfo?.(data);
    });
  }

  joinRoom(roomId: string, isAdmin: boolean, userData: any) {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }

    console.log("Joining room:", {
      roomId,
      isAdmin,
      userData: {
        name: userData.name,
        profilePicture: userData.profilePicture ? "Yes" : "No",
        userId: userData.userId,
      },
    });

    this.socket.emit("join", {
      roomId,
      isAdmin,
      userData: {
        name: userData.name || "User",
        fullname: userData.name || userData.fullname || "User", // Add fullname
        profilePicture: userData.profilePicture || "",
        id: userData.userId || `guest-${Date.now()}`,
      },
    });
  }

  sendOffer(offer: RTCSessionDescriptionInit, roomId: string) {
    if (!this.socket) return;
    this.socket.emit("offer", { offer, roomId });
  }

  sendAnswer(answer: RTCSessionDescriptionInit, roomId: string) {
    if (!this.socket) return;
    this.socket.emit("answer", { answer, roomId });
  }

  sendICECandidate(candidate: RTCIceCandidateInit, roomId: string) {
    if (!this.socket) return;
    this.socket.emit("ice-candidate", { candidate, roomId });
  }

  sendChatMessage(
    message: string,
    sender: string,
    roomId: string,
    profileUrl?: string
  ) {
    if (!this.socket) return;

    const messageData = {
      message,
      sender,
      fullname: sender, // Ensure fullname is included
      roomId,
      profileUrl: profileUrl || "",
      timestamp: new Date().toISOString(),
    };

    console.log("Sending chat message:", {
      ...messageData,
      profileUrl: profileUrl ? "Yes" : "No",
    });

    this.socket.emit("chat-message", messageData);
  }

  setCallbacks(callbacks: any) {
    this.callbacks = callbacks;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const signaling = new Signaling();
