"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, RefreshCw } from "lucide-react";
import { useVideoStream } from "@/context/VideoStreamContext";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isStaff: boolean;
}

export default function LivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    adminStream,
    isAdminStreaming,
    connectToRoom,
    disconnectFromRoom,
    connectionStatus: webrtcStatus,
  } = useVideoStream();

  const roomId = "pet-live-room";

  useEffect(() => {
    setConnectionStatus(webrtcStatus);
    setIsConnected(
      webrtcStatus === "connected" || webrtcStatus === "Connecting"
    );
  }, [webrtcStatus]);

  useEffect(() => {
    if (videoRef.current && adminStream) {
      videoRef.current.srcObject = adminStream;
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, [adminStream]);

  useEffect(() => {
    const connectWithRetry = async () => {
      let connectAttempts = 0;
      const maxAttempts = 5;

      const connect = async () => {
        if (connectAttempts >= maxAttempts) {
          console.log("Maximum connection attempts reached");
          setConnectionStatus("Connection failed after multiple attempts");
          return;
        }

        try {
          connectAttempts++;
          setConnectionStatus(`Connecting (${connectAttempts}/${maxAttempts})`);
          await connectToRoom(roomId, false);
          console.log("Connected to room as viewer");
          connectAttempts = 0;
        } catch (error) {
          console.error(
            `Failed to connect (attempt ${connectAttempts}):`,
            error
          );

          if (connectAttempts < maxAttempts) {
            const delay = Math.min(1000 * Math.pow(2, connectAttempts), 10000);
            console.log(`Retrying in ${delay / 1000}s...`);
            setTimeout(connect, delay);
          } else {
            setConnectionStatus("Connection failed");
          }
        }
      };

      connect();
    };

    connectWithRetry();

    return () => {
      disconnectFromRoom();
    };
  }, [roomId, connectToRoom, disconnectFromRoom]);

  const handleSendMessage = () => {
    if (chatInputRef.current?.value.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "You",
        message: chatInputRef.current.value,
        timestamp: new Date(),
        isStaff: false,
      };
      setChatMessages((prev) => [...prev, newMessage]);
      chatInputRef.current.value = "";

      // Auto-scroll to bottom
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }
  };

  const reconnect = async () => {
    try {
      setIsRefreshing(true);
      setConnectionStatus("Reconnecting");
      await disconnectFromRoom();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief delay
      await connectToRoom(roomId, false);
    } catch (error) {
      console.error("Reconnection failed:", error);
      setConnectionStatus("Reconnection failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage?.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <>
      {isLoggedIn ? <AuthNavigation /> : <Navigation />}
      <div className="min-h-screen bg-[#f8fafc] pb-8">
        <div className="container mx-auto p-20 pt-32 space-y-6">
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
              Refresh Connection
            </Button>
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
                    {isAdminStreaming && adminStream ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-center">
                          {connectionStatus === "Connecting"
                            ? "Connecting to stream..."
                            : connectionStatus === "Connection failed"
                            ? "Connection failed. Please try again."
                            : "Waiting for stream to start..."}
                        </p>
                        {connectionStatus === "Connection failed" && (
                          <Button
                            onClick={reconnect}
                            variant="outline"
                            className="mt-4 text-white border-white hover:bg-white hover:text-black"
                          >
                            Retry Connection
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Status: {connectionStatus}
                    </span>
                    {isConnected && (
                      <span className="text-sm text-green-600">
                        {isAdminStreaming ? "Live" : "Connected"}
                      </span>
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
                      disabled={!isConnected}
                      className="rounded-xl"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!isConnected}
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
