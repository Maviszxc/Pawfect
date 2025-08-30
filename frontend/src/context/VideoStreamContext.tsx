"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { signaling } from "@/utils/websocketSignaling";

type VideoStreamContextType = {
  adminStream: MediaStream | null;
  setAdminStream: (stream: MediaStream | null) => void;
  isAdminStreaming: boolean;
  setIsAdminStreaming: (isStreaming: boolean) => void;
  peerConnection: RTCPeerConnection | null;
  createOffer: () => Promise<void>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<void>;
  addICECandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  connectToRoom: (roomId: string, isAdmin: boolean) => Promise<void>;
  disconnectFromRoom: () => void;
  connectionStatus: string;
};

const VideoStreamContext = createContext<VideoStreamContextType>({
  adminStream: null,
  setAdminStream: () => {},
  isAdminStreaming: false,
  setIsAdminStreaming: () => {},
  peerConnection: null,
  createOffer: async () => {},
  createAnswer: async () => {},
  addICECandidate: async () => {},
  connectToRoom: async () => {},
  disconnectFromRoom: () => {},
  connectionStatus: "Disconnected",
});

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
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
  const [roomId, setRoomId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isAdminRef = useRef<boolean>(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const connectionAttempts = useRef(0);
  const MAX_CONNECTION_ATTEMPTS = 5;
  const CONNECTION_RESET_TIMEOUT = 60000;

  const initializePeerConnection = () => {
    if (typeof window === "undefined") {
      console.log("Cannot initialize peer connection: window is undefined");
      return null;
    }

    if (!window.RTCPeerConnection) {
      console.error("RTCPeerConnection is not supported in this browser");
      setConnectionStatus("WebRTC not supported");
      return null;
    }

    if (connectionAttempts.current >= MAX_CONNECTION_ATTEMPTS) {
      console.error(
        `Too many connection attempts (${connectionAttempts.current}). Please refresh the page.`
      );
      setConnectionStatus("Too many connection attempts");
      return null;
    }

    connectionAttempts.current += 1;
    console.log(
      `Connection attempt ${connectionAttempts.current} of ${MAX_CONNECTION_ATTEMPTS}`
    );

    setTimeout(() => {
      console.log("Resetting connection attempts counter");
      connectionAttempts.current = 0;
    }, CONNECTION_RESET_TIMEOUT);

    if (peerConnectionRef.current) {
      console.log("Closing existing peer connection");
      try {
        const currentState = peerConnectionRef.current.connectionState;
        console.log(`Current connection state before closing: ${currentState}`);
        peerConnectionRef.current.close();
        console.log("Existing peer connection closed successfully");
      } catch (error) {
        console.error("Error closing existing peer connection:", error);
      }
    }

    console.log("Creating new RTCPeerConnection");
    let pc;
    try {
      pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
      });
      console.log("RTCPeerConnection created successfully");
    } catch (error) {
      console.error("Failed to create RTCPeerConnection:", error);
      setConnectionStatus("Failed to create connection");
      return null;
    }

    pc.ontrack = (event) => {
      console.log("Received track", event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log("Setting adminStream from ontrack event");
        setAdminStream(event.streams[0]);
        setIsAdminStreaming(true);
        setConnectionStatus("Streaming");
      } else {
        console.warn("Received track without associated stream");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        console.log("Generated ICE candidate");
        signaling.sendICECandidate(event.candidate, roomId);
      } else if (!event.candidate) {
        console.log("ICE candidate gathering complete");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed to", pc.connectionState);
      setConnectionStatus(pc.connectionState);

      if (pc.connectionState === "connected") {
        console.log("WebRTC peer connection established successfully");
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        console.log("WebRTC peer connection disconnected or failed");
        setIsAdminStreaming(false);
        setAdminStream(null);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed to:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.error("ICE connection failed - may need to restart ICE");
      } else if (pc.iceConnectionState === "disconnected") {
        console.log("ICE connection disconnected - may recover automatically");
      }
    };

    pc.onsignalingstatechange = () => {
      console.log("Signaling state changed to:", pc.signalingState);
    };

    if (pc) {
      peerConnectionRef.current = pc;
      setPeerConnection(pc);
      return pc;
    }
    return null;
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current || isAdminRef.current) {
      console.log("Cannot handle offer: not a viewer or no peer connection");
      return;
    }

    console.log("Handling offer as viewer");
    await createAnswer(offer);
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current || !isAdminRef.current) {
      console.log("Cannot handle answer: not an admin or no peer connection");
      return;
    }

    console.log("Handling answer as admin");
    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
      processPendingIceCandidates(peerConnectionRef.current);
    } catch (error) {
      console.error("Error setting remote description:", error);
    }
  };
  const handleICECandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) {
      console.log("Cannot handle ICE candidate: no peer connection");
      return;
    }

    console.log("Handling ICE candidate");
    if (peerConnectionRef.current.remoteDescription) {
      try {
        await peerConnectionRef.current.addIceCandidate(candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    } else {
      pendingIceCandidates.current.push(candidate);
      console.log("Stored ICE candidate for later processing");
    }
  };

  // Add this useEffect to monitor connection status
  useEffect(() => {
    const checkConnectionHealth = () => {
      if (peerConnectionRef.current) {
        const state = peerConnectionRef.current.connectionState;
        if (state === "disconnected" || state === "failed") {
          console.log("Connection unhealthy, attempting to reconnect...");
          // Implement reconnection logic if needed
        }
      }
    };

    const healthCheckInterval = setInterval(checkConnectionHealth, 5000);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, []);

  useEffect(() => {
    signaling.onOffer(async (offer, offerRoomId) => {
      if (
        offerRoomId === roomId &&
        peerConnectionRef.current &&
        !isAdminRef.current
      ) {
        console.log("Offer received");
        await createAnswer(offer);
      }
    });

    signaling.onAnswer(async (answer, answerRoomId) => {
      if (
        answerRoomId === roomId &&
        peerConnectionRef.current &&
        isAdminRef.current
      ) {
        console.log("Answer received", answer);
        try {
          await peerConnectionRef.current.setRemoteDescription(answer);
          processPendingIceCandidates(peerConnectionRef.current);
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    });

    signaling.onICECandidate(async (candidate, candidateRoomId) => {
      if (candidateRoomId === roomId && peerConnectionRef.current) {
        console.log("ICE candidate received", candidate);

        if (peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.addIceCandidate(candidate);
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        } else {
          pendingIceCandidates.current.push(candidate);
          console.log("Stored ICE candidate for later processing");
        }
      }
    });

    return () => {
      signaling.disconnect();
    };
  }, [roomId]);

  const connectToRoom = async (
    newRoomId: string,
    isAdminRole: boolean = false
  ): Promise<void> => {
    if (!newRoomId) {
      console.warn("[DEBUG] Cannot connect to room: roomId is missing");
      return;
    }

    console.log(
      "[DEBUG] Connecting to room",
      newRoomId,
      "as",
      isAdminRole ? "admin" : "client"
    );

    // Set connection status immediately
    setConnectionStatus("Connecting to signaling server");

    try {
      // Check if signaling server is reachable first
      const isServerReachable = await signaling.checkServerStatus();
      if (!isServerReachable) {
        setConnectionStatus("Signaling server offline");
        throw new Error("Signaling server is not reachable");
      } else if (signaling.isConnecting()) {
        console.log(
          "[DEBUG] Already connecting to signaling server, waiting..."
        );
        // Wait for connection to complete or fail
        await new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (signaling.isConnected()) {
              clearInterval(checkInterval);
              resolve(true);
            } else if (!signaling.isConnecting()) {
              clearInterval(checkInterval);
              reject(new Error("Connection attempt failed"));
            }
          }, 500);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Timed out waiting for connection"));
          }, 10000);
        });
      }

      // Continue with room connection
      await continueRoomConnection(newRoomId);
    } catch (error) {
      console.error("[DEBUG] Error in connectToRoom:", error);
      setConnectionStatus("Connection failed");
      throw error;
    }
  };

  // Improved continueRoomConnection function with better error handling
  const continueRoomConnection = async (newRoomId: string) => {
    // Initialize peer connection with retry logic
    let pc: RTCPeerConnection | null = null;
    let retryCount = 0;
    const maxRetries = 2;

    while (!pc && retryCount <= maxRetries) {
      try {
        pc = initializePeerConnection();
        if (!pc) {
          throw new Error("Failed to initialize peer connection");
        }
      } catch (error) {
        retryCount++;
        console.error(
          `Peer connection initialization failed (attempt ${retryCount}/${
            maxRetries + 1
          }):`,
          error
        );

        if (retryCount <= maxRetries) {
          console.log(`Retrying peer connection initialization in 1 second...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          setConnectionStatus("Connection failed - browser issue");
          throw new Error(
            "Failed to initialize peer connection after multiple attempts"
          );
        }
      }
    }

    setPeerConnection(pc);
    peerConnectionRef.current = pc;

    try {
      // Join the signaling room with retry logic
      let joinRetryCount = 0;
      const maxJoinRetries = 2;
      let joinSuccess = false;

      while (!joinSuccess && joinRetryCount <= maxJoinRetries) {
        try {
          await signaling.joinRoom(newRoomId);
          joinSuccess = true;
          setConnectionStatus("Connecting");
        } catch (error) {
          joinRetryCount++;
          console.error(
            `Error joining signaling room (attempt ${joinRetryCount}/${
              maxJoinRetries + 1
            }):`,
            error
          );

          if (joinRetryCount <= maxJoinRetries) {
            console.log(`Retrying room join in 1 second...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            setConnectionStatus("Failed to join room");
            throw error;
          }
        }
      }

      // Add tracks if admin
      if (isAdminRef.current && adminStream) {
        console.log("Admin is adding tracks to peer connection");
        try {
          adminStream.getTracks().forEach((track) => {
            console.log(`Adding track: ${track.kind}`);
            pc!.addTrack(track, adminStream);
          });

          if (isAdminRef.current) {
            createOffer();
          }
        } catch (trackError) {
          console.error("Error adding media tracks:", trackError);
          // Continue despite track errors - might still work for some tracks
        }
      }
    } catch (error) {
      console.error("Fatal error in room connection:", error);
      setConnectionStatus("Connection failed");
      throw error;
    }
  };

  const disconnectFromRoom = () => {
    console.log("Disconnecting from room:", roomId);
    setConnectionStatus("Disconnecting...");

    // Clean up peer connection
    if (peerConnectionRef.current) {
      try {
        // Remove all tracks
        const senders = peerConnectionRef.current.getSenders();
        senders.forEach((sender) => {
          try {
            peerConnectionRef.current?.removeTrack(sender);
          } catch (trackError) {
            console.warn("Error removing track:", trackError);
          }
        });

        // Close the connection
        peerConnectionRef.current.close();
      } catch (error) {
        console.error("Error closing peer connection:", error);
      }
      peerConnectionRef.current = null;
      setPeerConnection(null);
    }

    // Reset streams and state
    if (adminStream) {
      try {
        adminStream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.warn("Error stopping admin stream tracks:", error);
      }
      setAdminStream(null);
    }

    setIsAdminStreaming(false);
    setRoomId("");
    pendingIceCandidates.current = [];

    // Disconnect from signaling server
    signaling.disconnect();
    setConnectionStatus("Disconnected");
  };

  const processPendingIceCandidates = async (pc: RTCPeerConnection) => {
    if (!pc || !pc.remoteDescription) {
      console.log(
        "Cannot process ICE candidates: No peer connection or remote description not set"
      );
      return;
    }

    if (pendingIceCandidates.current.length > 0) {
      console.log(
        "Processing",
        pendingIceCandidates.current.length,
        "pending ICE candidates"
      );

      // Create a copy of the pending candidates and clear the original array
      const candidatesToProcess = [...pendingIceCandidates.current];
      pendingIceCandidates.current = [];

      // Process each candidate
      const failedCandidates = [];
      for (const candidate of candidatesToProcess) {
        try {
          const iceCandidate = new RTCIceCandidate(candidate);
          await pc.addIceCandidate(iceCandidate);
          console.log("Successfully added pending ICE candidate");
        } catch (error) {
          console.error("Error adding pending ICE candidate:", error);
          failedCandidates.push(candidate);
        }
      }

      // Add back any failed candidates for future retry
      if (failedCandidates.length > 0) {
        console.log(
          `${failedCandidates.length} candidates failed to add, will retry later`
        );
        pendingIceCandidates.current.push(...failedCandidates);
      }
    }
  };

  const createOffer = async () => {
    if (!peerConnectionRef.current) {
      console.error("Cannot create offer: No peer connection");
      return;
    }

    try {
      // Check if connection is stable before creating offer
      if (peerConnectionRef.current.signalingState === "stable") {
        console.log("Creating offer...");
        const offer = await peerConnectionRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
          iceRestart: false, // Don't force ICE restart on initial offer
        });

        await peerConnectionRef.current.setLocalDescription(offer);

        // Wait a short time to ensure ICE gathering is complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Send the offer with the current local description
        const currentOffer =
          peerConnectionRef.current.localDescription || offer;
        signaling.sendOffer(currentOffer, roomId);
        console.log("Offer created and sent");
      } else {
        console.warn(
          "Cannot create offer: Signaling state is not stable",
          peerConnectionRef.current.signalingState
        );
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      setConnectionStatus("Error creating connection");
    }
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      console.error("Cannot create answer: No peer connection");
      return;
    }

    try {
      console.log("Setting remote description from offer...");
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Process any pending ICE candidates we received before the offer
      await processPendingIceCandidates(peerConnectionRef.current);

      // Check if we can create an answer
      if (
        peerConnectionRef.current.signalingState === "have-remote-offer" ||
        peerConnectionRef.current.signalingState === "have-local-pranswer"
      ) {
        console.log("Creating answer...");
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        // Wait a short time to ensure ICE gathering is complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Send the answer with the current local description
        const currentAnswer =
          peerConnectionRef.current.localDescription || answer;
        signaling.sendAnswer(currentAnswer, roomId);
        console.log("Answer created and sent");
      } else {
        console.warn(
          "Cannot create answer: Signaling state is not appropriate",
          peerConnectionRef.current.signalingState
        );
      }
    } catch (error) {
      console.error("Error creating answer:", error);
      setConnectionStatus("Error establishing connection");
    }
  };

  const addICECandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) {
      console.error("Cannot add ICE candidate: No peer connection");
      // Store the candidate for later use when peer connection is established
      pendingIceCandidates.current.push(candidate);
      console.log("ICE candidate stored for later use");
      return;
    }

    try {
      // Create proper RTCIceCandidate object
      const iceCandidate = new RTCIceCandidate(candidate);
      await peerConnectionRef.current.addIceCandidate(iceCandidate);
      console.log("ICE candidate added successfully");
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
      // Store failed candidates for retry
      pendingIceCandidates.current.push(candidate);
    }
  };

  return (
    <VideoStreamContext.Provider
      value={{
        adminStream,
        setAdminStream,
        isAdminStreaming,
        setIsAdminStreaming,
        peerConnection,
        createOffer,
        createAnswer,
        addICECandidate,
        connectToRoom,
        disconnectFromRoom,
        connectionStatus,
      }}
    >
      {children}
    </VideoStreamContext.Provider>
  );
};

export const useVideoStream = () => useContext(VideoStreamContext);
