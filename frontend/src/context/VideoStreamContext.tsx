// context/VideoStreamContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { signaling } from "../utils/websocketSignaling";

type VideoStreamContextType = {
  adminStream: MediaStream | null;
  setAdminStream: (stream: MediaStream | null) => void;
  isAdminStreaming: boolean;
  setIsAdminStreaming: (isStreaming: boolean) => void;
  peerConnection: RTCPeerConnection | null;
  connectToRoom: (roomId: string, isAdmin: boolean) => Promise<void>;
  disconnectFromRoom: () => void;
  connectionStatus: string;
  sendChatMessage: (message: string, sender: string) => void;
  chatMessages: any[];
};

const VideoStreamContext = createContext<VideoStreamContextType>({
  adminStream: null,
  setAdminStream: () => {},
  isAdminStreaming: false,
  setIsAdminStreaming: () => {},
  peerConnection: null,
  connectToRoom: async () => {},
  disconnectFromRoom: () => {},
  connectionStatus: "Disconnected",
  sendChatMessage: () => {},
  chatMessages: [],
});

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const VideoStreamProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [adminStream, setAdminStream] = useState<MediaStream | null>(null);
  const [isAdminStreaming, setIsAdminStreaming] = useState(false);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isAdminRef = useRef<boolean>(false);
  const roomIdRef = useRef<string>("");
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isConnectingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize peer connection
  const initializePeerConnection = useCallback((isAdmin: boolean) => {
    console.log(
      `🔄 Initializing peer connection as ${isAdmin ? "admin" : "viewer"}`
    );

    if (peerConnectionRef.current) {
      console.log("🧹 Cleaning up existing peer connection");
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.log("Error during cleanup:", e);
      }
    }

    try {
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && roomIdRef.current) {
          console.log("🧊 Generated ICE candidate:", event.candidate);
          signaling.sendICECandidate(
            event.candidate.toJSON(),
            roomIdRef.current
          );
        } else if (!event.candidate) {
          console.log("✅ All ICE candidates generated");
        }
      };

      pc.ontrack = (event) => {
        console.log("🎥 Track received:", event.track.kind, event.track.id);
        if (event.streams && event.streams[0]) {
          console.log(
            "📹 Stream received with tracks:",
            event.streams[0].getTracks().length
          );
          setAdminStream(event.streams[0]);
          setIsAdminStreaming(true);
          setConnectionStatus("Stream connected");
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        setConnectionStatus(state);
        console.log("🔄 Peer connection state:", state);

        if (state === "connected") {
          setIsAdminStreaming(true);
          console.log("✅ WebRTC connection established");
        } else if (state === "disconnected" || state === "failed") {
          setIsAdminStreaming(false);
          setAdminStream(null);
          console.log("❌ WebRTC connection lost");
        } else if (state === "closed") {
          setIsAdminStreaming(false);
          setAdminStream(null);
          console.log("🔒 WebRTC connection closed");
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("🧊 ICE connection state:", pc.iceConnectionState);
      };

      pc.onsignalingstatechange = () => {
        console.log("📡 Signaling state:", pc.signalingState);
      };

      // If admin, add tracks immediately
      if (isAdmin && streamRef.current) {
        console.log("🎥 Admin: Adding tracks to peer connection");
        streamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, streamRef.current!);
        });
        console.log("✅ Admin tracks added");
      }

      peerConnectionRef.current = pc;
      setPeerConnection(pc);
      return pc;
    } catch (error) {
      console.error("❌ Error creating peer connection:", error);
      return null;
    }
  }, []);

  // Process pending ICE candidates
  const processPendingCandidates = useCallback(
    async (pc: RTCPeerConnection) => {
      if (pendingCandidatesRef.current.length > 0) {
        console.log(
          `📨 Processing ${pendingCandidatesRef.current.length} pending ICE candidates`
        );
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("✅ Added pending ICE candidate");
          } catch (error) {
            console.error("❌ Error adding pending ICE candidate:", error);
          }
        }
        pendingCandidatesRef.current = [];
      }
    },
    []
  );

  // Update the useEffect with signaling callbacks
  useEffect(() => {
    const callbacks = {
      onConnected: () => {
        console.log("✅ Signaling connected");
        setConnectionStatus("Connected to signaling");
      },
      onDisconnected: () => {
        console.log("❌ Signaling disconnected");
        setConnectionStatus("Disconnected from signaling");
        setIsAdminStreaming(false);
        setAdminStream(null);
      },
      onError: (error: string) => {
        console.error("❌ Signaling error:", error);
        setConnectionStatus(`Error: ${error}`);
      },
      onJoined: (data: any) => {
        console.log("✅ Joined room successfully", data);
        setConnectionStatus("Joined room - waiting for stream");

        // If admin, create offer after joining
        if (isAdminRef.current) {
          setTimeout(async () => {
            try {
              const pc = peerConnectionRef.current;
              if (!pc) return;

              console.log("📤 Admin: Creating offer...");
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              signaling.sendOffer(offer, roomIdRef.current);
              console.log("✅ Admin: Offer created and sent");
            } catch (error) {
              console.error("❌ Error creating offer:", error);
            }
          }, 1000);
        }
      },
      onUserJoined: (data: any) => {
        console.log("👤 User joined room:", data);
        // If admin and a user joins, re-send the offer
        if (isAdminRef.current && peerConnectionRef.current) {
          setTimeout(async () => {
            try {
              console.log("📤 Admin: Sending offer to new user");
              const offer = await peerConnectionRef.current!.createOffer();
              await peerConnectionRef.current!.setLocalDescription(offer);
              signaling.sendOffer(offer, roomIdRef.current);
            } catch (error) {
              console.error("❌ Error sending offer to new user:", error);
            }
          }, 500);
        }
      },
      onOffer: async (
        offer: RTCSessionDescriptionInit,
        roomId: string,
        senderId?: string
      ) => {
        if (roomId !== roomIdRef.current || isAdminRef.current) return;

        console.log("📨 Offer received from admin:", senderId);
        try {
          const pc = peerConnectionRef.current;
          if (!pc) {
            console.error("❌ No peer connection available");
            return;
          }

          console.log("🔄 Setting remote description...");
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          console.log("✅ Remote description set");

          // Process any pending ICE candidates
          await processPendingCandidates(pc);

          console.log("📤 Creating answer...");
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signaling.sendAnswer(answer, roomId);
          console.log("✅ Answer sent to admin");
        } catch (error) {
          console.error("❌ Error handling offer:", error);
        }
      },
      onAnswer: async (
        answer: RTCSessionDescriptionInit,
        roomId: string,
        senderId?: string
      ) => {
        if (roomId !== roomIdRef.current || !isAdminRef.current) return;

        console.log("📨 Answer received from user:", senderId);
        try {
          const pc = peerConnectionRef.current;
          if (!pc) return;

          console.log("🔄 Setting remote description...");
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("✅ Remote description set");

          // Process any pending ICE candidates
          await processPendingCandidates(pc);
        } catch (error) {
          console.error("❌ Error handling answer:", error);
        }
      },
      onIceCandidate: async (
        candidate: RTCIceCandidateInit,
        roomId: string,
        senderId?: string
      ) => {
        if (roomId !== roomIdRef.current) return;

        console.log("🧊 ICE candidate received from:", senderId);
        try {
          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("✅ ICE candidate added");
          } else {
            console.log("📥 Storing ICE candidate for later");
            pendingCandidatesRef.current.push(candidate);
          }
        } catch (error) {
          console.error("❌ Error adding ICE candidate:", error);
        }
      },
      onChatMessage: (messageData: any, roomId: string) => {
        if (roomId === roomIdRef.current) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: messageData.sender,
              message: messageData.message,
              timestamp: new Date(messageData.timestamp),
              isStaff: messageData.sender === "Admin",
            },
          ]);
        }
      },
    };

    signaling.setCallbacks(callbacks);

    return () => {
      signaling.disconnect();
    };
  }, [processPendingCandidates]);

  const connectToRoom = useCallback(
    async (roomId: string, isAdmin: boolean = false) => {
      if (isConnectingRef.current) {
        console.log("⚠️ Already connecting, skipping...");
        return;
      }

      isConnectingRef.current = true;
      setConnectionStatus("Connecting...");

      try {
        console.log(
          `🚀 Connecting to room: ${roomId} as ${isAdmin ? "admin" : "viewer"}`
        );

        // Set role and room first
        isAdminRef.current = isAdmin;
        roomIdRef.current = roomId;

        // Initialize peer connection with the correct role
        const pc = initializePeerConnection(isAdmin);
        if (!pc) {
          throw new Error("Failed to initialize WebRTC peer connection");
        }

        // Connect to signaling server
        console.log("🔌 Connecting to signaling server...");
        await signaling.connect();
        console.log("✅ Signaling server connected");

        // Join the room
        console.log(`🎯 Joining room: ${roomId}`);
        await signaling.joinRoom(roomId, isAdmin);

        setConnectionStatus("Connected to room");
        console.log("✅ Room connection completed successfully");
      } catch (error) {
        console.error("❌ Error connecting to room:", error);
        setConnectionStatus(
          `Connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        throw error;
      } finally {
        isConnectingRef.current = false;
      }
    },
    [initializePeerConnection]
  );

  const disconnectFromRoom = useCallback(() => {
    console.log("🔌 Disconnecting from room");

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.log("Error closing peer connection:", e);
      }
      peerConnectionRef.current = null;
      setPeerConnection(null);
    }

    signaling.disconnect();
    setAdminStream(null);
    setIsAdminStreaming(false);
    setConnectionStatus("Disconnected");

    pendingCandidatesRef.current = [];
    isConnectingRef.current = false;
    roomIdRef.current = "";

    console.log("✅ Disconnected from room");
  }, []);

  const sendChatMessage = useCallback((message: string, sender: string) => {
    if (roomIdRef.current) {
      signaling.sendChatMessage(message, sender, roomIdRef.current);
    }
  }, []);

  const setAdminStreamHandler = useCallback((stream: MediaStream | null) => {
    streamRef.current = stream;
    setAdminStream(stream);

    // If we have a stream and are admin, add tracks to existing peer connection
    if (stream && isAdminRef.current && peerConnectionRef.current) {
      console.log("🎥 Adding tracks to existing admin peer connection");
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current!.addTrack(track, stream);
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromRoom();
    };
  }, [disconnectFromRoom]);

  return (
    <VideoStreamContext.Provider
      value={{
        adminStream,
        setAdminStream: setAdminStreamHandler,
        isAdminStreaming,
        setIsAdminStreaming,
        peerConnection,
        connectToRoom,
        disconnectFromRoom,
        connectionStatus,
        sendChatMessage,
        chatMessages,
      }}
    >
      {children}
    </VideoStreamContext.Provider>
  );
};

export const useVideoStream = () => useContext(VideoStreamContext);
