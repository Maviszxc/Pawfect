"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/dynamic-card";
import { Skeleton } from "@/components/ui/dynamic-skeleton";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axiosInstance";

// Dynamically import Tabs components
const Tabs = dynamic(
  () => import("@/components/ui/tabs").then((mod) => mod.Tabs),
  { ssr: true }
);
const TabsContent = dynamic(
  () => import("@/components/ui/tabs").then((mod) => mod.TabsContent),
  { ssr: true }
);
const TabsList = dynamic(
  () => import("@/components/ui/tabs").then((mod) => mod.TabsList),
  { ssr: true }
);
const TabsTrigger = dynamic(
  () => import("@/components/ui/tabs").then((mod) => mod.TabsTrigger),
  { ssr: true }
);
import { Input } from "@/components/ui/input";
import {
  Send,
  Video,
  Image as ImageIcon,
  Play,
  Pause,
  Camera,
  CameraOff,
  Heart,
  Share2,
  MapPin,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: string;
  gender: string;
  image?: string;
  images: { url: string }[]; // <-- update type
  videos: (string | { url: string })[];
  description: string;
  adoptionStatus: string;
  owner?: string;
  location?: string;
  lastSeen?: Date;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isStaff: boolean;
}

function PetDetailsContent() {
  const searchParams = useSearchParams();
  const petId = searchParams.get("id");
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState("gallery");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Camera state
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);

  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptForm, setAdoptForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });
  const [adoptSubmitting, setAdoptSubmitting] = useState(false);
  const [adoptSuccess, setAdoptSuccess] = useState(false);
  const [userDetails, setUserDetails] = useState<{
    id: string;
    fullname: string;
    email: string;
    profilePicture?: string;
  } | null>(null);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextImage = () => {
    if (pet?.images) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === pet.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (pet?.images) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? pet.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Check if browser supports media devices
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

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer rear camera on mobile
      });

      setCameraStream(mediaStream);
      setIsCameraActive(true);

      // Set the stream directly to the video element
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = mediaStream;
        // Wait for the video to load and play
        cameraVideoRef.current.onloadedmetadata = () => {
          cameraVideoRef.current?.play().catch((e) => {
            console.error("Error playing camera stream:", e);
          });
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Unable to access camera: " + (err as Error).message);
      setIsCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
      setCameraStream(null);
      setIsCameraActive(false);

      // Clear the video element
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
      }
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Update video element when camera stream changes
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);

    // Fetch pet details
    if (petId) {
      setLoading(true);
      axios
        .get(`${BASE_URL}/api/pets/${petId}`)
        .then((response) => {
          if (!response.data.success) {
            throw new Error("Pet not found");
          }
          setPet(response.data.pet);
          setLoading(false);
        })
        .catch((err) => {
          toast.error("Failed to load pet details. Please try again later.");
          console.error("Error fetching pet details:", err);
          setError("Failed to load pet details. Please try again later.");
          setLoading(false);
        });
    } else {
      setError("No pet ID provided");
      setLoading(false);
    }

    // Fetch user details for autofill (including id)
    if (token) {
      axiosInstance
        .get(`${BASE_URL}/api/users/current-user`)
        .then((res) => {
          if (res.data.success) {
            setUserDetails({
              id: res.data.user._id,
              fullname: res.data.user.fullname || "",
              email: res.data.user.email || "",
              profilePicture: res.data.user.profilePicture || "",
            });
          }
        })
        .catch(() => {});
    }
  }, [petId]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (chatInputRef.current && chatInputRef.current.value.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "You",
        message: chatInputRef.current.value,
        timestamp: new Date(),
        isStaff: false,
      };
      setChatMessages([...chatMessages, newMessage]);
      chatInputRef.current.value = "";

      // Simulate staff response after 1 second
      setTimeout(() => {
        const staffResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "Shelter Staff",
          message: "Thanks for your interest! Our staff will respond shortly.",
          timestamp: new Date(),
          isStaff: true,
        };
        setChatMessages((prev) => [...prev, staffResponse]);
      }, 1000);
    }
  };

  const handleAdoptClick = () => {
    if (!isAuthenticated) {
      window.location.href = "/auth/login";
      return;
    }

    // Here you would implement the adoption logic
    console.log(
      `Thank you for your interest in adopting ${pet?.name}! We'll contact you soon.`
    );
  };

  // Handle adopt form input change
  const handleAdoptInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAdoptForm({ ...adoptForm, [e.target.name]: e.target.value });
  };

  // Simulate adopt form submit (replace with real API if needed)
  const handleAdoptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdoptSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");

      // Ensure all required fields are present and not empty
      if (
        !userDetails?.id ||
        !userDetails.fullname ||
        !userDetails.email ||
        !adoptForm.phone.trim() ||
        !adoptForm.address.trim() ||
        !adoptForm.message.trim()
      ) {
        toast.error("All fields are required.");
        setAdoptSubmitting(false);
        return;
      }

      await axios.post(
        `${BASE_URL}/api/adoptions`,
        {
          pet: pet?._id,
          user: userDetails.id,
          fullname: userDetails.fullname,
          email: userDetails.email,
          phone: adoptForm.phone,
          address: adoptForm.address,
          message: adoptForm.message,
          profilePicture: userDetails.profilePicture || "", // <-- send profile picture
        },
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      );

      setAdoptSubmitting(false);
      setShowAdoptModal(false);
      setAdoptSuccess(true);
      toast.success("Your adoption request has been submitted!");
      setAdoptForm({
        fullname: "",
        email: "",
        phone: "",
        address: "",
        message: "",
      });
    } catch (err: any) {
      setAdoptSubmitting(false);
      toast.error(
        err?.response?.data?.message ||
          "Failed to submit adoption request. Please try again."
      );
    }
  };

  // Helper to get video URL (handles both string and object)
  const getVideoUrl = (video: string | { url: string }) =>
    typeof video === "string" ? video : video?.url;

  // When opening the modal, prefill the form with user details if available
  useEffect(() => {
    if (showAdoptModal && userDetails) {
      setAdoptForm((prev) => ({
        ...prev,
        fullname: userDetails.fullname,
        email: userDetails.email,
      }));
    }
  }, [showAdoptModal, userDetails]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="h-[300px] w-full md:w-[400px] rounded-md" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-1/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4 ">{error}</h1>
        <Link href="/adoption">
          <Button>Back to Adoption Page</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
            <Loader />
          </div>
        )}
        {isAuthenticated ? <AuthNavigation /> : <Navigation />}

        <div className="container mx-auto pt-28 px-4">
          {/* Pet Details Card UI */}
          <div className="w-full max-w-6xl mx-auto mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Images & Video */}
              <div className="space-y-6">
                {/* Main Image Gallery */}
                <Card className="rounded-xl shadow-lg overflow-hidden border-none">
                  <div className="relative aspect-square">
                    <img
                      src={
                        pet?.images &&
                        pet.images.length > 0 &&
                        pet.images[currentImageIndex]?.url
                          ? pet.images[currentImageIndex].url
                          : pet?.image || "/placeholder-pet.jpg"
                      }
                      alt={pet?.name}
                      className="w-full h-full object-cover"
                    />

                    {pet?.images && pet.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {pet.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full ${
                                index === currentImageIndex
                                  ? "bg-white"
                                  : "bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`p-2 rounded-full ${
                          isFavorite
                            ? "bg-red-500 text-white"
                            : "bg-white/80 text-gray-700 hover:bg-white"
                        }`}
                      >
                        <Heart
                          size={20}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                      <button className="p-2 rounded-full bg-white/80 text-gray-700 hover:bg-white">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Image Thumbnails */}
                  {pet?.images && pet.images.length > 1 && (
                    <div className="p-4 flex space-x-2 overflow-x-auto">
                      {pet.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                            index === currentImageIndex
                              ? "border-orange-500"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={img.url || "/placeholder-pet.jpg"}
                            alt={`${pet.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Pet Video Section */}
                {pet?.videos && pet.videos.length > 0 && (
                  <div className="space-y-4 mt-6">
                    {pet.videos.map((video, idx) => (
                      <Card
                        key={idx}
                        className="border-none shadow-lg rounded-xl overflow-hidden"
                      >
                        <CardContent className="p-0">
                          <div className="relative aspect-video rounded-lg overflow-hidden">
                            <video
                              src={getVideoUrl(video)}
                              controls
                              className="w-full h-full object-cover"
                              poster={pet?.image}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Pet Info */}
              <div className="space-y-6">
                <Card className="rounded-xl shadow-lg overflow-hidden border-none">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <h1 className="text-3xl font-bold text-gray-800">
                          {pet?.name}
                        </h1>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            pet?.adoptionStatus === "available"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pet?.adoptionStatus === "available"
                            ? "Available for Adoption"
                            : "Not Available"}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin size={16} className="mr-1" />
                        <span className="text-sm">
                          {pet?.location || "Animal Shelter, City"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 my-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {pet?.type}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {pet?.breed}
                        </span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {pet?.gender}
                        </span>
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                          {typeof pet?.age === "string"
                            ? pet?.age
                            : `${pet?.age} years old`}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg mt-4">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800">
                          About {pet?.name}
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                          {pet?.description}
                        </p>
                      </div>

                      {pet?.lastSeen && (
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>
                            Last seen:{" "}
                            {new Date(pet.lastSeen).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {pet?.adoptionStatus === "available" && (
                        <Button
                          onClick={() => setShowAdoptModal(true)}
                          className="bg-orange-600 hover:bg-orange-700 text-white w-full py-3 text-lg mt-4 rounded-xl"
                        >
                          Adopt Me
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Live Chat Section */}
                <Card className="rounded-xl shadow-lg overflow-hidden border-none">
                  <CardContent className="p-0">
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsContent value="gallery" className="p-4 m-0">
                        <div className="grid grid-cols-3 gap-2">
                          {pet?.images && pet.images.length > 0 ? (
                            pet.images.map((img, index) => (
                              <div
                                key={index}
                                className="aspect-square overflow-hidden rounded-lg"
                              >
                                <img
                                  src={img.url || "/placeholder-pet.jpg"}
                                  alt={`${pet.name} ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => {
                                    setCurrentImageIndex(index);
                                    setActiveTab("gallery");
                                  }}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 text-center py-8 text-gray-500">
                              No additional images available
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="live" className="m-0 p-0">
                        <div className="flex flex-col h-80">
                          <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                          >
                            {chatMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${
                                  msg.isStaff ? "justify-start" : "justify-end"
                                }`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 ${
                                    msg.isStaff
                                      ? "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                                      : "bg-orange-100 text-gray-800 rounded-tr-none"
                                  }`}
                                >
                                  <div className="font-medium text-sm">
                                    {msg.sender}
                                  </div>
                                  <p>{msg.message}</p>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {msg.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-3 border-t border-gray-200 flex items-center">
                            <Input
                              ref={chatInputRef}
                              placeholder="Type your message..."
                              className="flex-1 rounded-l-xl rounded-r-none border-r-0"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") handleSendMessage();
                              }}
                            />
                            <Button
                              onClick={handleSendMessage}
                              className="rounded-l-none rounded-r-xl bg-orange-600 hover:bg-orange-700"
                            >
                              <Send size={18} />
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Adopt Me Modal */}
        <Dialog open={showAdoptModal} onOpenChange={setShowAdoptModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adoption Application</DialogTitle>
              <DialogDescription>
                Please fill out the form below to apply for adopting{" "}
                <b>{pet?.name}</b>.
              </DialogDescription>
            </DialogHeader>
            {adoptSuccess ? (
              <div className="py-8 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <div className="font-semibold text-green-600 mb-2">
                  Thank you for your application!
                </div>
                <div className="text-gray-700">
                  Your adoption request has been sent to the admin. You will be
                  contacted soon.
                </div>
                <Button className="mt-6" onClick={() => setAdoptSuccess(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAdoptSubmit} className="space-y-4">
                {/* Show user info, not editable */}
                <div className="flex items-center gap-3 mb-2">
                  {userDetails?.profilePicture && (
                    <img
                      src={userDetails.profilePicture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  )}
                  <div>
                    <div className="font-semibold">{userDetails?.fullname}</div>
                    <div className="text-gray-500 text-sm">
                      {userDetails?.email}
                    </div>
                  </div>
                </div>

                {/* Remove Full Name and Email fields */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="phone"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    value={adoptForm.phone}
                    onChange={handleAdoptInputChange}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="address"
                  >
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="w-full border rounded-lg px-3 py-2"
                    value={adoptForm.address}
                    onChange={handleAdoptInputChange}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="message"
                  >
                    Why do you want to adopt {pet?.name}?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2"
                    value={adoptForm.message}
                    onChange={handleAdoptInputChange}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdoptModal(false)}
                    disabled={adoptSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={adoptSubmitting}
                  >
                    {adoptSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Floating About Button */}
        <Link
          href="/about"
          className="fixed bottom-8 right-8 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-40"
        >
          <User size={24} />
        </Link>
      </main>

      {/* Toast container (if not already in _app.tsx) */}
      {/* <ToastContainer /> */}
    </>
  );
}

export default function PetDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Loader />
            <p className="mt-4 text-gray-600">Loading pet details...</p>
          </div>
        </div>
      }
    >
      <PetDetailsContent />
    </Suspense>
  );
}
