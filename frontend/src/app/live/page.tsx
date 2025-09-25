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

export default function LivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const {
    adminStream,
    isAdminStreaming,
    connectToRoom,
    disconnectFromRoom,
    connectionStatus,
    sendChatMessage,
    chatMessages,
  } = useVideoStream();

  const roomId = "pet-live-room";

  useEffect(() => {
    const token = localStorage?.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  // Connect to room on component mount
  useEffect(() => {
    console.log("👤 User: Connecting to room...");
    connectToRoom(roomId, false);

    return () => {
      console.log("👤 User: Disconnecting from room...");
      disconnectFromRoom();
    };
  }, [roomId, connectToRoom, disconnectFromRoom]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && adminStream) {
      console.log("🎥 User: Setting video stream");
      videoRef.current.srcObject = adminStream;

      // Play the video
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [adminStream]);

  const handleSendMessage = () => {
    const message = chatInputRef.current?.value.trim();
    if (message) {
      sendChatMessage(message, "User");

      // Clear input
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

  return (
    <>
      {isLoggedIn ? <AuthNavigation /> : <Navigation />}
      <div className="min-h-screen bg-[#f8fafc] pb-8">
        <div className="container mx-auto p-4 pt-24 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[#0a1629]">
              Live Pet Camera
            </h1>
            <Button
              onClick={reconnect}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Connection Status */}
          <div
            className={`p-3 rounded-lg ${
              connectionStatus.includes("connected")
                ? "bg-green-100 text-green-800"
                : connectionStatus.includes("Error")
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            Status: {connectionStatus}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Stream Section */}
            <Card className="w-full rounded-2xl shadow">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#0a1629]">
                  Live Stream
                </h2>
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                    {isAdminStreaming ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-center">
                          {connectionStatus.includes("connecting")
                            ? "Connecting to stream..."
                            : "Waiting for stream to start..."}
                        </p>
                        <p className="text-sm opacity-75 mt-2">
                          Make sure an admin has started the camera
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={
                        connectionStatus.includes("connected")
                          ? "text-green-600"
                          : connectionStatus.includes("Error")
                          ? "text-red-600"
                          : "text-yellow-600"
                      }
                    >
                      Status: {connectionStatus}
                    </span>
                    {isAdminStreaming && (
                      <span className="text-green-600">● Live</span>
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
                    {chatMessages.length === 0 ? (
                      <p className="text-gray-500 text-center pt-20">
                        No messages yet. Be the first to chat!
                      </p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl ${
                            msg.isStaff
                              ? "bg-blue-100 text-blue-800 ml-8 border border-blue-200"
                              : "bg-white text-gray-800 mr-8 border border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold">{msg.sender}</span>
                            <span className="text-xs opacity-70">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      ref={chatInputRef}
                      placeholder="Type your message..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSendMessage();
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
