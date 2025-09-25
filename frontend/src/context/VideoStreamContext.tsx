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
import axiosInstance from "../lib/axiosInstance";
import { BASE_URL } from "../utils/constants";

type ChatMessage = {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isStaff: boolean;
  profileUrl?: string;
  senderId?: string;
};

type UserInfo = {
  _id: string;
  fullname: string;
  email: string;
  profilePicture?: string;
  isAdmin: boolean;
  verified: boolean;
};

type VideoStreamContextType = {
  adminStream: MediaStream | null;
  setAdminStream: (stream: MediaStream | null) => void;
  isAdminStreaming: boolean;
  setIsAdminStreaming: (isStreaming: boolean) => void;
  peerConnection: RTCPeerConnection | null;
  connectToRoom: (roomId: string, isAdmin: boolean) => Promise<void>;
  disconnectFromRoom: () => void;
  connectionStatus: string;
  sendChatMessage: (
    message: string,
    sender: string,
    profileUrl?: string
  ) => void;
  chatMessages: ChatMessage[];
  currentUser: UserInfo | null;
  fetchCurrentUser: () => Promise<void>;
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
  currentUser: null,
  fetchCurrentUser: async () => {},
});

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isAdminRef = useRef<boolean>(false);
  const roomIdRef = useRef<string>("");
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isConnectingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const hasRemoteDescriptionRef = useRef<boolean>(false);

  // Helper function to get profile picture URL (handles Cloudinary URLs)
  const getProfilePictureUrl = (profilePicture: string | undefined): string => {
    if (
      !profilePicture ||
      profilePicture === "undefined" ||
      profilePicture.trim() === ""
    ) {
      return "/placeholder-user.png";
    }

    // If it's a base64 image, return as is
    if (profilePicture.startsWith("data:image")) {
      return profilePicture;
    }

    // If it's a full URL (Cloudinary, http, https), return as is
    if (
      profilePicture.startsWith("http") ||
      profilePicture.startsWith("//") ||
      profilePicture.includes("cloudinary")
    ) {
      return profilePicture;
    }

    // Otherwise, treat as relative path from uploads
    return `${BASE_URL}${
      profilePicture.startsWith("/") ? "" : "/"
    }${profilePicture}`;
  };

  // Fetch current user data from backend
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log("No access token found");
        setCurrentUser(null);
        return;
      }

      const response = await axiosInstance.get(
        `${BASE_URL}/api/users/current-user`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.user) {
        const userData: UserInfo = {
          _id: response.data.user._id,
          fullname: response.data.user.fullname,
          email: response.data.user.email,
          profilePicture: response.data.user.profilePicture,
          isAdmin: response.data.user.isAdmin || false,
          verified: response.data.user.verified || false,
        };

        setCurrentUser(userData);

        // Update localStorage with fresh user data
        localStorage.setItem("user", JSON.stringify(userData));

        console.log("Current user fetched:", {
          name: userData.fullname,
          email: userData.email,
          isAdmin: userData.isAdmin,
          profilePicture: userData.profilePicture ? "Yes" : "No",
        });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setCurrentUser(null);
      // Clear invalid token
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response?.status === 401
      ) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Initialize user data on component mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchCurrentUser();
    } else {
      // Try to get user from localStorage as fallback
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user._id && user.fullname) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem("user");
          }
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          localStorage.removeItem("user");
        }
      }
    }
  }, [fetchCurrentUser]);

  // Get user info with proper fallbacks
  const getUserInfo = useCallback(() => {
    if (currentUser) {
      return {
        name: currentUser.fullname,
        fullname: currentUser.fullname,
        profilePicture: getProfilePictureUrl(currentUser.profilePicture),
        userId: currentUser._id,
        isAdmin: currentUser.isAdmin,
        email: currentUser.email,
      };
    }

    // Fallback for non-authenticated users
    return {
      name: "Anonymous User",
      fullname: "Anonymous User",
      profilePicture: "/placeholder-user.png",
      userId: `guest-${Date.now()}`,
      isAdmin: false,
      email: "",
    };
  }, [currentUser]);

  // Initialize peer connection
  const initializePeerConnection = useCallback((isAdmin: boolean) => {
    console.log(
      `Initializing peer connection as ${isAdmin ? "admin" : "viewer"}`
    );

    if (peerConnectionRef.current) {
      console.log("Cleaning up existing peer connection");
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
          console.log("Generated ICE candidate");
          signaling.sendICECandidate(
            event.candidate.toJSON(),
            roomIdRef.current
          );
        } else if (!event.candidate) {
          console.log("All ICE candidates generated");
        }
      };

      pc.ontrack = (event) => {
        console.log("Track received:", event.track.kind);
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          console.log(
            "Stream received with tracks:",
            stream.getTracks().length
          );

          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            setAdminStream(stream);
            setIsAdminStreaming(true);
            setConnectionStatus("Stream connected");
          }
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        setConnectionStatus(state);
        console.log("Peer connection state:", state);

        if (state === "connected") {
          setIsAdminStreaming(true);
          console.log("WebRTC connection established");
        } else if (state === "disconnected" || state === "failed") {
          setIsAdminStreaming(false);
          console.log("WebRTC connection lost");
        } else if (state === "closed") {
          setIsAdminStreaming(false);
          setAdminStream(null);
          console.log("WebRTC connection closed");
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      pc.onsignalingstatechange = () => {
        console.log("Signaling state:", pc.signalingState);
        hasRemoteDescriptionRef.current = pc.remoteDescription !== null;
      };

      if (isAdmin && streamRef.current) {
        console.log("Admin: Adding tracks to peer connection");
        streamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, streamRef.current!);
        });
      }

      peerConnectionRef.current = pc;
      setPeerConnection(pc);
      hasRemoteDescriptionRef.current = false;
      return pc;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      return null;
    }
  }, []);

  // Process pending ICE candidates
  const processPendingCandidates = useCallback(
    async (pc: RTCPeerConnection) => {
      if (pendingCandidatesRef.current.length > 0) {
        console.log(
          `Processing ${pendingCandidatesRef.current.length} pending ICE candidates`
        );
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error("Error adding pending ICE candidate:", error);
          }
        }
        pendingCandidatesRef.current = [];
      }
    },
    []
  );

  // Handle WebRTC signaling
  useEffect(() => {
    const callbacks = {
      onConnected: () => {
        console.log("Signaling connected");
        setConnectionStatus("Connected to signaling");
      },

      onDisconnected: () => {
        console.log("Signaling disconnected");
        setConnectionStatus("Disconnected from signaling");
        setIsAdminStreaming(false);
      },

      onError: (error: string) => {
        console.error("Signaling error:", error);
        setConnectionStatus(`Error: ${error}`);
      },

      onJoined: (data: any) => {
        console.log("Joined room successfully", data);
        setConnectionStatus("Joined room - waiting for stream");

        if (isAdminRef.current) {
          setTimeout(async () => {
            try {
              const pc = peerConnectionRef.current;
              if (!pc) return;

              console.log("Admin: Creating offer...");
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              signaling.sendOffer(offer, roomIdRef.current);
            } catch (error) {
              console.error("Error creating offer:", error);
            }
          }, 1000);
        }
      },

      onUserJoined: (data: any) => {
        console.log("User joined room:", data);
        if (isAdminRef.current && peerConnectionRef.current) {
          setTimeout(async () => {
            try {
              console.log("Admin: Sending offer to new user");
              const offer = await peerConnectionRef.current!.createOffer();
              await peerConnectionRef.current!.setLocalDescription(offer);
              signaling.sendOffer(offer, roomIdRef.current);
            } catch (error) {
              console.error("Error sending offer to new user:", error);
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

        console.log("Offer received from admin");
        try {
          const pc = peerConnectionRef.current;
          if (!pc) {
            console.error("No peer connection available");
            return;
          }

          if (pc.signalingState !== "stable") {
            console.log("Signaling not stable, waiting...");
            setTimeout(() => callbacks.onOffer(offer, roomId, senderId), 1000);
            return;
          }

          console.log("Setting remote description...");
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          console.log("Remote description set");

          await processPendingCandidates(pc);

          console.log("Creating answer...");
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signaling.sendAnswer(answer, roomId);
        } catch (error) {
          console.error("Error handling offer:", error);
        }
      },

      onAnswer: async (
        answer: RTCSessionDescriptionInit,
        roomId: string,
        senderId?: string
      ) => {
        if (roomId !== roomIdRef.current || !isAdminRef.current) return;

        console.log("Answer received from user");
        try {
          const pc = peerConnectionRef.current;
          if (!pc) return;

          if (pc.signalingState !== "have-local-offer") {
            console.warn(
              "Cannot set remote answer in current state:",
              pc.signalingState
            );
            return;
          }

          console.log("Setting remote description...");
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("Remote description set");

          await processPendingCandidates(pc);
        } catch (error) {
          console.error("Error handling answer:", error);
        }
      },

      onIceCandidate: async (
        candidate: RTCIceCandidateInit,
        roomId: string,
        senderId?: string
      ) => {
        if (roomId !== roomIdRef.current) return;

        console.log("ICE candidate received");
        try {
          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            console.log("Storing ICE candidate for later");
            pendingCandidatesRef.current.push(candidate);
          }
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      },

      onChatMessage: (messageData: any, roomId: string) => {
        if (roomId === roomIdRef.current) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + Math.random().toString(36).slice(2),
              sender: messageData.sender || "Unknown",
              message: messageData.message,
              timestamp: new Date(messageData.timestamp || Date.now()),
              isStaff: messageData.isStaff || messageData.isAdmin || false,
              profileUrl: getProfilePictureUrl(messageData.profileUrl),
              senderId: messageData.senderId,
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
        console.log("Already connecting, skipping...");
        return;
      }

      isConnectingRef.current = true;
      setConnectionStatus("Connecting...");

      try {
        console.log(
          `Connecting to room: ${roomId} as ${isAdmin ? "admin" : "viewer"}`
        );

        isAdminRef.current = isAdmin;
        roomIdRef.current = roomId;

        const pc = initializePeerConnection(isAdmin);
        if (!pc) {
          throw new Error("Failed to initialize WebRTC peer connection");
        }

        await signaling.connect();

        // Get current user info
        const userInfo = getUserInfo();
        console.log("Joining with user info:", userInfo);

        await signaling.joinRoom(roomId, isAdmin, {
          name: userInfo.fullname,
          profilePicture: userInfo.profilePicture,
          userId: userInfo.userId,
        });

        setConnectionStatus("Connected to room");
      } catch (error) {
        console.error("Error connecting to room:", error);
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
    [initializePeerConnection, getUserInfo]
  );

  const disconnectFromRoom = useCallback(() => {
    console.log("Disconnecting from room");

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
    hasRemoteDescriptionRef.current = false;

    console.log("Disconnected from room");
  }, []);

  const sendChatMessage = useCallback(
    (message: string, _sender: string, _profileUrl?: string) => {
      if (roomIdRef.current && currentUser) {
        const userInfo = getUserInfo();
        signaling.sendChatMessage(
          message,
          userInfo.fullname,
          roomIdRef.current,
          userInfo.profilePicture
        );
      }
    },
    [currentUser, getUserInfo]
  );

  const setAdminStreamHandler = useCallback((stream: MediaStream | null) => {
    streamRef.current = stream;
    setAdminStream(stream);

    if (stream && isAdminRef.current && peerConnectionRef.current) {
      const senders = peerConnectionRef.current.getSenders();
      senders.forEach((sender) => {
        if (sender.track) {
          peerConnectionRef.current!.removeTrack(sender);
        }
      });

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
        currentUser,
        fetchCurrentUser,
      }}
    >
      {children}
    </VideoStreamContext.Provider>
  );
};

export const useVideoStream = () => useContext(VideoStreamContext);
