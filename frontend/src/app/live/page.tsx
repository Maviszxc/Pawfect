// app/live/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, RefreshCw } from "lucide-react";
import { useVideoStream } from "@/context/VideoStreamContext";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function LivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const {
    adminStream,
    isAdminStreaming,
    connectToRoom,
    disconnectFromRoom,
    connectionStatus,
    sendChatMessage,
    chatMessages,
    currentUser,
    fetchCurrentUser,
  } = useVideoStream();

  const roomId = "pet-live-room";

  useEffect(() => {
    const token = localStorage?.getItem("accessToken");
    setIsLoggedIn(!!token);

    // Fetch current user data if logged in
    if (token) {
      fetchCurrentUser();
    }

    // Add user interaction listener
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [fetchCurrentUser]);

  // Connect to room on component mount
  useEffect(() => {
    console.log("User: Connecting to room...");
    connectToRoom(roomId, false);

    return () => {
      console.log("User: Disconnecting from room...");
      disconnectFromRoom();
    };
  }, [roomId, connectToRoom, disconnectFromRoom]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current) {
      // Pause before changing srcObject to avoid AbortError
      videoRef.current.pause();

      if (adminStream) {
        console.log("User: Setting video stream");
        videoRef.current.srcObject = adminStream;

        // Only play if user has interacted
        if (hasUserInteracted) {
          // Wait for loadedmetadata before playing
          const playOnReady = () => {
            videoRef.current?.play().catch((error) => {
              console.error("Error playing video:", error);
            });
            videoRef.current?.removeEventListener(
              "loadedmetadata",
              playOnReady
            );
          };
          videoRef.current.addEventListener("loadedmetadata", playOnReady);
        }
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [adminStream, hasUserInteracted]);

  const handlePlayVideo = async () => {
    if (videoRef.current && adminStream) {
      try {
        await videoRef.current.play();
        setHasUserInteracted(true);
      } catch (error) {
        console.error("Error playing video:", error);
      }
    }
  };

  const handleSendMessage = () => {
    const message = chatInputRef.current?.value.trim();
    if (message) {
      if (currentUser) {
        // Logged in user
        sendChatMessage(
          message,
          currentUser.fullname,
          currentUser.profilePicture
        );
      } else {
        // Guest user
        sendChatMessage(message, "Guest User", "");
      }

      if (chatInputRef.current) {
        chatInputRef.current.value = "";
      }
    }
  };

  const reconnect = async () => {
    setIsRefreshing(true);
    try {
      await disconnectFromRoom();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await connectToRoom(roomId, false);
    } catch (error) {
      console.error("Reconnection failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

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
    if (profilePicture.startsWith("http") || profilePicture.startsWith("//")) {
      return profilePicture;
    }
    return profilePicture;
  };

  // Get user initials for fallback avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    const words = name.split(" ");
    let initials = "";
    for (let i = 0; i < Math.min(words.length, 2); i++) {
      initials += words[i][0];
    }
    return initials.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {isLoggedIn ? <AuthNavigation /> : <Navigation />}

      <div className="container mx-auto p-4 pt-24 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1629]">Live Stream</h1>
            {currentUser && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={getProfilePictureUrl(currentUser.profilePicture)}
                    alt={currentUser.fullname}
                  />
                  <AvatarFallback>
                    {getInitials(currentUser.fullname)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  Watching as {currentUser.fullname}
                </span>
              </div>
            )}
            {!currentUser && isLoggedIn && (
              <span className="text-sm text-gray-500 mt-2 block">
                Loading user profile...
              </span>
            )}
            {!isLoggedIn && (
              <span className="text-sm text-gray-500 mt-2 block">
                Watching as guest
              </span>
            )}
          </div>
          <Button
            onClick={reconnect}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Connection
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Stream Section */}
          <Card className="w-full rounded-2xl shadow">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-[#0a1629]">
                Live Feed
              </h2>
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  {isAdminStreaming ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        controls
                        className="w-full h-full object-cover"
                        onClick={handlePlayVideo}
                      />
                      {!hasUserInteracted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <Button
                            onClick={handlePlayVideo}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            Click to Play Stream
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-medium">
                          {connectionStatus === "Connecting..."
                            ? "Connecting to stream..."
                            : "Stream is offline"}
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                          Please wait while we connect you to the live stream
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Status: {connectionStatus}
                  </span>
                  {isAdminStreaming && (
                    <span className="text-sm text-green-600">● Live now</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Section */}
          <Card className="w-full rounded-2xl shadow">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-[#0a1629]">
                Live Chat
              </h2>
              <div className="space-y-4">
                <div
                  ref={chatContainerRef}
                  className="h-64 border rounded-xl p-4 overflow-y-auto space-y-2 bg-gray-50"
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl flex items-start gap-3 ${
                        msg.isStaff
                          ? "bg-blue-100 text-blue-800 mr-8 border border-blue-200"
                          : msg.senderId === currentUser?._id
                          ? "bg-orange-50 text-orange-800 mr-8 border border-orange-200"
                          : "bg-white text-gray-800 ml-8 border border-gray-200"
                          
                      }`}
                  
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                        <AvatarImage
                          src={getProfilePictureUrl(msg.profileUrl)}
                          alt={msg.sender}
                        />
                        <AvatarFallback>
                          {getInitials(msg.sender)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">
                            {msg.sender}
                            {msg.senderId === currentUser?._id && " (You)"}
                            {msg.isStaff && " (Admin)"}
                          </span>
                          <span className="text-xs opacity-70">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Be the first to chat!
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    ref={chatInputRef}
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={!isAdminStreaming}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!isAdminStreaming}
                    className="bg-orange-500 hover:bg-orange-600 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {!isAdminStreaming && (
                  <p className="text-xs text-gray-500 text-center">
                    Chat is available when stream is active
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
