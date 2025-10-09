"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Plus,
  X,
  Archive,
  RotateCcw,
  Mail,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-toastify";

interface Adoption {
  profilePicture?: string;
  _id: string;
  adopterName: string;
  adopterEmail: string;
  petName: string;
  petImage?: string;
  status: string;
  createdAt: string;
  fullname?: string;
  email?: string;
  phone?: string;
  address?: string;
  message?: string;
  adminMessage?: string;
  user?: {
    _id: string;
    fullname: string;
    email: string;
    profilePicture?: string;
  };
  pet?: {
    _id: string;
    name?: string;
    breed?: string;
    type?: string;
    age?: string;
    gender?: string;
    images?: Array<{ url: string } | string>;
    [key: string]: any;
  };
  isArchived?: boolean;
}

export default function AdminAdoptionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Modal state for View
  const [viewAdoption, setViewAdoption] = useState<Adoption | null>(null);
  const [viewUser, setViewUser] = useState<{
    fullname: string;
    email: string;
    profilePicture?: string;
  } | null>(null);
  const [viewPet, setViewPet] = useState<any>(null);

  // Modal state for Approve/Reject
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAdoption, setSelectedAdoption] = useState<Adoption | null>(
    null
  );
  const [adminMessage, setAdminMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchAdoptions();
  }, []);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (viewAdoption || approveModalOpen || rejectModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [viewAdoption, approveModalOpen, rejectModalOpen]);

  const fetchAdoptions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const response = await axiosInstance.get(
        `${BASE_URL}/api/admin/adoptions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );

      if (response.data.success) {
        setAdoptions(response.data.adoptions);
      }
    } catch (error) {
      console.error("Error fetching adoptions:", error);
      toast.error("Failed to fetch adoptions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    adoptionId: string,
    status: string,
    message?: string
  ) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");

      // ✅ FIX: Add timeout configuration
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/admin/adoptions/${adoptionId}/status`,
        {
          status,
          adminMessage: message || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        setAdoptions(
          adoptions.map((adoption) =>
            adoption._id === adoptionId
              ? { ...adoption, status, adminMessage: message || "" }
              : adoption
          )
        );

        toast.success(`Adoption request ${status.toLowerCase()} successfully`);

        // Close modals
        setApproveModalOpen(false);
        setRejectModalOpen(false);
        setAdminMessage("");
        setRejectReason("");
        setSelectedAdoption(null);
      }
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} adoption:`, error);

      // ✅ FIX: Better error handling
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "ECONNABORTED"
      ) {
        toast.error("Request timeout - please try again");
      } else {
        toast.error(`Failed to ${status.toLowerCase()} adoption request`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveAdoption = async (adoptionId: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/admin/adoptions/${adoptionId}/archive`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAdoptions(
          adoptions.map((adoption) =>
            adoption._id === adoptionId
              ? { ...adoption, isArchived: true }
              : adoption
          )
        );
        toast.success("Adoption request archived successfully");
      }
    } catch (error) {
      console.error("Error archiving adoption:", error);
      toast.error("Failed to archive adoption request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreAdoption = async (adoptionId: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/admin/adoptions/${adoptionId}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAdoptions(
          adoptions.map((adoption) =>
            adoption._id === adoptionId
              ? { ...adoption, isArchived: false }
              : adoption
          )
        );
        toast.success("Adoption request restored successfully");
      }
    } catch (error) {
      console.error("Error restoring adoption:", error);
      toast.error("Failed to restore adoption request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAdoption = async (adoptionId: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.delete(
        `${BASE_URL}/api/admin/adoptions/${adoptionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAdoptions(adoptions.filter((a) => a._id !== adoptionId));
        toast.success("Adoption request deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting adoption:", error);
      toast.error("Failed to delete adoption request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch pet details for modal (reference: adoption admin page)
  const fetchPetDetails = async (petId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(
        `${BASE_URL}/api/pets/${petId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success && response.data.pet) {
        setViewPet(response.data.pet);
      }
    } catch (error) {
      setViewPet(null);
    }
  };

  // Helper function to get profile picture URL
  const getProfilePictureUrl = (
    profilePicture: string | undefined | null
  ): string => {
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
    return `${BASE_URL}${
      profilePicture.startsWith("/") ? "" : "/"
    }${profilePicture}`;
  };

  // Helper function to get pet image URL
  const getPetImageUrl = (pet: any, adoption: Adoption): string => {
    if (pet?.images && pet.images.length > 0) {
      const firstImage = pet.images[0];
      return typeof firstImage === "object" && firstImage.url
        ? firstImage.url
        : typeof firstImage === "string"
        ? firstImage
        : "/placeholder-pet.jpg";
    }
    return adoption.petImage || "/placeholder-pet.jpg";
  };

  // Filter adoptions based on active tab and search query
  const filteredAdoptions = adoptions.filter((adoption) => {
    const matchesTab =
      activeTab === "active" ? !adoption.isArchived : adoption.isArchived;
    const matchesSearch = searchQuery
      ? (
          adoption.user?.fullname ||
          adoption.fullname ||
          adoption.adopterName ||
          ""
        )
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (adoption.user?.email || adoption.email || adoption.adopterEmail || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (adoption.pet?.name || adoption.petName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        adoption.status.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6 px-0">
          <Card className="rounded-xl sm:rounded-2xl shadow-sm bg-white px-0 py-0 border-0">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-[#0a1629]">
                      Adoption Management
                    </div>
                    <div className="text-gray-500 text-sm sm:text-base mt-1">
                      <span className="font-semibold text-[#0a1629]">
                        {adoptions.length} total
                      </span>
                      , manage all adoption requests
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 sm:gap-4">
                    <Button
                      variant="outline"
                      onClick={fetchAdoptions}
                      disabled={isLoading}
                      className="flex items-center gap-2 text-sm"
                      size="sm"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Tabs and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <TabsList className="inline-flex p-1 bg-gray-100 rounded-lg w-full sm:w-auto">
                        <TabsTrigger
                          value="active"
                          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none"
                        >
                          Active
                        </TabsTrigger>
                        <TabsTrigger
                          value="archived"
                          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none"
                        >
                          Archive
                        </TabsTrigger>
                      </TabsList>

                      <div className="relative w-full sm:w-64">
                        <Input
                          type="text"
                          placeholder="Search adoptions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 text-sm"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search className="w-5 h-5 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </Tabs>
                </div>

                {/* Table */}
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader />
                  </div>
                ) : (
                  <div
                    className="overflow-x-auto -mx-4 sm:mx-0"
                    style={{ maxHeight: "60vh", overflowY: "auto" }}
                  >
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pet</TableHead>
                          <TableHead>Adopter</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdoptions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-10 text-gray-500"
                            >
                              No adoption requests found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAdoptions.map((adoption) => {
                            const adopterProfilePicture =
                              typeof adoption.user?.profilePicture ===
                                "string" &&
                              adoption.user.profilePicture.trim() !== ""
                                ? adoption.user.profilePicture
                                : typeof adoption.profilePicture === "string" &&
                                  adoption.profilePicture.trim() !== ""
                                ? adoption.profilePicture
                                : "/placeholder-user.png";

                            // Add gray background for archived rows
                            const rowClass = adoption.isArchived
                              ? "bg-gray-50 text-gray-400"
                              : "";

                            return (
                              <TableRow
                                key={adoption._id}
                                className={`hover:bg-gray-100 transition cursor-pointer ${rowClass}`}
                                onClick={async () => {
                                  setViewAdoption(adoption);
                                  if (adoption.pet?._id) {
                                    await fetchPetDetails(adoption.pet._id);
                                  } else {
                                    setViewPet(null);
                                  }
                                }}
                              >
                                {/* Pet column */}
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage
                                        src={getPetImageUrl(
                                          adoption.pet,
                                          adoption
                                        )}
                                        alt={
                                          adoption.pet?.name ||
                                          adoption.petName ||
                                          "Pet"
                                        }
                                      />
                                      <AvatarFallback>
                                        {(
                                          adoption.pet?.name ||
                                          adoption.petName ||
                                          "P"
                                        )
                                          ?.charAt(0)
                                          ?.toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-[#0a1629]">
                                      {adoption.pet?.name || adoption.petName}
                                    </span>
                                  </div>
                                </TableCell>
                                {/* Adopter column */}
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={getProfilePictureUrl(
                                          adopterProfilePicture
                                        )}
                                        alt={
                                          adoption.user?.fullname ||
                                          adoption.fullname ||
                                          adoption.adopterName ||
                                          "Unknown User"
                                        }
                                      />
                                      <AvatarFallback>
                                        {
                                          (adoption.user?.fullname ||
                                            adoption.fullname ||
                                            adoption.adopterName ||
                                            "U")[0]
                                        }
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-[#0a1629]">
                                        {adoption.user?.fullname ||
                                          adoption.fullname ||
                                          adoption.adopterName ||
                                          "Unknown User"}
                                      </div>
                                      {adoption.user && (
                                        <div className="text-xs text-gray-500">
                                          User ID: {adoption.user._id}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                {/* Email column */}
                                <TableCell className="text-gray-700 text-sm">
                                  {adoption.user?.email ||
                                    adoption.email ||
                                    adoption.adopterEmail}
                                </TableCell>
                                {/* Status column */}
                                <TableCell>
                                  <Badge
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                      adoption.status
                                    )}`}
                                  >
                                    {adoption.status
                                      ? adoption.status
                                          .charAt(0)
                                          .toUpperCase() +
                                        adoption.status.slice(1).toLowerCase()
                                      : "Unknown"}
                                  </Badge>
                                </TableCell>
                                {/* Date column */}
                                <TableCell className="text-gray-700 text-sm">
                                  {new Date(
                                    adoption.createdAt
                                  ).toLocaleDateString()}
                                </TableCell>
                                {/* Actions column */}
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {!adoption.isArchived ? (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            disabled={isProcessing}
                                            title="Archive adoption"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Archive className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Archive this adoption request?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will move the adoption
                                              request to archive. You can
                                              restore it later.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-red-500 hover:bg-red-600"
                                              onClick={() =>
                                                handleArchiveAdoption(
                                                  adoption._id
                                                )
                                              }
                                            >
                                              Archive
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRestoreAdoption(adoption._id);
                                        }}
                                        disabled={isProcessing}
                                        title="Restore adoption"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      >
                                        <RotateCcw className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adoption View Modal */}
          {viewAdoption && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-2 border-b">
                  <h3 className="font-bold text-2xl text-[#0a1629]">
                    Adoption Application Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-10 w-10 text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => {
                      setViewAdoption(null);
                      setViewUser(null);
                      setViewPet(null);
                    }}
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {/* Content */}
                <div className="flex flex-col md:flex-row gap-8 px-8 py-8">
                  {/* Adopter Info */}
                  <div className="flex-1 flex flex-col items-center gap-4 bg-gray-50 rounded-xl p-6 shadow-sm">
                    <Avatar className="h-24 w-24 border-4 border-orange-200 shadow">
                      <AvatarImage
                        src={getProfilePictureUrl(
                          viewUser?.profilePicture ||
                            viewAdoption.user?.profilePicture ||
                            viewAdoption.profilePicture
                        )}
                        alt={
                          viewUser?.fullname ||
                          viewAdoption.user?.fullname ||
                          viewAdoption.fullname ||
                          viewAdoption.adopterName ||
                          "Unknown User"
                        }
                      />
                      <AvatarFallback>
                        {
                          (viewUser?.fullname ||
                            viewAdoption.user?.fullname ||
                            viewAdoption.fullname ||
                            viewAdoption.adopterName ||
                            "U")[0]
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Adopter</div>
                      <div className="font-semibold text-lg">
                        {viewUser?.fullname ||
                          viewAdoption.user?.fullname ||
                          viewAdoption.fullname ||
                          viewAdoption.adopterName ||
                          "Unknown User"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {viewUser?.email ||
                          viewAdoption.user?.email ||
                          viewAdoption.email ||
                          viewAdoption.adopterEmail}
                      </div>
                      {viewAdoption.phone && (
                        <div className="text-xs text-gray-400 mt-1">
                          Phone: {viewAdoption.phone}
                        </div>
                      )}
                      {viewAdoption.address && (
                        <div className="text-xs text-gray-400">
                          Address: {viewAdoption.address}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Pet Info */}
                  <div className="flex-1 flex flex-col items-center gap-4 bg-gray-50 rounded-xl p-6 shadow-sm">
                    <Avatar className="h-24 w-24 border-4 border-blue-200 shadow">
                      <AvatarImage
                        src={
                          viewPet?.images &&
                          viewPet.images.length > 0 &&
                          typeof viewPet.images[0] === "object"
                            ? viewPet.images[0].url
                            : typeof viewPet?.images?.[0] === "string"
                            ? viewPet.images[0]
                            : viewAdoption.pet?.images &&
                              viewAdoption.pet.images.length > 0 &&
                              typeof viewAdoption.pet.images[0] === "object"
                            ? viewAdoption.pet.images[0].url
                            : typeof viewAdoption.pet?.images?.[0] === "string"
                            ? viewAdoption.pet.images[0]
                            : viewAdoption.petImage || "/placeholder-pet.jpg"
                        }
                        alt={
                          viewPet?.name ||
                          viewAdoption.pet?.name ||
                          viewAdoption.petName ||
                          "Pet"
                        }
                      />
                      <AvatarFallback>
                        {
                          (viewPet?.name ||
                            viewAdoption.pet?.name ||
                            viewAdoption.petName ||
                            "P")[0]
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Pet</div>
                      <div className="font-semibold text-lg">
                        {viewPet?.name ||
                          viewAdoption.pet?.name ||
                          viewAdoption.petName ||
                          "Unknown Pet"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {viewPet?.breed ||
                          viewAdoption.pet?.breed ||
                          "Breed: Unknown"}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {viewPet?.type ||
                            viewAdoption.pet?.type ||
                            "Type: Unknown"}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                          Gender:{" "}
                          {viewPet?.gender ||
                            viewAdoption.pet?.gender ||
                            "Unknown"}
                        </span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">
                          Age:{" "}
                          {viewPet?.age || viewAdoption.pet?.age || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Message Sections */}
                <div className="px-8 pb-8">
                  <div className="mb-6">
                    <h4 className="font-semibold text-base mb-2 text-[#0a1629]">
                      Message from Adopter
                    </h4>
                    <div className="bg-gray-100 rounded p-3 text-gray-700 min-h-[48px]">
                      {viewAdoption.message || "-"}
                    </div>
                  </div>
                  {viewAdoption.adminMessage && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-base mb-2 text-[#0a1629]">
                        Admin Message
                      </h4>
                      <div className="bg-blue-50 rounded p-3 text-gray-700 min-h-[48px]">
                        {viewAdoption.adminMessage}
                      </div>
                    </div>
                  )}
                  {/* Approve/Reject buttons if pending and not archived */}
                  {viewAdoption.status?.toLowerCase() === "pending" &&
                    !viewAdoption.isArchived && (
                      <div className="flex gap-3 justify-center mt-6">
                        <Button
                          className="bg-green-500 hover:bg-green-600 text-white min-w-[120px]"
                          onClick={() => {
                            setSelectedAdoption(viewAdoption);
                            setApproveModalOpen(true);
                            setViewAdoption(null);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          className="bg-red-500 hover:bg-red-600 text-white min-w-[120px]"
                          onClick={() => {
                            setSelectedAdoption(viewAdoption);
                            setRejectModalOpen(true);
                            setViewAdoption(null);
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Approve Modal */}
          {approveModalOpen && selectedAdoption && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4 text-[#0a1629]">
                  Approve Adoption Request
                </h3>
                <p className="text-gray-600 mb-4">
                  Approve adoption request for{" "}
                  <strong>
                    {selectedAdoption.pet?.name || selectedAdoption.petName}
                  </strong>{" "}
                  by{" "}
                  <strong>
                    {selectedAdoption.user?.fullname ||
                      selectedAdoption.fullname ||
                      selectedAdoption.adopterName}
                  </strong>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Message (Optional)
                  </label>
                  <Textarea
                    placeholder="Enter a message to the adopter..."
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setApproveModalOpen(false);
                      setSelectedAdoption(null);
                      setAdminMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedAdoption._id,
                        "Approved",
                        adminMessage
                      )
                    }
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Approving..." : "Approve"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {rejectModalOpen && selectedAdoption && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4 text-[#0a1629]">
                  Reject Adoption Request
                </h3>
                <p className="text-gray-600 mb-4">
                  Reject adoption request for{" "}
                  <strong>
                    {selectedAdoption.pet?.name || selectedAdoption.petName}
                  </strong>{" "}
                  by{" "}
                  <strong>
                    {selectedAdoption.user?.fullname ||
                      selectedAdoption.fullname ||
                      selectedAdoption.adopterName}
                  </strong>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection (Required)
                  </label>
                  <Textarea
                    placeholder="Enter the reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRejectModalOpen(false);
                      setSelectedAdoption(null);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedAdoption._id,
                        "Rejected",
                        rejectReason
                      )
                    }
                    disabled={isProcessing || !rejectReason.trim()}
                  >
                    {isProcessing ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
