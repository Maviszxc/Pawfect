// utils/websocketSignaling.ts
import { io, Socket } from "socket.io-client";
import { NEXT_PUBLIC_WS_URL } from "./constants";

class Signaling {
  private socket: Socket | null = null;
  private callbacks: any = {};

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // If socket is already connected, resolve immediately
        if (this.socket && this.socket.connected) {
          console.log("Socket already connected");
          resolve();
          return;
        }

        // If socket exists but not connected, try to reconnect
        if (this.socket && !this.socket.connected) {
          console.log("Reconnecting existing socket...");
          this.socket.connect();
          resolve();
          return;
        }

        console.log(`Connecting to signaling server: ${NEXT_PUBLIC_WS_URL}`);

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
      this.callbacks.onOffer?.(
        data.offer,
        data.roomId,
        data.senderId,
        data.targetId
      );
    });

    this.socket.on("answer", (data: any) => {
      console.log("Answer received:", data);
      this.callbacks.onAnswer?.(
        data.answer,
        data.roomId,
        data.senderId,
        data.targetId
      );
    });

    this.socket.on("ice-candidate", (data: any) => {
      console.log("ICE candidate received:", data);
      this.callbacks.onIceCandidate?.(
        data.candidate,
        data.roomId,
        data.senderId,
        data.targetId
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

    this.socket.on("stream-control", (data: any) => {
      console.log("Stream control received:", data);
      this.callbacks.onStreamControl?.(data);
    });

    this.socket.on("room-info", (data: any) => {
      console.log("Room info:", data);
      this.callbacks.onRoomInfo?.(data);
    });

    this.socket.on("heart-reaction", (data: any) => {
      console.log("Heart reaction received:", data);
      this.callbacks.onHeartReaction?.(data, data.roomId);
    });

    this.socket.on("admin-live-status", (data: any) => {
      console.log("Admin live status received:", data);
      this.callbacks.onAdminLiveStatus?.(data);
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
        fullname: userData.name || userData.fullname || "User",
        profilePicture: userData.profilePicture || "",
        id: userData.userId || `guest-${Date.now()}`,
      },
    });
  }

  sendOffer(
    offer: RTCSessionDescriptionInit,
    roomId: string,
    targetId?: string
  ) {
    if (!this.socket) return;

    console.log(
      `Sending offer to room ${roomId}${
        targetId ? ` (target: ${targetId})` : ""
      }`
    );

    this.socket.emit("offer", {
      offer,
      roomId,
      targetId,
    });
  }

  sendAnswer(
    answer: RTCSessionDescriptionInit,
    roomId: string,
    targetId?: string
  ) {
    if (!this.socket) return;

    console.log(
      `Sending answer to room ${roomId}${
        targetId ? ` (target: ${targetId})` : ""
      }`
    );

    this.socket.emit("answer", {
      answer,
      roomId,
      targetId,
    });
  }

  sendICECandidate(
    candidate: RTCIceCandidateInit,
    roomId: string,
    targetId?: string
  ) {
    if (!this.socket) return;

    this.socket.emit("ice-candidate", {
      candidate,
      roomId,
      targetId,
    });
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
      fullname: sender,
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

  sendStreamControl(action: "pause" | "resume", roomId: string) {
    if (!this.socket) return;

    console.log(`Sending stream control: ${action} for room ${roomId}`);

    this.socket.emit("stream-control", {
      action,
      roomId,
    });
  }

  sendHeartReaction(roomId: string) {
    console.log("sendHeartReaction called with roomId:", roomId);
    console.log("Socket exists:", !!this.socket);
    console.log("Socket connected:", this.socket?.connected);
    
    if (!this.socket) {
      console.error("Cannot send heart reaction: socket is null");
      return;
    }

    if (!this.socket.connected) {
      console.error("Cannot send heart reaction: socket not connected");
      return;
    }

    console.log(`✅ Sending heart reaction for room ${roomId}`);

    this.socket.emit("heart-reaction", {
      roomId,
      timestamp: Date.now(),
    });
    
    console.log("Heart reaction emitted successfully");
  }

  checkLiveStatus(roomId: string) {
    if (!this.socket || !this.socket.connected) {
      console.log("Socket not connected yet, skipping live status check");
      return;
    }

    console.log(`Checking live status for room ${roomId}`);
    this.socket.emit("check-live-status", { roomId });
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
