"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Send, Video, Image as ImageIcon, Play } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";
// Remove duplicate import
// import { Video, Send, Image } from "lucide-react";

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

  // Removed hardcoded petGallery array as we're using dynamic data from pet object

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
    alert(
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
      {isAuthenticated ? <AuthNavigation /> : <Navigation />}
      <div className="container mx-auto pt-28 px-4">
        {" "}
        {/* Added top padding to prevent navbar overlap */}
        {/* Live Stream and Chat Section */}
        <div className="w-full max-w-7xl mx-auto mb-8 flex flex-col lg:flex-row gap-6">
          {/* Live Stream Section - YouTube style */}
          <div className="w-full lg:w-8/12">
            <div className="rounded-xl overflow-hidden shadow-lg bg-black">
              <div className="aspect-video relative">
                {/* Placeholder for livestream - in a real app, this would be a video component */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      Live stream of {pet?.name}
                    </p>
                    <p className="text-sm opacity-70">
                      Stream starts at 10:00 AM daily
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-black text-white">
                <h1 className="text-xl font-bold mb-2">
                  {pet?.name} - Live Stream
                </h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold mr-3">
                      {pet?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">Pet Shelter</p>
                      <p className="text-xs text-gray-400">1.2K followers</p>
                    </div>
                  </div>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Follow
                  </Button>
                </div>
              </div>
            </div>

            {/* Pet Basic Info Card - Below video like YouTube description */}
            <Card className="mt-4 py-7 border-none shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div>
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
                  <div className="flex gap-4">
                    {pet?.adoptionStatus === "available" && (
                      <Button
                        onClick={handleAdoptClick}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {isAuthenticated ? "Adopt Me" : "Login to Adopt"}
                      </Button>
                    )}
                    <Link href="/adoption">
                      <Button
                        variant="outline"
                        className="text-black border-gray-400 hover:bg-white/10"
                      >
                        Back to Adoption
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Chat and Info */}
          <div className="w-full lg:w-4/12 space-y-4">
            {/* Live Chat Section */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-none">
              <CardContent className="p-0 flex flex-col">
                <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <h3 className="font-semibold">Live Chat</h3>
                </div>
                <div
                  className="h-[465px] overflow-y-auto p-4"
                  ref={chatContainerRef}
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-3 ${msg.isStaff ? "" : "text-right"}`}
                    >
                      <div
                        className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                          msg.isStaff
                            ? "bg-gray-100 text-gray-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        <p className="font-semibold text-xs">{msg.sender}</p>
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200 flex">
                  <Input
                    ref={chatInputRef}
                    placeholder="Type your message..."
                    className="flex-1 border-gray-200"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="ml-2 bg-orange-600 hover:bg-orange-700"
                    size="icon"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pet Image */}
            <Card className="shadow-lg rounded-xl overflow-hidden border-none">
              <CardContent className="p-0">
                <img
                  src={pet?.images && pet.images.length > 0 ? pet.images[0] : pet?.image}
                  alt={pet?.name}
                  className="w-full h-[250px] object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">Meet {pet?.name}</h3>
                  <p className="text-sm text-gray-600">
                    Looking for a forever home
                  </p>
                </div>
              </CardContent>
            </Card>
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

              {/* Pet video from database */}
              {pet?.video && pet.video.trim() !== "" && (
                <div className="relative group overflow-hidden rounded-lg">
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  <video
                    src={pet.video}
                    className="w-full h-full object-cover aspect-square"
                    poster={pet?.image} /* Use pet image as video thumbnail */
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-sm font-medium">
                      {pet?.name} video
                    </p>
                  </div>
                </div>
              )}

              {/* If no additional images/videos, show placeholder message */}
              {(!pet?.images || pet.images.length === 0) &&
                (!pet?.video || pet.video.trim() === "") && (
                  <div className="col-span-2 flex items-center justify-center p-8 bg-gray-100 rounded-lg">
                    <p className="text-gray-500">
                      No additional photos or videos available
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
