"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/dynamic-card";
import { Skeleton } from "@/components/ui/dynamic-skeleton";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";

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
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  gender: string;
  image: string;
  images: string[]; // Array of image URLs
  video: string; // Single video URL
  description: string;
  adoptionStatus: string;
  owner?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isStaff: boolean;
}

export default function PetDetailsPage() {
  const searchParams = useSearchParams();
  const petId = searchParams.get("id");
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState("live");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera state
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);

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
          console.error("Error fetching pet details:", err);
          setError("Failed to load pet details. Please try again later.");
          setLoading(false);
        });
    } else {
      setError("No pet ID provided");
      setLoading(false);
    }

    // Simulate initial chat messages
    setChatMessages([
      {
        id: "1",
        sender: "Shelter Staff",
        message: "Welcome to the live chat! Ask any questions about this pet.",
        timestamp: new Date(Date.now() - 3600000),
        isStaff: true,
      },
      {
        id: "2",
        sender: "John",
        message: "Is this pet good with children?",
        timestamp: new Date(Date.now() - 1800000),
        isStaff: false,
      },
      {
        id: "3",
        sender: "Shelter Staff",
        message: "Yes, very friendly with kids of all ages!",
        timestamp: new Date(Date.now() - 1700000),
        isStaff: true,
      },
    ]);
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
          <Loader />
        </div>
      )}
      {isAuthenticated ? <AuthNavigation /> : <Navigation />}
      <div className="container mx-auto pt-28 px-4">
        {/* Pet Details Header */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="w-full lg:w-8/12">
              {/* Hero Image */}
              <div className="rounded-xl overflow-hidden shadow-lg mb-6">
                <img
                  src={pet?.images && pet.images.length > 0 ? pet.images[0] : pet?.image}
                  alt={pet?.name}
                  className="w-full h-[400px] object-cover"
                />
              </div>

              {/* Navigation Tabs */}
              {/* <div className="mb-6 flex items-center justify-between">
                <div className="flex gap-2">
                  <Link href={`/pet?id=${petId}`}>
                    <Button variant="outline" className="bg-white hover:bg-gray-50">
                      Details
                    </Button>
                  </Link>
                  <Link href={`/pet/live?id=${petId}`}>
                    <Button variant="outline" className="bg-white hover:bg-gray-50 flex items-center gap-2">
                      <Video className="h-4 w-4" /> Live
                    </Button>
                  </Link>
                </div>
                <Link href="/adoption">
                  <Button
                    variant="outline"
                    className="text-black border-gray-400 hover:bg-white/10"
                  >
                    Back to Adoption
                  </Button>
                </Link>
              </div> */}

              {/* Pet Basic Info Card */}
              <Card className="mb-6 border-none shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">{pet?.name}</h1>
                      <h2 className="text-xl font-semibold mb-2">
                        About {pet?.name}
                      </h2>
                      <p className="text-gray-700">{pet?.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
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
                        {pet?.age} years old
                      </span>
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
                    {pet?.adoptionStatus === "available" && (
                      <Button
                        onClick={handleAdoptClick}
                        className="bg-orange-600 hover:bg-orange-700 text-white w-full md:w-auto"
                      >
                        {isAuthenticated ? "Adopt Me" : "Login to Adopt"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pet Video Section */}
              {pet?.video && pet.video.trim() !== "" && (
                <Card className="mb-6 border-none shadow-lg rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Video</h2>
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <div
                        className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                        onClick={togglePlayPause}
                      >
                        {isPlaying ? (
                          <Pause className="w-16 h-16 text-white" fill="white" />
                        ) : (
                          <Play className="w-16 h-16 text-white" fill="white" />
                        )}
                      </div>
                      <video
                        ref={videoRef}
                        src={pet.video}
                        className="w-full h-full object-cover"
                        poster={pet?.image}
                        loop
                        muted
                        onClick={togglePlayPause}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar - Pet Info */}
            <div className="w-full lg:w-4/12">
              <Card className="shadow-lg rounded-xl overflow-hidden border-none sticky top-28">
                <CardContent className="p-0">
                  <img
                    src={
                      pet?.images && pet.images.length > 0
                        ? pet.images[0]
                        : pet?.image
                    }
                    alt={pet?.name}
                    className="w-full h-[250px] object-cover"
                  />
                  <div className="p-6">
                    <h3 className="font-semibold text-lg">Meet {pet?.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Looking for a forever home
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{pet?.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Breed:</span>
                        <span className="font-medium">{pet?.breed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{pet?.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{pet?.gender}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Pet Gallery Section - Modern grid with dynamic images from pet data */}
        <Card className="w-full max-w-7xl mx-auto mb-8 shadow-lg rounded-xl overflow-hidden border-none">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Additional pet images from database */}
              {pet?.images &&
                pet.images.length > 0 &&
                pet.images.map((img, index) => (
                  <div
                    key={`img-${index}`}
                    className="relative group overflow-hidden rounded-lg"
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
                      alt={`${pet?.name} photo ${index + 1}`}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-sm font-medium">
                        {pet?.name} photo {index + 1}
                      </p>
                    </div>
                  </div>
                ))}

              {/* If no additional images, show placeholder message */}
              {(!pet?.images || pet.images.length === 0) && (
                <div className="col-span-3 flex items-center justify-center p-8 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">
                    No additional photos available
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating About Button */}
      <Link
        href="/about"
        className="fixed bottom-8 right-8 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-40"
      >
        <i className="bi bi-info-circle text-xl"></i>
      </Link>
    </main>
  );
}
