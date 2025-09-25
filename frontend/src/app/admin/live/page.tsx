// app/admin/live/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Camera, CameraOff, RefreshCw, Users, Eye } from "lucide-react";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { useVideoStream } from "@/context/VideoStreamContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function AdminLivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);

  const {
    setAdminStream,
    connectToRoom,
    disconnectFromRoom,
    connectionStatus,
    chatMessages,
    sendChatMessage,
    currentUser,
    fetchCurrentUser,
    connectedUsers,
    viewerCount,
    totalParticipants,
  } = useVideoStream();

  const roomId = "pet-live-room";

  useEffect(() => {
    if (
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    ) {
      setHasCamera(true);
    } else {
      setCameraError("Your browser does not support camera access");
    }
  }, []);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const startCamera = async () => {
    try {
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
        audio: true,
      });

      setCameraStream(stream);
      setAdminStream(stream);
      setIsCameraActive(true);

      await connectToRoom(roomId, true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "Failed to access camera. Please check permissions and try again."
      );
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setAdminStream(null);
      setIsCameraActive(false);
      disconnectFromRoom();
    }
  };

  const handleSendMessage = () => {
    const message = chatInputRef.current?.value.trim();
    if (message && currentUser) {
      sendChatMessage(
        message,
        currentUser.fullname,
        currentUser.profilePicture
      );
      if (chatInputRef.current) {
        chatInputRef.current.value = "";
      }
    }
  };

  const reconnect = async () => {
    try {
      setIsRefreshing(true);
      await disconnectFromRoom();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (isCameraActive) {
        await connectToRoom(roomId, true);
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
    if (!name) return "A";
    const words = name.split(" ");
    let initials = "";
    for (let i = 0; i < Math.min(words.length, 2); i++) {
      initials += words[i][0];
    }
    return initials.toUpperCase();
  };

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-[#f8fafc] ">
        <div className="container mx-auto p-7 pt-2 space-y-6">
          {/* Stream Statistics Card */}
          <Card className="w-full rounded-2xl bg-orange-500 border border-orange-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Stream Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {viewerCount}
                  </div>
                  <div className="text-sm text-blue-800">Current Viewers</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalParticipants}
                  </div>
                  <div className="text-sm text-green-800">
                    Total Participants
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {connectedUsers.size}
                  </div>
                  <div className="text-sm text-orange-800">
                    Active Connections
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {chatMessages.length}
                  </div>
                  <div className="text-sm text-purple-800">Chat Messages</div>
                </div>
              </div>

              {isCameraActive && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-800 font-medium">
                      Live stream is active
                    </span>
                    <span className="text-green-600 text-sm">
                      Broadcasting to {viewerCount} viewer
                      {viewerCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between p-5  items-center">
            <div>
              <div className="flex items-center pt-2 gap-5">
                <h1 className="text-3xl font-bold text-[#0a1629]">
                  Live Stream Admin
                </h1>

                {/* Admin Stats */}
                <div className="flex items-center gap-3">
                  {/* Live Status Badge */}
                  {isCameraActive && (
                    <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
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
                    Streaming as {currentUser.fullname}
                  </span>
                  {connectedUsers.size > 0 && (
                    <span className="text-xs text-green-600 ml-2">
                      • {connectedUsers.size} active connection
                      {connectedUsers.size !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
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
            {/* Camera Section */}
            <Card className="w-full rounded-2xl shadow">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#0a1629]">
                  Camera Feed
                </h2>
                {hasCamera ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                      {cameraStream ? (
                        <video
                          ref={cameraVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <CameraOff className="w-12 h-12 opacity-50" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isCameraActive ? (
                        <Button
                          onClick={startCamera}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl"
                          disabled={!currentUser}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Start Camera
                        </Button>
                      ) : (
                        <Button
                          onClick={stopCamera}
                          variant="destructive"
                          className="flex-1 rounded-xl"
                        >
                          <CameraOff className="w-4 h-4 mr-2" />
                          Stop Camera
                        </Button>
                      )}
                    </div>

                    {!currentUser && (
                      <p className="text-yellow-600 text-sm">
                        Loading user profile...
                      </p>
                    )}

                    {cameraError && (
                      <p className="text-red-500 text-sm">{cameraError}</p>
                    )}

                    {isCameraActive && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Status: {connectionStatus}
                        </span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-blue-600">
                            Broadcasting to {viewerCount} viewer
                            {viewerCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-green-600">
                            • Streaming active
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-500">
                    Camera not available: {cameraError}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card className="w-full rounded-2xl shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#0a1629]">
                    Live Chat
                  </h2>
                  {chatMessages.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {chatMessages.length} message
                      {chatMessages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <div
                    ref={chatContainerRef}
                    className="h-80 border rounded-xl p-4 overflow-y-auto space-y-2 bg-gray-50"
                  >
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl flex items-start gap-3 ${
                          msg.isStaff
                            ? "bg-blue-100 text-blue-800 ml-8 border border-blue-200"
                            : "bg-white text-gray-800 mr-8 border border-gray-200"
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
                              {msg.isStaff && " (You)"}
                              {!msg.isStaff && " (Viewer)"}
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
                        No messages yet. Start the conversation!
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
                      disabled={!currentUser}
                      className="rounded-xl"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!currentUser}
                      className="bg-orange-500 hover:bg-orange-600 rounded-xl"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {!currentUser && (
                    <p className="text-xs text-gray-500 text-center">
                      Loading user profile...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
