// app/live/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, RefreshCw, Play } from "lucide-react";
import { useVideoStream } from "@/context/VideoStreamContext";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Footer from "@/components/Footer";

export default function LivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [videoError, setVideoError] = useState("");

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
    connectedUsers,
    viewerCount,
    totalParticipants,
  } = useVideoStream();

  const roomId = "pet-live-room";

  useEffect(() => {
    const token = localStorage?.getItem("accessToken");
    setIsLoggedIn(!!token);

    if (token) {
      fetchCurrentUser();
    }

    // Add user interaction listener
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, [fetchCurrentUser]);

  // Connect to room on component mount
  useEffect(() => {
    console.log("Viewer: Connecting to room...");
    connectToRoom(roomId, false).catch((error) => {
      console.error("Failed to connect to room:", error);
      setVideoError("Failed to connect to live stream");
    });

    return () => {
      console.log("Viewer: Disconnecting from room...");
      disconnectFromRoom();
    };
  }, [roomId, connectToRoom, disconnectFromRoom]);

  // Update video element when stream changes with better error handling
  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;

    // Clear any previous errors
    setVideoError("");

    if (adminStream) {
      console.log("Viewer: Setting video stream");

      // Pause current playback to avoid conflicts
      if (!videoElement.paused) {
        videoElement.pause();
      }

      // Set the new stream
      videoElement.srcObject = adminStream;

      // Handle metadata loaded
      const handleLoadedMetadata = () => {
        console.log("Video metadata loaded");
        if (hasUserInteracted) {
          playVideo();
        }
      };

      // Handle video errors
      const handleVideoError = (error: Event) => {
        console.error("Video playback error:", error);
        setVideoError("Error playing video stream");
      };

      // Handle play/pause events
      const handlePlay = () => {
        console.log("Video started playing");
        setVideoError("");
      };

      const handlePause = () => {
        console.log("Video paused");
      };

      // Add event listeners
      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("error", handleVideoError);
      videoElement.addEventListener("play", handlePlay);
      videoElement.addEventListener("pause", handlePause);

      // Cleanup function
      return () => {
        videoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoElement.removeEventListener("error", handleVideoError);
        videoElement.removeEventListener("play", handlePlay);
        videoElement.removeEventListener("pause", handlePause);
      };
    } else {
      // Clear the video source
      videoElement.srcObject = null;
      console.log("Viewer: Cleared video stream");
    }
  }, [adminStream, hasUserInteracted]);

  const playVideo = async () => {
    if (!videoRef.current || !adminStream) {
      console.log("Cannot play video: no video element or stream");
      return;
    }

    try {
      // Ensure the video is ready
      if (videoRef.current.readyState < 2) {
        console.log("Video not ready, waiting...");
        return;
      }

      console.log("Attempting to play video...");
      await videoRef.current.play();
      setHasUserInteracted(true);
      setVideoError("");
      console.log("Video playing successfully");
    } catch (error) {
      console.error("Error playing video:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("Play was interrupted, will retry...");
          // Don't show error for abort errors, they're usually temporary
          return;
        } else if (error.name === "NotSupportedError") {
          setVideoError("Video format not supported by your browser");
        } else if (error.name === "NotAllowedError") {
          setVideoError("Please click the play button to start the video");
        } else {
          setVideoError("Unable to play video stream");
        }
      }
    }
  };

  const handlePlayButtonClick = () => {
    setHasUserInteracted(true);
    playVideo();
  };

  const handleSendMessage = () => {
    const message = chatInputRef.current?.value.trim();
    if (message) {
      if (currentUser) {
        sendChatMessage(
          message,
          currentUser.fullname,
          currentUser.profilePicture
        );
      } else {
        sendChatMessage(message, "Guest User", "");
      }

      if (chatInputRef.current) {
        chatInputRef.current.value = "";
      }
    }
  };

  const reconnect = async () => {
    setIsRefreshing(true);
    setVideoError("");

    try {
      await disconnectFromRoom();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await connectToRoom(roomId, false);
    } catch (error) {
      console.error("Reconnection failed:", error);
      setVideoError("Failed to reconnect to stream");
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

      <div className="container mx-auto p-20 pt-36 space-y-6">
        <div className="flex justify-between px-4 items-center">
          <div>
            <div className="flex items-center  gap-4">
              <h1 className="text-3xl font-bold text-[#0a1629]">Live Stream</h1>
              {/* Viewer Count Badge */}
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>
                  {viewerCount} viewer{viewerCount !== 1 ? "s" : ""}
                </span>
                {isAdminStreaming && (
                  <span className="text-xs opacity-75">• LIVE</span>
                )}
              </div>
            </div>

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
                {connectedUsers.size > 0 && (
                  <span className="text-xs text-green-600 ml-2">
                    • Connected to {connectedUsers.size} peer
                    {connectedUsers.size !== 1 ? "s" : ""}
                  </span>
                )}
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
                  {adminStream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        controls
                        muted={false}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Video element error:", e);
                          setVideoError("Video playback error");
                        }}
                      />
                      {(!hasUserInteracted || videoError) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                          <div className="text-center text-white">
                            <Button
                              onClick={handlePlayButtonClick}
                              className="bg-orange-500 hover:bg-orange-600 text-white mb-2"
                              size="lg"
                            >
                              <Play className="w-5 h-5 mr-2" />
                              {videoError
                                ? "Retry Video"
                                : "Click to Play Stream"}
                            </Button>
                            {videoError && (
                              <p className="text-sm text-red-300 mt-2">
                                {videoError}
                              </p>
                            )}
                          </div>
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
                            : connectionStatus.includes("Error")
                            ? "Connection error"
                            : "Stream is offline"}
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                          {connectionStatus.includes("Error")
                            ? "Please try refreshing the connection"
                            : "Please wait while we connect you to the live stream"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    Status: {connectionStatus}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      {totalParticipants} total • {viewerCount} viewer
                      {viewerCount !== 1 ? "s" : ""}
                    </span>
                    {connectedUsers.size > 0 && (
                      <span className="text-blue-600">
                        {connectedUsers.size} connection
                        {connectedUsers.size !== 1 ? "s" : ""}
                      </span>
                    )}
                    {isAdminStreaming && (
                      <span className="text-green-600">● Live now</span>
                    )}
                  </div>
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
                  className="max-h-96 border rounded-xl p-4 overflow-y-auto space-y-2 bg-gray-50"
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
                    disabled={connectionStatus === "Disconnected"}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={connectionStatus === "Disconnected"}
                    className="bg-orange-500 hover:bg-orange-600 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {connectionStatus === "Disconnected" && (
                  <p className="text-xs text-gray-500 text-center">
                    Chat is unavailable when disconnected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
