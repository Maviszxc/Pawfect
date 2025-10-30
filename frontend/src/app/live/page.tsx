// app/live/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, RefreshCw, Play, Pause, CameraOff, Calendar, Clock, Video, Heart, Eye, MessageCircle, Maximize, Minimize } from "lucide-react";
import { useVideoStream } from "@/context/VideoStreamContext";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Footer from "@/components/Footer";
import { NetworkStatus } from "@/components/NetworkStatus";
import { BASE_URL } from "@/utils/constants";
import axios from "axios";

interface Schedule {
  _id: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  createdBy: {
    fullname: string;
    email: string;
  };
}

export default function LivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

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
    isPaused,
    sendHeartReaction,
    heartReactions,
  } = useVideoStream();

  const roomId = "pet-live-room";

  useEffect(() => {
    const token = localStorage?.getItem("accessToken");
    setIsLoggedIn(!!token);

    if (token) {
      fetchCurrentUser();
    }

    // Fetch upcoming schedules
    fetchUpcomingSchedules();

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

  const fetchUpcomingSchedules = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/schedules/upcoming`);
      if (response.data.success) {
        setSchedules(response.data.schedules.slice(0, 3)); // Show only 3 upcoming
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setSchedulesLoading(false);
    }
  };

  // Auto-connect removed - users now manually join/leave

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
  }, [adminStream, hasUserInteracted, isFullscreen]);

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

  const handleHeartClick = () => {
    console.log("Heart button clicked!");
    console.log("Is joined:", isJoined);
    console.log("Connection status:", connectionStatus);
    if (isJoined) {
      console.log("Sending heart reaction...");
      sendHeartReaction();
    } else {
      console.log("Cannot send heart - not joined to stream");
    }
  };

  const handleJoinStream = async () => {
    setIsRefreshing(true);
    setVideoError("");

    try {
      console.log("Viewer: Joining live stream...");
      await connectToRoom(roomId, false);
      setIsJoined(true);
    } catch (error) {
      console.error("Failed to join stream:", error);
      setVideoError("Failed to join live stream");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLeaveStream = () => {
    console.log("Viewer: Leaving live stream...");
    disconnectFromRoom();
    setIsJoined(false);
    setVideoError("");
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-300px) scale(1.5);
          }
        }
      `}</style>
      <div className="min-h-screen bg-[#f8fafc]">
        {isLoggedIn ? <AuthNavigation /> : <Navigation />}

        <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-6 pt-24 sm:pt-32 lg:pt-36 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div className="w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0a1629]">
                  Live Stream
                </h1>
                {/* Viewer Count Badge */}
                <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>
                    {viewerCount} viewer{viewerCount !== 1 ? "s" : ""}
                  </span>
                  {isAdminStreaming && (
                    <span className="text-xs opacity-75">• LIVE</span>
                  )}
                </div>
              </div>
            </div>

            {currentUser && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={getProfilePictureUrl(currentUser.profilePicture)}
                      alt={currentUser.fullname}
                    />
                    <AvatarFallback>
                      {getInitials(currentUser.fullname)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs sm:text-sm text-gray-600">
                    Watching as {currentUser.fullname}
                  </span>
                </div>
                {connectedUsers.size > 0 && (
                  <span className="text-xs text-green-600">
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
          <div className="flex gap-2 w-full sm:w-auto">
            {!isJoined ? (
              <Button
                onClick={handleJoinStream}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white flex-1 sm:flex-initial"
                disabled={isRefreshing}
              >
                <Play className="w-4 h-4" />
                <span>Join Stream</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleLeaveStream}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <CameraOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Leave Stream</span>
                  <span className="sm:hidden">Leave</span>
                </Button>
                <Button
                  onClick={reconnect}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">
                    <RefreshCw className="w-4 h-4" />
                  </span>
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Video Stream Section */}
          <Card className="w-full rounded-xl sm:rounded-2xl shadow">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#0a1629]">
                Live Feed
              </h2>
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  {/* Floating Hearts Overlay */}
                  {heartReactions.map((heart) => (
                    <div
                      key={heart.id}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-50 animate-float-up"
                      style={{
                        animation: 'floatUp 3s ease-out forwards',
                        left: `${Math.random() * 80 + 10}%`,
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-4xl drop-shadow-lg">❤️</span>
                        <span className="text-xs font-semibold text-white bg-black bg-opacity-60 px-2 py-1 rounded-full mt-1 whitespace-nowrap">
                          {heart.sender}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {!isJoined ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center p-6">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-70" />
                        <h3 className="text-xl font-bold mb-2">
                          Join the Live Stream
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Click the "Join Stream" button above to start watching
                        </p>
                      </div>
                    </div>
                  ) : adminStream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        controls={false}
                        muted={false}
                        className={`w-full h-full object-cover ${
                          isPaused ? "hidden" : ""
                        }`}
                        onError={(e) => {
                          console.error("Video element error:", e);
                          setVideoError("Video playback error");
                        }}
                      />
                      {isPaused && (
                        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <Pause className="w-20 h-20 mb-6 text-white opacity-80 animate-pulse" />
                            <h3 className="text-3xl font-bold text-white mb-3">
                              Stream Paused
                            </h3>
                            <p className="text-lg text-gray-300 mb-2">
                              The broadcaster has paused the stream
                            </p>
                            <p className="text-sm text-gray-400">
                              Please wait, it will resume shortly...
                            </p>
                          </div>
                        </div>
                      )}
                      {(!hasUserInteracted || videoError) && !isPaused && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
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
                  ) : !isAdminStreaming ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center p-6">
                        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CameraOff className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Stream Ended</h3>
                        <p className="text-gray-300 text-sm mb-4">
                          The live stream has ended. Thank you for watching!
                        </p>
                        <p className="text-gray-400 text-xs">
                          Check the schedule below for upcoming streams
                        </p>
                      </div>
                    </div>
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
                  
                  {/* Fullscreen Button */}
                  {isJoined && adminStream && (
                    <button
                      onClick={toggleFullscreen}
                      className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-lg transition-all backdrop-blur-sm z-30"
                      title="Toggle Fullscreen"
                    >
                      <Maximize className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Pause Status Message */}
                {isPaused && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
                    <Pause className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        Stream is currently paused
                      </p>
                      <p className="text-xs text-yellow-600 mt-0.5">
                        The broadcaster has paused the stream. It will resume shortly.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs sm:text-sm">
                  <span className="text-gray-600">
                    Status: {isPaused ? "Paused" : connectionStatus}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
                    {isAdminStreaming && !isPaused && (
                      <span className="text-green-600">● Live now</span>
                    )}
                    {isPaused && (
                      <span className="text-yellow-600">⏸ Paused</span>
                    )}
                  </div>
                  
                </div>
                {/* Heart Reaction Button */}
                {isJoined && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleHeartClick}
                      disabled={!isAdminStreaming}
                      className="flex items-center gap-2 px-6 py-3 rounded-full transition-all bg-white hover:bg-pink-50 text-gray-700 border-2 border-gray-200 hover:border-pink-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
                    >
                      <span className="text-2xl">❤️</span>
                      <span className="text-gray-700 font-medium">React</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Section */}
          <Card className="w-full rounded-xl sm:rounded-2xl shadow">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#0a1629]">
                Live Chat
              </h2>
              <div className="space-y-4">
                <div
                  ref={chatContainerRef}
                  className="h-64 sm:h-80 lg:max-h-96 border rounded-xl p-3 sm:p-4 overflow-y-auto space-y-2 bg-gray-50"
                >
                  {chatMessages.map((msg) => {
                    // Check if it's a system message
                    if (msg.isSystem) {
                      return (
                        <div key={msg.id} className="text-center py-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {msg.message}
                          </span>
                        </div>
                      );
                    }

                    // Regular chat message
                    const isOwnMessage = currentUser && msg.sender === currentUser.fullname;
                    
                    return (
                      <div key={msg.id} className={`flex items-start gap-2 sm:gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                          {msg.profileUrl && (
                            <AvatarImage
                              src={getProfilePictureUrl(msg.profileUrl)}
                              alt={msg.sender}
                            />
                          )}
                          <AvatarFallback className={`text-white text-xs ${isOwnMessage ? 'bg-orange-500' : 'bg-blue-500'}`}>
                            {getInitials(msg.sender)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className={`flex items-baseline gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                              {isOwnMessage ? 'You' : msg.sender}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className={`mt-1 max-w-[85%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                            <p className={`text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg break-words ${
                              isOwnMessage 
                                ? 'bg-orange-500 text-white rounded-br-none' 
                                : 'bg-gray-200 text-gray-900 rounded-bl-none'
                            }`}>
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-8 text-sm">
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
                    className="rounded-lg sm:rounded-xl text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={connectionStatus === "Disconnected"}
                    className="bg-orange-500 hover:bg-orange-600 rounded-lg sm:rounded-xl px-3 sm:px-4"
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

          {/* Upcoming Schedules Section */}
          <Card className="w-full rounded-xl sm:rounded-2xl shadow mt-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg sm:text-xl font-semibold text-[#0a1629]">
                Upcoming Streams
              </h2>
            </div>

            <div className="space-y-3">
              {schedulesLoading ? (
                [...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                  </div>
                ))
              ) : schedules.length > 0 ? (
                schedules.map((schedule) => {
                  const scheduleDate = new Date(schedule.scheduledDate);
                  const isLive = schedule.status === "live";

                  return (
                    <div
                      key={schedule._id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isLive
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-orange-500/30 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-orange-500" />
                          <h4 className="font-semibold text-gray-900">{schedule.title}</h4>
                        </div>
                        {isLive && (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            LIVE NOW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{schedule.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{scheduleDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{schedule.duration} min</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No upcoming streams scheduled</p>
                  <p className="text-xs mt-1">Check back later for updates</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
        <Footer />
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && isJoined && adminStream && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col md:flex-row">
          {/* Left Side - Video Feed */}
          <div className="flex-1 relative order-1">
            {/* Header Bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2 md:p-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <h2 className="text-white font-semibold text-sm md:text-lg">Live Stream</h2>
                  <div className="flex items-center gap-1 md:gap-2 bg-red-500/90 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                  <span className="text-white/80 text-xs md:text-sm">
                    {viewerCount} <span className="hidden sm:inline">viewer{viewerCount !== 1 ? "s" : ""}</span>
                  </span>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="bg-white/10 hover:bg-white/20 text-white p-1.5 md:p-2 rounded-lg transition-all backdrop-blur-sm"
                  title="Exit Fullscreen"
                >
                  <Minimize className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Floating Hearts */}
              {heartReactions.map((heart) => (
                <div
                  key={heart.id}
                  className="absolute bottom-20 pointer-events-none z-50"
                  style={{
                    animation: 'floatUp 3s ease-out forwards',
                    left: `${Math.random() * 80 + 10}%`,
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-5xl drop-shadow-2xl">❤️</span>
                    <span className="text-sm font-semibold text-white bg-black/70 px-3 py-1 rounded-full mt-2 whitespace-nowrap backdrop-blur-sm">
                      {heart.sender}
                    </span>
                  </div>
                </div>
              ))}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls={false}
                muted={false}
                className={`w-full h-full object-contain ${isPaused ? "hidden" : ""}`}
              />

              {isPaused && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white">
                  <Pause className="w-24 h-24 mb-6 text-white/80 animate-pulse" />
                  <h3 className="text-4xl font-bold mb-3">Stream Paused</h3>
                  <p className="text-xl text-gray-300">Please wait, it will resume shortly...</p>
                </div>
              )}
            </div>

            {/* Bottom Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 md:p-4 z-50">
              <div className="md:max-w-[calc(100%-24rem)] mx-auto">
                <div className="flex items-center justify-between gap-2 md:gap-3">
                  <div className="flex-shrink-0 hidden sm:block">
                    {currentUser && (
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white/20">
                          <AvatarImage
                            src={getProfilePictureUrl(currentUser.profilePicture)}
                            alt={currentUser.fullname}
                          />
                          <AvatarFallback className="bg-orange-500 text-white text-xs">
                            {getInitials(currentUser.fullname)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block">
                          <p className="text-white font-medium text-sm">{currentUser.fullname}</p>
                          <p className="text-white/60 text-xs">Watching</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 md:gap-2 flex-1 justify-end">
                    <Button
                      onClick={() => sendHeartReaction()}
                      className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-lg shadow-lg h-8 md:h-9 px-2 md:px-3"
                      size="sm"
                    >
                      <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" fill="currentColor" />
                      <span className="font-semibold hidden md:inline">React</span>
                    </Button>
                    
                    <Button
                      onClick={() => setShowLeaveModal(true)}
                      variant="destructive"
                      size="sm"
                      className="rounded-lg shadow-lg text-white h-8 md:h-9 px-2 md:px-3"
                    >
                      <CameraOff className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
                      <span className="font-semibold hidden md:inline">Leave</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Chat Panel */}
          <div className="w-full md:w-96 h-1/3 md:h-full bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col order-2">
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Live Chat
                </h3>
                <span className="text-gray-400 text-sm">
                  {chatMessages.filter(m => !m.isSystem).length} messages
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3"
            >
              {chatMessages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="text-center py-2">
                      <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                        {msg.message}
                      </span>
                    </div>
                  );
                }

                const isOwnMessage = currentUser && msg.sender === currentUser.fullname;
                
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {msg.profileUrl && (
                        <AvatarImage
                          src={getProfilePictureUrl(msg.profileUrl)}
                          alt={msg.sender}
                        />
                      )}
                      <AvatarFallback className={`text-white text-xs ${isOwnMessage ? 'bg-orange-500' : 'bg-blue-500'}`}>
                        {getInitials(msg.sender)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`flex items-baseline gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-medium text-white truncate">
                          {isOwnMessage ? 'You' : msg.sender}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className={`mt-1 max-w-[85%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}>
                        <p className={`text-sm px-3 py-2 rounded-lg break-words ${
                          isOwnMessage 
                            ? 'bg-orange-500 text-white rounded-br-none' 
                            : 'bg-gray-800 text-gray-200 rounded-bl-none'
                        }`}>
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-2 md:p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <Input
                  ref={chatInputRef}
                  placeholder="Send a message..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm md:text-base h-9 md:h-10"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && chatInputRef.current?.value.trim()) {
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-orange-500 hover:bg-orange-600 h-9 w-9 md:h-10 md:w-10 p-0"
                >
                  <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Leave Stream Confirmation Modal */}
          {showLeaveModal && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <CameraOff className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Leave Live Stream?</h3>
                    <p className="text-sm text-gray-400">You can rejoin anytime</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">
                  Are you sure you want to leave this live stream?
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowLeaveModal(false)}
                    variant="outline"
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowLeaveModal(false);
                      handleLeaveStream();
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Leave Stream
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
