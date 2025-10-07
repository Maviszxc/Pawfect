"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Archive,
  RotateCcw,
  Upload,
  X,
  Grid,
  List,
  Eye,
  Video,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: string;
  gender: string;
  images: { url: string }[];
  videos: { url: string }[];
  description: string;
  adoptionStatus: string;
  isArchived: boolean;
  owner?: string;
  createdAt?: string;
}
export default function AdminPetsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal state for Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    breed: "",
    age: "",
    gender: "",
    description: "",
    adoptionStatus: "Available",
    images: [] as File[],
    imagePreviews: [] as string[],
    videos: [] as File[],
    videoPreviews: [] as string[],
  });

  // For image navigation in modal
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // For video enlarge modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalSrc, setVideoModalSrc] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    // Reset image index when modal opens
    if (viewDialogOpen) setCurrentImageIndex(0);
  }, [viewDialogOpen]);

  // Update the fetchPets function
  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      const response = await axiosInstance.get(
        `${BASE_URL}/api/pets/admin/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      if (response.data.success) {
        setPets(response.data.pets);
      }
    } catch (error) {
      toast.error("Error fetching pets. Please try again.");
      console.error("Error fetching pets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("type", form.type);
      formData.append("breed", form.breed);
      formData.append("age", form.age);
      formData.append("gender", form.gender);
      formData.append("description", form.description);
      formData.append("adoptionStatus", form.adoptionStatus);

      // Append images if selected
      form.images.forEach((image) => {
        formData.append("images", image);
      });

      // Append videos if selected
      form.videos.forEach((video) => {
        formData.append("videos", video);
      });

      interface UploadProgressEvent {
        loaded: number;
        total?: number;
      }

      interface AxiosConfig {
        headers: {
          "Content-Type": string;
        };
        timeout: number;
        onUploadProgress: (progressEvent: UploadProgressEvent) => void;
      }

      const config: AxiosConfig = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
        onUploadProgress: (progressEvent: UploadProgressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      };

      if (editPet) {
        await axiosInstance.put(
          `${BASE_URL}/api/pets/${editPet._id}`,
          formData,
          config
        );
        toast.success("Pet updated successfully.");
      } else {
        await axiosInstance.post(`${BASE_URL}/api/pets`, formData, config);
        toast.success("Pet added successfully.");
      }

      setModalOpen(false);
      fetchPets();
    } catch (error: any) {
      toast.error("Failed to save pet. Please try again.");
      console.error("Failed to save pet:", error);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleArchivePet = async (petId: string) => {
    setIsProcessing(true);
    try {
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/pets/${petId}/archive`
      );
      if (response.data.success) {
        setPets(
          pets.map((pet) =>
            pet._id === petId
              ? { ...pet, isArchived: true, adoptionStatus: "archived" }
              : pet
          )
        );
        toast.success("Pet archived successfully.");
      }
    } catch (error) {
      toast.error("Error archiving pet. Please try again.");
      console.error("Error archiving pet:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePet = async (petId: string) => {
    setIsProcessing(true);
    try {
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/pets/${petId}/restore`
      );
      if (response.data.success) {
        setPets(
          pets.map((pet) =>
            pet._id === petId
              ? { ...pet, isArchived: false, adoptionStatus: "available" }
              : pet
          )
        );
        toast.success("Pet restored successfully.");
      }
    } catch (error) {
      toast.error("Error restoring pet. Please try again.");
      console.error("Error restoring pet:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditPet(pet);
    setForm({
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender,
      description: pet.description,
      adoptionStatus: pet.adoptionStatus,
      images: [],
      imagePreviews: pet.images ? pet.images.map((img) => img.url) : [],
      videos: [],
      videoPreviews: pet.videos ? pet.videos.map((v) => v.url) : [],
    });
    setModalOpen(true);
  };

  const handleView = (pet: Pet) => {
    setSelectedPet(pet);
    setViewDialogOpen(true);
  };

  const handleAdd = () => {
    setEditPet(null);
    setForm({
      name: "",
      type: "",
      breed: "",
      age: "",
      gender: "",
      description: "",
      adoptionStatus: "available",
      images: [],
      imagePreviews: [],
      videos: [],
      videoPreviews: [],
    });
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      const newImagePreviews = newImages.map((file) =>
        URL.createObjectURL(file)
      );

      setForm({
        ...form,
        images: [...form.images, ...newImages],
        imagePreviews: [...form.imagePreviews, ...newImagePreviews],
      });
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newVideos = Array.from(files);
      const newVideoPreviews = newVideos.map((file) =>
        URL.createObjectURL(file)
      );

      setForm({
        ...form,
        videos: [...form.videos, ...newVideos],
        videoPreviews: [...form.videoPreviews, ...newVideoPreviews],
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...form.images];
    const newImagePreviews = [...form.imagePreviews];

    newImages.splice(index, 1);
    newImagePreviews.splice(index, 1);

    setForm({
      ...form,
      images: newImages,
      imagePreviews: newImagePreviews,
    });
  };

  const removeVideo = (index: number) => {
    const newVideos = [...form.videos];
    const newVideoPreviews = [...form.videoPreviews];

    newVideos.splice(index, 1);
    newVideoPreviews.splice(index, 1);

    setForm({
      ...form,
      videos: newVideos,
      videoPreviews: newVideoPreviews,
    });
  };

  const getAgeText = (age: string) => {
    switch (age) {
      case "kitten":
        return "< 1 year";
      case "young adult":
        return "1-3 years";
      case "mature adult":
        return "4-7 years";
      case "adult":
        return "8+ years";
      default:
        return age;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "adopted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dog":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cat":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Filter pets based on active tab and search query
  const filteredPets = pets.filter((pet) => {
    const matchesTab =
      activeTab === "active" ? !pet.isArchived : pet.isArchived;
    const matchesSearch = searchQuery
      ? pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.age.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesTab && matchesSearch;
  });

  return (
    <>
      <AdminAuthWrapper>
        <div className="min-h-screen bg-gray-50 pb-8 px-4 sm:px-6">
          <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-sm px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Pet Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage all pets in the system
                  </p>
                </div>
                <div className="flex flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={fetchPets}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleAdd}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Pet
                  </Button>
                </div>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-6">
                    {/* Tabs and controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <TabsList className="inline-flex p-1 bg-gray-100 rounded-lg">
                            <TabsTrigger
                              value="active"
                              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
                            >
                              Active Pets
                            </TabsTrigger>
                            <TabsTrigger
                              value="archived"
                              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
                            >
                              Archive
                            </TabsTrigger>
                          </TabsList>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial sm:w-64">
                              <Input
                                type="text"
                                placeholder="Search pets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                              />
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-500" />
                              </div>
                            </div>

                            <div className="flex border rounded-md overflow-hidden">
                              <Button
                                variant={
                                  viewMode === "grid" ? "default" : "ghost"
                                }
                                size="icon"
                                onClick={() => setViewMode("grid")}
                                className="h-9 w-9 rounded-none"
                              >
                                <Grid className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={
                                  viewMode === "list" ? "default" : "ghost"
                                }
                                size="icon"
                                onClick={() => setViewMode("list")}
                                className="h-9 w-9 rounded-none"
                              >
                                <List className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <TabsContent value="active" className="mt-0">
                          <div className="flex items-center justify-between m-2">
                            <p className="text-sm text-gray-600">
                              {filteredPets.length}{" "}
                              {filteredPets.length === 1 ? "pet" : "pets"} found
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="archived" className="mt-0">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">
                              {filteredPets.length}{" "}
                              {filteredPets.length === 1 ? "pet" : "pets"} in
                              archive
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Pet Cards/List */}
                    {isLoading ? (
                      <div className="flex justify-center items-center py-20">
                        <Loader />
                      </div>
                    ) : (
                      <>
                        {filteredPets.length === 0 ? (
                          <div className="text-center py-16 border border-dashed rounded-lg">
                            <div className="text-gray-400 mb-2">
                              {activeTab === "active" ? (
                                <p>No active pets found</p>
                              ) : (
                                <p>No archived pets found</p>
                              )}
                            </div>
                            <Button onClick={handleAdd} className="mt-4">
                              <Plus className="h-4 w-4 mr-2" /> Add Pet
                            </Button>
                          </div>
                        ) : viewMode === "grid" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPets.map((pet) => (
                              <Card
                                key={pet._id}
                                className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                                  pet.isArchived ? "opacity-80" : ""
                                }`}
                                onClick={() => handleView(pet)}
                              >
                                <div className="relative">
                                  <div className="h-72 overflow-hidden">
                                    <img
                                      src={
                                        pet.images && pet.images.length > 0
                                          ? pet.images[0].url
                                          : "/placeholder-pet.jpg"
                                      }
                                      alt={pet.name}
                                      className="w-full h-full object-cover transition-transform hover:scale-105"
                                    />
                                  </div>
                                  <div className="absolute top-3 right-3">
                                    <Badge
                                      className={`${getStatusColor(
                                        pet.adoptionStatus
                                      )} border`}
                                    >
                                      {pet.adoptionStatus
                                        .charAt(0)
                                        .toUpperCase() +
                                        pet.adoptionStatus.slice(1)}
                                    </Badge>
                                  </div>
                                  {pet.isArchived && (
                                    <div className="absolute top-3 left-3">
                                      <Badge
                                        variant="secondary"
                                        className="border"
                                      >
                                        Archived
                                      </Badge>
                                    </div>
                                  )}
                                  {pet.videos && pet.videos.length > 0 && (
                                    <div className="absolute bottom-3 left-3">
                                      <div className="bg-black bg-opacity-50 rounded-full p-1">
                                        <Video className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <CardContent className="p-4 ">
                                  <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-lg text-gray-900">
                                      {pet.name}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className={`capitalize ${getTypeColor(
                                        pet.type
                                      )} border`}
                                    >
                                      {pet.type}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                    <div>
                                      <span className="text-gray-500 text-xs">
                                        Breed:
                                      </span>
                                      <p className="font-medium truncate">
                                        {pet.breed}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-xs">
                                        Age:
                                      </span>
                                      <p className="font-medium">
                                        {getAgeText(pet.age)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 text-xs">
                                        Gender:
                                      </span>
                                      <p className="font-medium capitalize">
                                        {pet.gender}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {pet.description}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                      Added:{" "}
                                      {new Date(
                                        pet.createdAt || ""
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(pet);
                                        }}
                                        title="Edit pet"
                                        className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      {pet.isArchived ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRestorePet(pet._id);
                                          }}
                                          disabled={isProcessing}
                                          title="Restore pet"
                                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              disabled={isProcessing}
                                              title="Archive pet"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <Archive className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Archive this pet?
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will remove the pet from
                                                public view but keep it in the
                                                system for records.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700"
                                                onClick={() =>
                                                  handleArchivePet(pet._id)
                                                }
                                              >
                                                Archive
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredPets.map((pet) => (
                              <Card
                                key={pet._id}
                                className={`cursor-pointer ${
                                  pet.isArchived ? "opacity-80" : ""
                                }`}
                                onClick={() => handleView(pet)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                      <img
                                        src={
                                          pet.images && pet.images.length > 0
                                            ? pet.images[0].url
                                            : "/placeholder-pet.jpg"
                                        }
                                        alt={pet.name}
                                        className="w-24 h-24 object-top rounded-md"
                                      />
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="font-semibold text-lg text-gray-900">
                                            {pet.name}
                                          </h3>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                              variant="outline"
                                              className={`capitalize ${getTypeColor(
                                                pet.type
                                              )} border`}
                                            >
                                              {pet.type}
                                            </Badge>
                                            <Badge
                                              className={`${getStatusColor(
                                                pet.adoptionStatus
                                              )} border`}
                                            >
                                              {pet.adoptionStatus
                                                .charAt(0)
                                                .toUpperCase() +
                                                pet.adoptionStatus.slice(1)}
                                            </Badge>
                                            {pet.isArchived && (
                                              <Badge
                                                variant="secondary"
                                                className="border"
                                              >
                                                Archived
                                              </Badge>
                                            )}
                                            {pet.videos &&
                                              pet.videos.length > 0 && (
                                                <div className="flex items-center text-gray-500">
                                                  <Video className="h-4 w-4 mr-1" />
                                                  <span className="text-xs">
                                                    {pet.videos.length}
                                                  </span>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEdit(pet);
                                            }}
                                            title="Edit pet"
                                            className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          {pet.isArchived ? (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRestorePet(pet._id);
                                              }}
                                              disabled={isProcessing}
                                              title="Restore pet"
                                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            >
                                              <RotateCcw className="h-4 w-4" />
                                            </Button>
                                          ) : (
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  disabled={isProcessing}
                                                  title="Archive pet"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <Archive className="h-4 w-4" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>
                                                    Archive this pet?
                                                  </AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    This will remove the pet
                                                    from public view but keep it
                                                    in the system for records.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>
                                                    Cancel
                                                  </AlertDialogCancel>
                                                  <AlertDialogAction
                                                    className="bg-red-600 hover:bg-red-700"
                                                    onClick={() =>
                                                      handleArchivePet(pet._id)
                                                    }
                                                  >
                                                    Archive
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          )}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                        <div>
                                          <span className="text-gray-500 text-xs">
                                            Breed:
                                          </span>
                                          <p className="font-medium">
                                            {pet.breed}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 text-xs">
                                            Age:
                                          </span>
                                          <p className="font-medium">
                                            {getAgeText(pet.age)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 text-xs">
                                            Gender:
                                          </span>
                                          <p className="font-medium capitalize">
                                            {pet.gender}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 text-xs">
                                            Added:
                                          </span>
                                          <p className="font-medium">
                                            {new Date(
                                              pet.createdAt || ""
                                            ).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                        {pet.description}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* View Pet Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-8">
                {/* Close Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full h-10 w-10 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 z-10"
                  onClick={() => setViewDialogOpen(false)}
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
                {/* Add DialogTitle for accessibility */}
                <DialogTitle className="sr-only">
                  {selectedPet ? `View Pet: ${selectedPet.name}` : "View Pet"}
                </DialogTitle>
                {selectedPet && (
                  <div className="w-full flex flex-col lg:flex-row gap-8 p-6 relative">
                    {/* Left: Image Gallery */}
                    <div className="flex-1 flex flex-col gap-6">
                      <Card className="rounded-xl shadow-lg overflow-hidden border-none">
                        <div className="relative aspect-square">
                          <img
                            src={
                              selectedPet.images &&
                              selectedPet.images.length > 0
                                ? selectedPet.images[currentImageIndex].url
                                : "/placeholder-pet.jpg"
                            }
                            alt={selectedPet.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedPet.images &&
                            selectedPet.images.length > 1 && (
                              <>
                                <button
                                  onClick={() =>
                                    setCurrentImageIndex((prev) =>
                                      prev === 0
                                        ? selectedPet.images.length - 1
                                        : prev - 1
                                    )
                                  }
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                                >
                                  <ChevronLeft size={24} />
                                </button>
                                <button
                                  onClick={() =>
                                    setCurrentImageIndex((prev) =>
                                      prev === selectedPet.images.length - 1
                                        ? 0
                                        : prev + 1
                                    )
                                  }
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                                >
                                  <ChevronRight size={24} />
                                </button>
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                  {selectedPet.images.map((_, index) => (
                                    <button
                                      key={index}
                                      onClick={() =>
                                        setCurrentImageIndex(index)
                                      }
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
                          <div className="absolute top-4 right-4">
                            <Badge
                              className={`${getStatusColor(
                                selectedPet.adoptionStatus
                              )} border text-sm`}
                            >
                              {selectedPet.adoptionStatus
                                .charAt(0)
                                .toUpperCase() +
                                selectedPet.adoptionStatus.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        {/* Image Thumbnails */}
                        {selectedPet.images &&
                          selectedPet.images.length > 1 && (
                            <div className="p-4 flex space-x-2 overflow-x-auto">
                              {selectedPet.images.map((img, index) => (
                                <img
                                  key={index}
                                  src={img.url}
                                  alt={`${selectedPet.name} ${index + 1}`}
                                  className={`w-16 h-16 object-cover rounded-md border cursor-pointer ${
                                    index === currentImageIndex
                                      ? "border-orange-500"
                                      : "border-transparent"
                                  }`}
                                  onClick={() => setCurrentImageIndex(index)}
                                />
                              ))}
                            </div>
                          )}
                      </Card>
                      {/* Videos */}
                      {selectedPet.videos && selectedPet.videos.length > 0 && (
                        <div className="space-y-4 mt-6">
                          {selectedPet.videos.map((video, idx) => (
                            <Card
                              key={idx}
                              className="border-none shadow-lg rounded-xl overflow-hidden"
                            >
                              <CardContent className="p-0">
                                <div className="relative aspect-video rounded-lg overflow-hidden group">
                                  <video
                                    src={video.url}
                                    controls
                                    className="w-full h-full object-cover"
                                    poster={
                                      selectedPet.images &&
                                      selectedPet.images.length > 0
                                        ? selectedPet.images[0].url
                                        : undefined
                                    }
                                  />
                                  <button
                                    className="absolute top-2 right-2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full transition-all group-hover:scale-110"
                                    onClick={() => {
                                      setVideoModalSrc(video.url);
                                      setVideoModalOpen(true);
                                    }}
                                    title="Enlarge video"
                                  >
                                    <Maximize2 size={20} />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Right: Pet Info */}
                    <div className="flex-1 flex flex-col gap-6">
                      <Card className="rounded-xl shadow-lg overflow-hidden border-none">
                        <CardContent className="p-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <h1 className="text-3xl font-bold text-gray-800">
                                {selectedPet.name}
                              </h1>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  selectedPet.adoptionStatus === "available"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {selectedPet.adoptionStatus === "available"
                                  ? "Available for Adoption"
                                  : "Not Available"}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <span className="text-sm">
                                {selectedPet.owner || "Animal Shelter, City"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 my-2">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {selectedPet.type}
                              </span>
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                {selectedPet.breed}
                              </span>
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                {selectedPet.gender}
                              </span>
                              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                                {getAgeText(selectedPet.age)}
                              </span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg mt-4">
                              <h2 className="text-xl font-semibold mb-2 text-gray-800">
                                About {selectedPet.name}
                              </h2>
                              <p className="text-gray-700 leading-relaxed">
                                {selectedPet.description}
                              </p>
                            </div>
                            <div className="flex items-center text-gray-500 text-sm">
                              <span>
                                Added:{" "}
                                {new Date(
                                  selectedPet.createdAt || ""
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => {
                                setViewDialogOpen(false);
                                handleEdit(selectedPet);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Video Enlarge Modal */}
            <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
              <DialogContent className="max-w-3xl">
                <DialogTitle className="sr-only">Enlarged Video</DialogTitle>
                {videoModalSrc && (
                  <div className="w-full">
                    <video
                      src={videoModalSrc}
                      controls
                      autoPlay
                      className="w-full h-[400px] object-contain rounded-xl"
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Modal for Add/Edit */}
            {modalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">
                      {editPet ? "Edit Pet" : "Add Pet"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Images Section */}
                    <div>
                      <Label
                        htmlFor="images"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Images
                      </Label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {form.imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="file"
                        id="images"
                        ref={imageInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                        multiple
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Images
                      </Button>
                    </div>
                    {/* Videos Section */}
                    <div>
                      <Label
                        htmlFor="videos"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Videos
                      </Label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {form.videoPreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <video
                              src={preview}
                              className="w-16 h-16 object-cover rounded-md border"
                              controls
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="file"
                        id="videos"
                        ref={videoInputRef}
                        onChange={handleVideoChange}
                        accept="video/*"
                        className="hidden"
                        multiple
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Videos
                      </Button>
                    </div>
                    {/* Pet Info Fields */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Pet name"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={form.type}
                          onValueChange={(value) =>
                            setForm({ ...form, type: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">Dog</SelectItem>
                            <SelectItem value="cat">Cat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="breed">Breed</Label>
                        <Input
                          id="breed"
                          placeholder="Breed"
                          value={form.breed}
                          onChange={(e) =>
                            setForm({ ...form, breed: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="age">Age Category</Label>
                        <Select
                          value={form.age}
                          onValueChange={(value) =>
                            setForm({ ...form, age: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select age category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kitten">
                              Kitten (&lt; 1 year)
                            </SelectItem>
                            <SelectItem value="young adult">
                              Young Adult (1-3 years)
                            </SelectItem>
                            <SelectItem value="mature adult">
                              Mature Adult (4-7 years)
                            </SelectItem>
                            <SelectItem value="adult">
                              Adult (8+ years)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={form.gender}
                          onValueChange={(value) =>
                            setForm({ ...form, gender: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Description"
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Adoption Status</Label>
                        <Select
                          value={form.adoptionStatus}
                          onValueChange={(value) =>
                            setForm({ ...form, adoptionStatus: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="adopted">Adopted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 justify-end mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={isProcessing}
                      >
                        {isProcessing
                          ? "Saving..."
                          : editPet
                          ? "Save Changes"
                          : "Add Pet"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          {/* Add closing div for the opening div at line 401 */}
        </div>
      </AdminAuthWrapper>
      {/* Toast container (if not already in _app.tsx) */}
      {/* <ToastContainer /> */}
    </>
  );
}
