"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Camera, CameraOff, RefreshCw } from "lucide-react";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { useVideoStream } from "@/context/VideoStreamContext";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isStaff: boolean;
}

export default function AdminLivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [serverStatus, setServerStatus] = useState<
    "unknown" | "online" | "offline"
  >("unknown");

  const {
    setAdminStream,
    setIsAdminStreaming,
    connectToRoom,
    disconnectFromRoom,
    connectionStatus,
  } = useVideoStream();

  const roomId = "pet-live-room";

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      // Simple check if WebSocket server might be running
      const response = await fetch("http://localhost:3001", {
        method: "HEAD",
        mode: "no-cors",
      }).catch(() => null);

      setServerStatus(response !== null ? "online" : "offline");
    } catch (error) {
      setServerStatus("offline");
    }
  };

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

      // Connect to room with retry logic
      let connected = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!connected && attempts < maxAttempts) {
        try {
          attempts++;
          await connectToRoom(roomId, true);
          connected = true;
          console.log("Connected to room as admin");
        } catch (error) {
          console.warn(`Connection attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) {
            console.warn(
              "All connection attempts failed, continuing with local camera only"
            );
            // Don't show error - just work locally
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * attempts)
            );
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "Failed to access camera. Please check permissions and try again."
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setAdminStream(null);
      setIsAdminStreaming(false);
      setIsCameraActive(false);
      disconnectFromRoom();
    }
  };

  const handleSendMessage = () => {
    if (chatInputRef.current?.value.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "Admin",
        message: chatInputRef.current.value,
        timestamp: new Date(),
        isStaff: true,
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

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-[#f8fafc] pb-8">
        <div className="container mx-auto p-20 pt-10 space-y-6">
          {/* Server Status Banner */}
          {serverStatus === "offline" && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>WebSocket Server Offline</strong>
              <p>
                Please make sure the WebSocket server is running on port 3001.
              </p>
              <button
                onClick={checkServerStatus}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Check Again
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[#0a1629]">
              Live Stream Admin
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

                    {cameraError && (
                      <p className="text-red-500 text-sm">{cameraError}</p>
                    )}

                    {isCameraActive && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Status: {connectionStatus}
                        </span>
                        <span className="text-sm text-green-600">
                          Camera is active and streaming
                        </span>
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
                        No messages yet. Start the conversation!
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
                      className="rounded-xl"
                    />
                    <Button
                      onClick={handleSendMessage}
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
    </AdminAuthWrapper>
  );
}
