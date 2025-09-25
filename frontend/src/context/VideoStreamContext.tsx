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
  peerConnections: Map<string, RTCPeerConnection>;
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
  connectedUsers: Set<string>;
  viewerCount: number;
  totalParticipants: number;
};

const VideoStreamContext = createContext<VideoStreamContextType>({
  adminStream: null,
  setAdminStream: () => {},
  isAdminStreaming: false,
  setIsAdminStreaming: () => {},
  peerConnections: new Map(),
  connectToRoom: async () => {},
  disconnectFromRoom: () => {},
  connectionStatus: "Disconnected",
  sendChatMessage: () => {},
  chatMessages: [],
  currentUser: null,
  fetchCurrentUser: async () => {},
  connectedUsers: new Set(),
  viewerCount: 0,
  totalParticipants: 0,
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
  const [peerConnections, setPeerConnections] = useState<
    Map<string, RTCPeerConnection>
  >(new Map());
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);

  // Refs for stable references
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const isAdminRef = useRef<boolean>(false);
  const roomIdRef = useRef<string>("");
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map()
  );
  const isConnectingRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const localSocketIdRef = useRef<string>("");

  // Helper function to get profile picture URL
  const getProfilePictureUrl = (profilePicture: string | undefined): string => {
    if (
      !profilePicture ||
      profilePicture === "undefined" ||
      profilePicture.trim() === ""
    ) {
      return "/placeholder-user.png";
    }

    if (profilePicture.startsWith("data:image")) {
      return profilePicture;
    }

    if (
      profilePicture.startsWith("http") ||
      profilePicture.startsWith("//") ||
      profilePicture.includes("cloudinary")
    ) {
      return profilePicture;
    }

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

    return {
      name: "Anonymous User",
      fullname: "Anonymous User",
      profilePicture: "/placeholder-user.png",
      userId: `guest-${Date.now()}`,
      isAdmin: false,
      email: "",
    };
  }, [currentUser]);

  // Create peer connection for a specific user
  const createPeerConnection = useCallback(
    (userId: string): RTCPeerConnection | null => {
      try {
        console.log(`Creating peer connection for user: ${userId}`);

        const pc = new RTCPeerConnection({
          iceServers: ICE_SERVERS,
          iceCandidatePoolSize: 10,
        });

        pc.onicecandidate = (event) => {
          if (event.candidate && roomIdRef.current) {
            console.log(`Sending ICE candidate to ${userId}`);
            signaling.sendICECandidate(
              event.candidate.toJSON(),
              roomIdRef.current,
              userId
            );
          }
        };

        pc.ontrack = (event) => {
          console.log(`Received track from ${userId}:`, event.track.kind);
          if (event.streams && event.streams[0] && !isAdminRef.current) {
            const stream = event.streams[0];
            console.log(`Setting admin stream from ${userId}`);
            setAdminStream(stream);
            setIsAdminStreaming(true);
            setConnectionStatus("Stream connected");
          }
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log(`Peer connection state for ${userId}: ${state}`);

          if (state === "connected") {
            setConnectedUsers((prev) => new Set(prev).add(userId));
            if (!isAdminRef.current) {
              setConnectionStatus("Connected to stream");
            }
          } else if (state === "disconnected" || state === "failed") {
            setConnectedUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });

            if (userId === "admin" || peerConnectionsRef.current.size === 0) {
              setIsAdminStreaming(false);
              setAdminStream(null);
              setConnectionStatus("Stream disconnected");
            }
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log(
            `ICE connection state for ${userId}: ${pc.iceConnectionState}`
          );
        };

        // Add local stream if admin
        if (isAdminRef.current && streamRef.current) {
          console.log(`Adding local stream tracks to connection for ${userId}`);
          streamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, streamRef.current!);
          });
        }

        // Store peer connection
        peerConnectionsRef.current.set(userId, pc);
        setPeerConnections(new Map(peerConnectionsRef.current));

        return pc;
      } catch (error) {
        console.error(`Error creating peer connection for ${userId}:`, error);
        return null;
      }
    },
    []
  );

  // Process pending ICE candidates for a specific user
  const processPendingCandidates = useCallback(
    async (userId: string, pc: RTCPeerConnection) => {
      const candidates = pendingCandidatesRef.current.get(userId) || [];
      if (candidates.length > 0) {
        console.log(
          `Processing ${candidates.length} pending ICE candidates for ${userId}`
        );

        for (const candidate of candidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error(`Error adding ICE candidate for ${userId}:`, error);
          }
        }

        pendingCandidatesRef.current.delete(userId);
      }
    },
    []
  );

  // Remove peer connection for a user
  const removePeerConnection = useCallback((userId: string) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      try {
        pc.close();
      } catch (error) {
        console.error(`Error closing peer connection for ${userId}:`, error);
      }

      peerConnectionsRef.current.delete(userId);
      setPeerConnections(new Map(peerConnectionsRef.current));
      pendingCandidatesRef.current.delete(userId);

      setConnectedUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      console.log(`Removed peer connection for ${userId}`);
    }
  }, []);

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
        localSocketIdRef.current = data.clientId || "";

        // Update participant counts from room info
        if (data.roomInfo) {
          setViewerCount(data.roomInfo.userCount || 0);
          setTotalParticipants(data.roomInfo.totalParticipants || 0);
        }

        setConnectionStatus("Joined room - waiting for connections");
      },

      onUserJoined: (data: any) => {
        console.log("User joined room:", data);

        // Update participant count when someone joins
        if (data.participantCount !== undefined) {
          setTotalParticipants(data.participantCount);
          // Viewer count is total minus admin (if present)
          setViewerCount(Math.max(0, data.participantCount - 1));
        }

        if (
          isAdminRef.current &&
          data.user?.id &&
          data.user.id !== localSocketIdRef.current
        ) {
          // Admin creates connection to new user
          setTimeout(async () => {
            try {
              const pc = createPeerConnection(data.user.id);
              if (pc) {
                console.log(`Admin creating offer for user ${data.user.id}`);
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true,
                });
                await pc.setLocalDescription(offer);
                signaling.sendOffer(offer, roomIdRef.current, data.user.id);
              }
            } catch (error) {
              console.error(`Error creating offer for ${data.user.id}:`, error);
            }
          }, 1000);
        }
      },

      onOffer: async (
        offer: RTCSessionDescriptionInit,
        roomId: string,
        senderId?: string,
        targetId?: string
      ) => {
        if (roomId !== roomIdRef.current) return;

        // Only process offers meant for us or broadcast offers
        if (targetId && targetId !== localSocketIdRef.current) return;

        // Viewers process offers from admin
        if (!isAdminRef.current && senderId) {
          console.log(`Viewer received offer from ${senderId}`);

          try {
            let pc = peerConnectionsRef.current.get(senderId);
            if (!pc) {
              const createdPc = createPeerConnection(senderId);
              if (!createdPc) return;
              pc = createdPc;
            }

            // Check signaling state before setting remote description
            if (pc.signalingState !== "stable") {
              console.log(
                `Signaling state not stable (${pc.signalingState}), waiting...`
              );
              setTimeout(
                () => callbacks.onOffer(offer, roomId, senderId, targetId),
                1000
              );
              return;
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await processPendingCandidates(senderId, pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            signaling.sendAnswer(answer, roomId, senderId);

            console.log(`Answer sent to ${senderId}`);
          } catch (error) {
            console.error(`Error handling offer from ${senderId}:`, error);
          }
        }
      },

      onAnswer: async (
        answer: RTCSessionDescriptionInit,
        roomId: string,
        senderId?: string,
        targetId?: string
      ) => {
        if (roomId !== roomIdRef.current) return;

        // Only process answers meant for us
        if (targetId && targetId !== localSocketIdRef.current) return;

        // Admin processes answers from viewers
        if (isAdminRef.current && senderId) {
          console.log(`Admin received answer from ${senderId}`);

          try {
            const pc = peerConnectionsRef.current.get(senderId);
            if (!pc) {
              console.error(`No peer connection found for ${senderId}`);
              return;
            }

            if (pc.signalingState !== "have-local-offer") {
              console.warn(
                `Cannot set remote answer in current state: ${pc.signalingState}`
              );
              return;
            }

            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await processPendingCandidates(senderId, pc);

            console.log(`Remote description set for ${senderId}`);
          } catch (error) {
            console.error(`Error handling answer from ${senderId}:`, error);
          }
        }
      },

      onIceCandidate: async (
        candidate: RTCIceCandidateInit,
        roomId: string,
        senderId?: string,
        targetId?: string
      ) => {
        if (roomId !== roomIdRef.current) return;
        if (targetId && targetId !== localSocketIdRef.current) return;

        if (!senderId) return;

        console.log(`ICE candidate received from ${senderId}`);

        try {
          const pc = peerConnectionsRef.current.get(senderId);
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            console.log(`Storing ICE candidate from ${senderId} for later`);
            const candidates = pendingCandidatesRef.current.get(senderId) || [];
            candidates.push(candidate);
            pendingCandidatesRef.current.set(senderId, candidates);
          }
        } catch (error) {
          console.error(`Error adding ICE candidate from ${senderId}:`, error);
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

      onUserLeft: (data: any) => {
        console.log("User left room:", data);

        // Update participant counts when someone leaves
        if (data.participantCount !== undefined) {
          setTotalParticipants(data.participantCount);
          setViewerCount(Math.max(0, data.participantCount - 1));
        }

        if (data.userId) {
          removePeerConnection(data.userId);
        }
      },

      onRoomInfo: (data: any) => {
        console.log("Room info received:", data);

        // Update participant counts from room info
        if (data.participantCount !== undefined) {
          setTotalParticipants(data.participantCount);
          // Viewer count is total participants minus admin (if present)
          const hasAdmin =
            data.participants?.some((p: any) => p.isAdmin) || false;
          setViewerCount(
            Math.max(0, data.participantCount - (hasAdmin ? 1 : 0))
          );
        }
      },
    };

    signaling.setCallbacks(callbacks);

    return () => {
      signaling.disconnect();
    };
  }, [createPeerConnection, processPendingCandidates, removePeerConnection]);

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

        // Clear existing connections
        peerConnectionsRef.current.forEach((pc) => {
          try {
            pc.close();
          } catch (e) {
            console.log("Error closing existing connection:", e);
          }
        });
        peerConnectionsRef.current.clear();
        setPeerConnections(new Map());
        pendingCandidatesRef.current.clear();

        await signaling.connect();

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
    [getUserInfo]
  );

  const disconnectFromRoom = useCallback(() => {
    console.log("Disconnecting from room");

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, userId) => {
      try {
        pc.close();
      } catch (e) {
        console.log(`Error closing peer connection for ${userId}:`, e);
      }
    });

    peerConnectionsRef.current.clear();
    setPeerConnections(new Map());
    pendingCandidatesRef.current.clear();

    signaling.disconnect();
    setAdminStream(null);
    setIsAdminStreaming(false);
    setConnectionStatus("Disconnected");
    setConnectedUsers(new Set());

    isConnectingRef.current = false;
    roomIdRef.current = "";
    localSocketIdRef.current = "";

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

    if (stream && isAdminRef.current) {
      // Add stream to all existing peer connections
      peerConnectionsRef.current.forEach((pc, userId) => {
        try {
          // Remove existing tracks
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track) {
              pc.removeTrack(sender);
            }
          });

          // Add new tracks
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });

          console.log(`Updated stream for peer connection ${userId}`);
        } catch (error) {
          console.error(`Error updating stream for ${userId}:`, error);
        }
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
        peerConnections,
        connectToRoom,
        disconnectFromRoom,
        connectionStatus,
        sendChatMessage,
        chatMessages,
        currentUser,
        fetchCurrentUser,
        connectedUsers,
        viewerCount,
        totalParticipants,
      }}
    >
      {children}
    </VideoStreamContext.Provider>
  );
};

export const useVideoStream = () => useContext(VideoStreamContext);
