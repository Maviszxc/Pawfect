// app/admin/live/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Camera,
  CameraOff,
  RefreshCw,
  Users,
  Eye,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Mic,
  MicOff,
  Pause,
  Play,
  Heart,
  MessageCircle,
} from "lucide-react";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { useVideoStream } from "@/context/VideoStreamContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NetworkStatus } from "@/components/NetworkStatus";
import { BASE_URL } from "@/utils/constants";
import { toast } from "react-toastify";

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
  reminderSent: boolean;
  startNotificationSent: boolean;
  participants: Array<{
    user: string;
    email: string;
    fullname: string;
    notified: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLivePage() {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Schedule states
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    duration: 60,
  });
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

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
    isPaused,
    pauseStream,
    resumeStream,
    heartReactions,
    totalHearts,
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

  // Track total views based on totalParticipants changes
  useEffect(() => {
    if (isCameraActive && totalParticipants > totalViews) {
      setTotalViews(totalParticipants);
    }
  }, [totalParticipants, isCameraActive, totalViews]);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Fetch user data and schedules on component mount
  useEffect(() => {
    fetchCurrentUser();
    fetchUpcomingSchedules();
  }, [fetchCurrentUser]);

  const fetchUpcomingSchedules = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      // ✅ FIX: Use BASE_URL for API calls
      const response = await fetch(`${BASE_URL}/api/schedules/upcoming`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSchedule(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${BASE_URL}/api/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleFormData),
      });
      const data = await response.json();

      if (data.success) {
        setShowScheduleForm(false);
        setScheduleFormData({
          title: "",
          description: "",
          scheduledDate: "",
          duration: 60,
        });
        fetchUpcomingSchedules();
        toast.success(
          "✅ Schedule created successfully! Notifications sent to all users."
        );
      } else {
        toast.error("❌ Failed to create schedule: " + data.message);
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("❌ Error creating schedule");
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      // ✅ FIX: Use BASE_URL for API calls
      const response = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        fetchUpcomingSchedules();
        if (selectedSchedule === scheduleId) {
          setSelectedSchedule("");
        }
        toast.success("✅ Schedule deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("❌ Error deleting schedule");
    }
  };

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

      // If a schedule is selected, mark it as live and send notifications
      if (selectedSchedule) {
        try {
          const token = localStorage.getItem("accessToken");
          // ✅ FIX: Use BASE_URL for API calls
          const response = await fetch(
            `${BASE_URL}/api/schedules/${selectedSchedule}/start`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            console.log("✅ Live notifications sent for schedule");
            fetchUpcomingSchedules(); // Refresh schedules to update status
          }
        } catch (error) {
          console.error("❌ Failed to send live notifications:", error);
        }
      }

      await connectToRoom(roomId, true);
      
      // Start duration timer and reset stats
      setStreamDuration(0);
      setTotalViews(0);
      durationIntervalRef.current = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "Failed to access camera. Please check permissions and try again."
      );
      stopCamera();
    }
  };

  const stopCamera = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setAdminStream(null);
      setIsCameraActive(false);
      setIsMuted(false);
      disconnectFromRoom();
      
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setStreamDuration(0);

      // If a schedule was selected, mark it as completed
      if (selectedSchedule) {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(
            `${BASE_URL}/api/schedules/${selectedSchedule}/complete`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            console.log("✅ Schedule marked as completed");
            toast.success("Live stream ended. Schedule marked as completed.");
            fetchUpcomingSchedules(); // Refresh schedules
            setSelectedSchedule(""); // Clear selection
          }
        } catch (error) {
          console.error("❌ Failed to mark schedule as completed:", error);
        }
      } else {
        toast.info("Live stream ended.");
      }
    }
  };

  const toggleMute = () => {
    if (cameraStream) {
      const audioTracks = cameraStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handlePauseStream = () => {
    if (cameraStream) {
      // Disable all tracks when pausing
      cameraStream.getTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    pauseStream();
  };

  const handleResumeStream = () => {
    if (cameraStream) {
      // Re-enable all tracks when resuming
      cameraStream.getTracks().forEach((track) => {
        track.enabled = true;
      });
      // Restore mute state
      if (isMuted) {
        const audioTracks = cameraStream.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = false;
        });
      }
    }
    resumeStream();
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

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Filter schedules to show only upcoming ones
  const upcomingSchedules = schedules.filter(
    (schedule) => schedule.status === "scheduled" || schedule.status === "live"
  );

  return (
    <AdminAuthWrapper>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Live Stream Control
                </h1>
                {isCameraActive && (
                  <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
              </div>
              {currentUser && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={getProfilePictureUrl(currentUser.profilePicture)}
                      alt={currentUser.fullname}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(currentUser.fullname)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">
                    {currentUser.fullname}
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={reconnect}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="rounded-xl border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
                    <div className="text-xs text-gray-500">Total Viewers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalHearts}</div>
                    <div className="text-xs text-gray-500">Hearts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{chatMessages.filter(m => !m.isSystem).length}</div>
                    <div className="text-xs text-gray-500">Comments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      {/* Floating Hearts Overlay */}
                      {heartReactions.map((heart) => (
                        <div
                          key={heart.id}
                          className="absolute bottom-4 pointer-events-none z-50"
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
                      
                      {cameraStream ? (
                        <>
                          <video
                            ref={cameraVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${
                              isPaused ? "opacity-0" : ""
                            }`}
                          />
                          {isPaused && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white z-10">
                              <div className="text-center p-6">
                                <Pause className="w-20 h-20 mb-6 mx-auto text-yellow-400 animate-pulse" />
                                <h3 className="text-3xl font-bold mb-3">
                                  Stream Paused
                                </h3>
                                <p className="text-gray-300 mb-4">
                                  Your viewers see a "Stream Paused" message
                                </p>
                                <p className="text-sm text-gray-400">
                                  Click Resume to continue broadcasting
                                </p>
                              </div>
                            </div>
                          )}
                        </>
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
                          Start Live
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={stopCamera}
                            variant="destructive"
                            className="flex-1 rounded-xl"
                          >
                            <CameraOff className="w-4 h-4 mr-2" />
                            End Live  
                          </Button>
                          <Button
                            onClick={isPaused ? handleResumeStream : handlePauseStream}
                            variant={isPaused ? "default" : "outline"}
                            className="rounded-xl px-4"
                            title={isPaused ? "Resume Stream" : "Pause Stream"}
                          >
                            {isPaused ? (
                              <Play className="w-4 h-4" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            onClick={toggleMute}
                            variant={isMuted ? "destructive" : "outline"}
                            className="rounded-xl px-4"
                            title={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? (
                              <MicOff className="w-4 h-4" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Schedule Selector */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">
                        Select Schedule (optional)
                      </label>
                      <select
                        value={selectedSchedule}
                        onChange={(e) => setSelectedSchedule(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl bg-white"
                        disabled={isCameraActive}
                      >
                        <option value="">No schedule selected</option>
                        {upcomingSchedules.map((schedule) => (
                          <option key={schedule._id} value={schedule._id}>
                            {schedule.title} -{" "}
                            {new Date(schedule.scheduledDate).toLocaleString()}
                          </option>
                        ))}
                      </select>
                      {selectedSchedule && (
                        <p className="text-sm text-green-600">
                          ✅ This live stream will be associated with the
                          selected schedule and notifications will be sent to
                          users.
                        </p>
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
                      <div className="space-y-2">
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
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <span className="text-sm font-medium text-gray-700">
                            Stream Duration:
                          </span>
                          <span className="text-lg font-bold text-orange-600 font-mono">
                            {formatDuration(streamDuration)}
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
                      return (
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
                      );
                    })}
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

          {/* Schedule Management Section */}
          <Card className="w-full rounded-2xl shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#0a1629]">
                  Live Stream Schedules
                </h2>
                <Button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Schedule
                </Button>
              </div>

              {/* Schedule Creation Form */}
              {showScheduleForm && (
                <Card className="mb-6 border-orange-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Create New Schedule
                    </h3>
                    <form onSubmit={createSchedule} className="space-y-4">
                      <Input
                        placeholder="Schedule Title"
                        value={scheduleFormData.title}
                        onChange={(e) =>
                          setScheduleFormData({
                            ...scheduleFormData,
                            title: e.target.value,
                          })
                        }
                        required
                        className="rounded-xl"
                      />
                      <Textarea
                        placeholder="Schedule Description"
                        value={scheduleFormData.description}
                        onChange={(e) =>
                          setScheduleFormData({
                            ...scheduleFormData,
                            description: e.target.value,
                          })
                        }
                        required
                        className="rounded-xl"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="datetime-local"
                          value={scheduleFormData.scheduledDate}
                          onChange={(e) =>
                            setScheduleFormData({
                              ...scheduleFormData,
                              scheduledDate: e.target.value,
                            })
                          }
                          required
                          className="rounded-xl"
                        />
                        <Input
                          type="number"
                          placeholder="Duration (minutes)"
                          value={scheduleFormData.duration}
                          onChange={(e) =>
                            setScheduleFormData({
                              ...scheduleFormData,
                              duration: parseInt(e.target.value) || 60,
                            })
                          }
                          min="1"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="bg-orange-500 hover:bg-orange-600 rounded-xl"
                          disabled={isCreatingSchedule}
                        >
                          {isCreatingSchedule
                            ? "Creating..."
                            : "Create Schedule"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowScheduleForm(false)}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Schedules List */}
              <div className="space-y-4">
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming schedules. Create one to notify users!</p>
                  </div>
                ) : (
                  upcomingSchedules.map((schedule) => (
                    <Card
                      key={schedule._id}
                      className={
                        schedule.status === "live"
                          ? "border-green-200 bg-green-50"
                          : schedule._id === selectedSchedule
                          ? "border-orange-200 bg-orange-50"
                          : ""
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {schedule.title}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  schedule.status === "scheduled"
                                    ? "bg-blue-100 text-blue-800"
                                    : schedule.status === "live"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {schedule.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">
                              {schedule.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(
                                  schedule.scheduledDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(
                                  schedule.scheduledDate
                                ).toLocaleTimeString()}
                              </div>
                              <span>Duration: {schedule.duration} minutes</span>
                            </div>
                            {schedule.reminderSent && (
                              <div className="mt-2 text-xs text-green-600">
                                ✅ 1-hour reminder sent
                              </div>
                            )}
                            {schedule.startNotificationSent && (
                              <div className="mt-2 text-xs text-red-600">
                                🔴 Live notification sent
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {schedule.status === "scheduled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedSchedule(schedule._id)
                                }
                                className={
                                  selectedSchedule === schedule._id
                                    ? "bg-orange-500 text-white hover:bg-orange-600"
                                    : ""
                                }
                              >
                                {selectedSchedule === schedule._id
                                  ? "Selected"
                                  : "Select"}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteSchedule(schedule._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Information Panel */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-800 mb-2">
                  How it works:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • Create a schedule to notify all users via email
                    immediately
                  </li>
                  <li>
                    • Users automatically get a reminder 1 hour before the
                    stream
                  </li>
                  <li>
                    • Select a schedule before starting camera to send live
                    notifications
                  </li>
                  <li>
                    • Users receive 3 emails: creation, 1-hour reminder, and
                    live start
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
