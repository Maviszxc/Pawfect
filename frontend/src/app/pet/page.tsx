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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Download, Upload, FileText, Mail, Phone } from "lucide-react";

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
  CheckCircle,
  AlertCircle,
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
  images: { url: string }[];
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

interface AdoptionStatus {
  hasApplication: boolean;
  isApproved: boolean;
  isPetUnavailable?: boolean;
  application?: {
    status: string;
    submittedAt: string;
    petName?: string;
    message: string;
  };
  message?: string;
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

  const [adoptionStatus, setAdoptionStatus] = useState<AdoptionStatus | null>(
    null
  );
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Debug: Check Supabase configuration on mount
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔍 Supabase Config Check:', {
      url: supabaseUrl,
      hasKey: !!supabaseKey,
      keyPreview: supabaseKey?.substring(0, 20) + '...',
    });

    // Show alert if not configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ SUPABASE NOT CONFIGURED!');
      console.error('URL:', supabaseUrl);
      console.error('Key exists:', !!supabaseKey);
    } else {
      console.log('✅ Supabase is configured correctly!');
    }
  }, []);

  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptForm, setAdoptForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
  });
  const [adoptSubmitting, setAdoptSubmitting] = useState(false);
  const [adoptSuccess, setAdoptSuccess] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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

  // Check adoption status
  // Update the checkAdoptionStatus function in pet details page
  const checkAdoptionStatus = async (email: string) => {
    if (!petId) return;

    setCheckingStatus(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Only check adoption status if user is authenticated
      if (!token) {
        setCheckingStatus(false);
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/adoptions/check-status`,
        {
          params: { petId, email },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAdoptionStatus(response.data);
      }
    } catch (error) {
      console.error("Error checking adoption status:", error);
      // Don't show error for 401 - just means user needs to login
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        toast.error("Error checking adoption status");
      }
    } finally {
      setCheckingStatus(false);
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
        video: { facingMode: "environment" },
      });

      setCameraStream(mediaStream);
      setIsCameraActive(true);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = mediaStream;
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

    if (token) {
      axiosInstance
        .get(`${BASE_URL}/api/users/current-user`)
        .then((res) => {
          if (res.data.success) {
            const userData = {
              id: res.data.user._id,
              fullname: res.data.user.fullname || "",
              email: res.data.user.email || "",
              profilePicture: res.data.user.profilePicture || "",
            };
            setUserDetails(userData);

            // Check adoption status for this user
            if (userData.email && petId) {
              checkAdoptionStatus(userData.email);
            }
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

    // Check if pet is unavailable or user already has approved application
    if (adoptionStatus?.isPetUnavailable && !adoptionStatus?.isApproved) {
      toast.error(
        "This pet is currently in the adoption process with another adopter. Please choose another pet."
      );
      return;
    }

    if (adoptionStatus?.isApproved) {
      toast.info(
        "Your adoption request has been approved! Please check your email for next steps."
      );
      return;
    }

    setShowAdoptModal(true);
  };

  // Handle adopt form input change
  const handleAdoptInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAdoptForm({ ...adoptForm, [e.target.name]: e.target.value });
  };

  // Handle PDF file selection
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file only.");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB.");
        return;
      }
      setPdfFile(file);
    }
  };

  // Handle adopt form submit
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
        !adoptForm.address.trim()
      ) {
        toast.error("All fields are required.");
        setAdoptSubmitting(false);
        return;
      }

      // Validate PDF file
      if (!pdfFile) {
        toast.error("Please upload the completed adoption form PDF.");
        setAdoptSubmitting(false);
        return;
      }

      // Upload PDF to Supabase
      setIsUploading(true);
      const fileName = `${pet?._id}_${userDetails.id}_${Date.now()}.pdf`;
      const filePath = `adoption-forms/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("adoption-forms")
        .upload(filePath, pdfFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload PDF. Please try again.");
        setAdoptSubmitting(false);
        setIsUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("adoption-forms")
        .getPublicUrl(filePath);

      const adoptionFormUrl = urlData.publicUrl;
      console.log("📄 PDF uploaded successfully:", {
        filePath,
        adoptionFormUrl,
        urlLength: adoptionFormUrl?.length,
        urlData: urlData,
      });

      // Validate URL before proceeding
      if (!adoptionFormUrl || adoptionFormUrl.trim() === "") {
        console.error("❌ Invalid Supabase URL:", urlData);
        toast.error("Failed to generate PDF URL. Please check Supabase configuration.");
        setAdoptSubmitting(false);
        setIsUploading(false);
        return;
      }

      setIsUploading(false);

      const requestData = {
        pet: pet?._id,
        user: userDetails.id,
        fullname: userDetails.fullname,
        email: userDetails.email,
        phone: adoptForm.phone,
        address: adoptForm.address,
        message: `Adoption form submitted for ${pet?.name}`,
        profilePicture: userDetails.profilePicture || "",
        adoptionFormUrl: adoptionFormUrl,
      };
      
      console.log("📤 Sending adoption request:", requestData);

      await axios.post(
        `${BASE_URL}/api/adoptions`,
        requestData,
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
      });
      setPdfFile(null);
      setUploadProgress(0);

      // Refresh adoption status after submission
      if (userDetails?.email) {
        checkAdoptionStatus(userDetails.email);
      }
    } catch (err: any) {
      setAdoptSubmitting(false);

      // Handle specific error cases
      if (err?.response?.data?.isPetUnavailable) {
        toast.error(err.response.data.message);
        // Refresh adoption status to update UI
        if (userDetails?.email) {
          checkAdoptionStatus(userDetails.email);
        }
      } else if (err?.response?.data?.isApproved) {
        toast.info(err.response.data.message);
        setShowAdoptModal(false);
        if (userDetails?.email) {
          checkAdoptionStatus(userDetails.email);
        }
      } else {
        toast.error(
          err?.response?.data?.message ||
            "Failed to submit adoption request. Please try again."
        );
      }
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
                            pet?.adoptionStatus === "Available"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pet?.adoptionStatus === "Available"
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

                      {/* Adoption Status Messages */}
                      {adoptionStatus?.isApproved && (
                        <Alert className="bg-green-50 border-green-200 mt-4">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <strong>
                              You're close to adopting {pet?.name}!
                            </strong>{" "}
                            Please check your email to proceed to the next step.
                          </AlertDescription>
                        </Alert>
                      )}

                      {adoptionStatus?.isPetUnavailable &&
                        !adoptionStatus?.isApproved && (
                          <Alert className="bg-amber-50 border-amber-200 mt-4">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                              <strong>
                                This pet is currently in the adoption process.
                              </strong>{" "}
                              Please choose another available pet.
                            </AlertDescription>
                          </Alert>
                        )}

                      {adoptionStatus?.hasApplication &&
                        !adoptionStatus?.isApproved && (
                          <Alert className="bg-blue-50 border-blue-200 mt-4">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                              Your application is being reviewed by our admin
                              team.
                            </AlertDescription>
                          </Alert>
                        )}

                      {pet?.lastSeen && (
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>
                            Last seen:{" "}
                            {new Date(pet.lastSeen).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {pet?.adoptionStatus === "Available" && !adoptionStatus?.hasApplication && (
                        <Button
                          onClick={handleAdoptClick}
                          className="bg-orange-600 hover:bg-orange-700 text-white w-full py-3 text-lg mt-4 rounded-xl"
                          disabled={
                            adoptionStatus?.isPetUnavailable ||
                            adoptionStatus?.isApproved
                          }
                        >
                          {adoptionStatus?.isApproved
                            ? "Application Approved"
                            : adoptionStatus?.isPetUnavailable
                            ? "Pet Unavailable"
                            : "Adopt Me"}
                        </Button>
                      )}
                      
                      {adoptionStatus?.hasApplication && adoptionStatus?.application && (
                        <Alert className="bg-yellow-50 border-yellow-200 mt-4">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <div className="font-semibold mb-1">Application Already Submitted</div>
                            <div className="text-sm">
                              Status: <span className="font-medium">{adoptionStatus.application.status}</span>
                              {adoptionStatus.application.submittedAt && (
                                <div className="text-xs mt-1">
                                  Submitted: {new Date(adoptionStatus.application.submittedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
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

        {/* Adopt Me Modal - Landscape */}
        <Dialog open={showAdoptModal} onOpenChange={setShowAdoptModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Adoption Application for {pet?.name}
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                Complete the form below to start your adoption journey. We'll review your application and get back to you soon.
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
              <form onSubmit={handleAdoptSubmit} className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - User Info & Contact */}
                  <div className="space-y-6">
                    {/* User Profile Section */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        {userDetails?.profilePicture && (
                          <img
                            src={userDetails.profilePicture}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border-3 border-orange-200 shadow-md"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-xl">{userDetails?.fullname}</div>
                          <div className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                            <Mail className="w-4 h-4" />
                            {userDetails?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 pb-3 border-b border-gray-200">
                        <User className="w-5 h-5 text-orange-500" />
                        Contact Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label
                            className="block text-sm font-semibold text-gray-700 mb-2"
                            htmlFor="phone"
                          >
                            Phone Number *
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              id="phone"
                              name="phone"
                              type="tel"
                              required
                              placeholder="+1 (555) 000-0000"
                              className="w-full border-2 border-gray-300 rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base"
                              value={adoptForm.phone}
                              onChange={handleAdoptInputChange}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label
                            className="block text-sm font-semibold text-gray-700 mb-2"
                            htmlFor="address"
                          >
                            Complete Address *
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                              id="address"
                              name="address"
                              required
                              placeholder="123 Main St, City, State, ZIP Code"
                              rows={3}
                              className="w-full border-2 border-gray-300 rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base resize-none"
                              value={adoptForm.address}
                              onChange={handleAdoptInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - PDF Upload */}
                  <div className="space-y-6">
                    {/* PDF Download and Upload Section */}
                    <div className="space-y-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 pb-3 border-b border-gray-200">
                        <FileText className="w-5 h-5 text-orange-500" />
                        Adoption Form Document
                      </h3>
                  
                  {/* Step 1: Download */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Download Official Form
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Download our adoption form template, fill it out with your information, and save it as a PDF.
                        </p>
                        <a
                          href="/AdoptionForm.pdf"
                          download="AdoptionForm.pdf"
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
                        >
                          <Download className="w-4 h-4" />
                          Download Form (PDF)
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Upload */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Upload Completed Form
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Upload your filled adoption form. Only PDF files up to 10MB are accepted.
                        </p>
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handlePdfFileChange}
                              className="w-full text-sm border-2 border-dashed border-orange-300 rounded-lg p-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer hover:border-orange-400 transition-all"
                              required
                            />
                          </div>
                          {pdfFile && (
                            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900 truncate">{pdfFile.name}</p>
                                <p className="text-xs text-green-700">
                                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          )}
                          {isUploading && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                              <span className="font-medium">Uploading your form...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-3 pt-6 border-t border-gray-200 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdoptModal(false)}
                    disabled={adoptSubmitting}
                    className="px-6 py-2.5 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-2.5 shadow-md hover:shadow-lg transition-all font-semibold"
                    disabled={adoptSubmitting || isUploading}
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
