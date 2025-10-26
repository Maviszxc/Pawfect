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
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  ChevronDown,
  FileText,
  ExternalLink,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  adoptionFormUrl?: string;
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
  const [activeTab, setActiveTab] = useState("all");

  // Modal state for View
  const [viewAdoption, setViewAdoption] = useState<Adoption | null>(null);
  const [viewUser, setViewUser] = useState<{
    fullname: string;
    email: string;
    profilePicture?: string;
  } | null>(null);
  const [viewPet, setViewPet] = useState<any>(null);

  // Modal state for Status Update
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAdoption, setSelectedAdoption] = useState<Adoption | null>(
    null
  );
  const [newStatus, setNewStatus] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  useEffect(() => {
    fetchAdoptions();
  }, []);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (viewAdoption || statusModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [viewAdoption, statusModalOpen]);

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

  // Enhanced status update function
  const handleUpdateStatus = async () => {
    if (!selectedAdoption || !newStatus) return;

    // For rejected or denied status, require admin message
    if ((newStatus === "Rejected" || newStatus === "Denied") && !adminMessage.trim()) {
      toast.error(
        "Admin message is required when rejecting or denying an adoption request"
      );
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("accessToken");

      const response = await axiosInstance.patch(
        `${BASE_URL}/api/adoptions/${selectedAdoption._id}/status`,
        {
          status: newStatus,
          adminMessage: adminMessage.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );

      if (response.data.success) {
        setAdoptions(
          adoptions.map((adoption) =>
            adoption._id === selectedAdoption._id
              ? {
                  ...adoption,
                  status: newStatus,
                  adminMessage: adminMessage.trim(),
                }
              : adoption
          )
        );

        toast.success(
          `Adoption request ${newStatus.toLowerCase()} successfully${
            newStatus === "Approved" || newStatus === "Rejected" || newStatus === "Denied"
              ? " and email sent to adopter"
              : ""
          }`
        );

        // Close modal and reset state
        setStatusModalOpen(false);
        setSelectedAdoption(null);
        setNewStatus("");
        setAdminMessage("");
      }
    } catch (error: any) {
      console.error(`Error updating adoption status:`, error);
      toast.error(
        error.response?.data?.message ||
          `Failed to update adoption request to ${newStatus}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Open status update modal
  const openStatusModal = (adoption: Adoption, status: string = "") => {
    setSelectedAdoption(adoption);
    setNewStatus(status || adoption.status);

    // Set default message based on status
    if (status === "Approved") {
      setAdminMessage(
        "Congratulations! Your adoption request has been approved. We will contact you shortly to arrange the next steps."
      );
    } else if (status === "Rejected") {
      setAdminMessage(
        "After careful consideration, we regret to inform you that your adoption request has not been approved at this time."
      );
    } else if (status === "Denied") {
      setAdminMessage(
        "We regret to inform you that your approved adoption request has been denied. Please contact us for more information."
      );
    } else if (status === "Returned") {
      setAdminMessage(
        "The pet has been returned and is now available for adoption again. Thank you for your understanding."
      );
    } else {
      setAdminMessage(adoption.adminMessage || "");
    }

    setStatusModalOpen(true);
  };


  // Hard delete adoption (permanent)
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
        toast.success("Adoption request deleted permanently");
      }
    } catch (error) {
      console.error("Error deleting adoption:", error);
      toast.error("Failed to delete adoption request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch pet details for modal
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
    // Exclude archived adoptions completely
    if (adoption.isArchived) {
      return false;
    }

    // Filter by status tab
    const matchesTab =
      activeTab === "all"
        ? true
        : adoption.status.toLowerCase().replace(/\s+/g, "-") === activeTab.toLowerCase();

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
    const statusLower = status.toLowerCase();
    if (statusLower.includes("approved") || statusLower.includes("progress")) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (statusLower.includes("pending") || statusLower.includes("review")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (statusLower.includes("rejected") || statusLower.includes("denied")) {
      return "bg-red-100 text-red-800 border-red-200";
    } else if (statusLower.includes("completed")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("approved") || statusLower.includes("progress") || statusLower.includes("completed")) {
      return <CheckCircle className="h-4 w-4" />;
    } else if (statusLower.includes("pending") || statusLower.includes("review")) {
      return <Clock className="h-4 w-4" />;
    } else if (statusLower.includes("rejected") || statusLower.includes("denied")) {
      return <XCircle className="h-4 w-4" />;
    }
    return null;
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <TabsList className="inline-flex h-auto items-center gap-6 bg-transparent border-b border-gray-200 w-full sm:w-auto">
                        <TabsTrigger
                          value="all"
                          className="relative bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=active]:text-orange-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 rounded-none"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="under-review"
                          className="relative bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=active]:text-orange-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 rounded-none"
                        >
                          Under Review
                        </TabsTrigger>
                        <TabsTrigger
                          value="approved"
                          className="relative bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=active]:text-orange-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 rounded-none"
                        >
                          Approved
                        </TabsTrigger>
                        <TabsTrigger
                          value="rejected"
                          className="relative bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=active]:text-orange-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 rounded-none"
                        >
                          Rejected
                        </TabsTrigger>
                        <TabsTrigger
                          value="denied"
                          className="relative bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=active]:text-orange-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 rounded-none"
                        >
                          Denied
                        </TabsTrigger>
                        <TabsTrigger
                          value="completed"
                          className="relative bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=active]:text-orange-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 rounded-none"
                        >
                          Completed
                        </TabsTrigger>
                        <TabsTrigger
                          value="returned"
                          className="relative bg-transparent px-1 pb-3 pt-0 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 data-[state=active]:text-orange-500 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 rounded-none"
                        >
                          Returned
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                          <Input
                            type="text"
                            placeholder="Search adoptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 text-sm"
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-gray-500" />
                          </div>
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
                    <table className="w-full mt-4 text-left min-w-[800px]">
                      <thead>
                        <tr className="text-gray-500 text-xs sm:text-sm">
                          <th className="py-2 font-medium pl-4 sm:pl-0">Pet</th>
                          <th className="py-2 font-medium">Adopter</th>
                          <th className="py-2 font-medium">Email</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium">Date</th>
                          <th className="py-2 font-medium pr-4 sm:pr-0">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdoptions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-10 text-gray-500"
                            >
                              No adoption requests found
                            </td>
                          </tr>
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


                            return (
                              <tr
                                key={adoption._id}
                                className="border-t border-gray-100 hover:bg-gray-50 transition cursor-pointer"
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
                                <td className="py-3 pl-4 sm:pl-0">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
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
                                    <span className="font-medium text-gray-900 text-sm">
                                      {adoption.pet?.name || adoption.petName}
                                    </span>
                                  </div>
                                </td>
                                {/* Adopter column */}
                                <td className="py-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
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
                                    <div className="min-w-0">
                                      <p className="font-medium text-gray-900 text-sm truncate">
                                        {adoption.user?.fullname ||
                                          adoption.fullname ||
                                          adoption.adopterName ||
                                          "Unknown User"}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        Applied {new Date(adoption.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                {/* Email column */}
                                <td className="py-3 text-gray-700 text-xs sm:text-sm">
                                  {adoption.user?.email ||
                                    adoption.email ||
                                    adoption.adopterEmail}
                                </td>
                                {/* Status column */}
                                <td className="py-3">
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
                                </td>
                                {/* Date column */}
                                <td className="py-3 text-gray-700 text-xs sm:text-sm">
                                  {new Date(
                                    adoption.createdAt
                                  ).toLocaleDateString()}
                                </td>
                                {/* Actions column */}
                                <td className="py-3 pr-4 sm:pr-0">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      disabled={isProcessing}
                                      title="Update status"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openStatusModal(adoption);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


        {/* Adoption View Modal - Minimal Design */}
        {viewAdoption && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Adoption Application Details
                </h3>
                <button
                  onClick={() => {
                    setViewAdoption(null);
                    setViewUser(null);
                    setViewPet(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content - Two Column Layout */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                  {/* Left Side - Application Info */}
                  <div className="p-8 space-y-8 border-r border-gray-200">
                    {/* Adopter Section */}
                    <div>
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-16 w-16 ring-2 ring-gray-200">
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
                          <AvatarFallback className="bg-orange-100 text-orange-600">
                            {
                              (viewUser?.fullname ||
                                viewAdoption.user?.fullname ||
                                viewAdoption.fullname ||
                                viewAdoption.adopterName ||
                                "U")[0]
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Adopter</p>
                          <h4 className="font-semibold text-gray-900">
                            {viewUser?.fullname ||
                              viewAdoption.user?.fullname ||
                              viewAdoption.fullname ||
                              viewAdoption.adopterName ||
                              "Unknown User"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {viewUser?.email ||
                              viewAdoption.user?.email ||
                              viewAdoption.email ||
                              viewAdoption.adopterEmail}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        {viewAdoption.phone && (
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500">Phone</span>
                            <span className="text-gray-900 font-medium">
                              {viewAdoption.phone}
                            </span>
                          </div>
                        )}
                        {viewAdoption.address && (
                          <div className="py-2">
                            <div className="text-gray-500 mb-2">Address</div>
                            <div className="text-gray-900 text-sm leading-relaxed">
                              {viewAdoption.address}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Pet Section */}
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16 ring-2 ring-gray-200">
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
                                  typeof viewAdoption.pet.images[0] ===
                                    "object"
                                ? viewAdoption.pet.images[0].url
                                : typeof viewAdoption.pet?.images?.[0] ===
                                  "string"
                                ? viewAdoption.pet.images[0]
                                : viewAdoption.petImage ||
                                  "/placeholder-pet.jpg"
                            }
                            alt={
                              viewPet?.name ||
                              viewAdoption.pet?.name ||
                              viewAdoption.petName ||
                              "Pet"
                            }
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {
                              (viewPet?.name ||
                                viewAdoption.pet?.name ||
                                viewAdoption.petName ||
                                "P")[0]
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Pet</p>
                          <h4 className="font-semibold text-gray-900">
                            {viewPet?.name ||
                              viewAdoption.pet?.name ||
                              viewAdoption.petName ||
                              "Unknown Pet"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {viewPet?.breed ||
                              viewAdoption.pet?.breed ||
                              "Unknown Breed"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {viewPet?.type ||
                            viewAdoption.pet?.type ||
                            "Unknown"}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {viewPet?.gender ||
                            viewAdoption.pet?.gender ||
                            "Unknown"}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {viewPet?.age || viewAdoption.pet?.age || "Unknown"} old
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Messages Section */}
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">
                          Message from Adopter
                        </h5>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {viewAdoption.message || "No message provided"}
                        </p>
                      </div>

                      {viewAdoption.adminMessage && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">
                            Admin Response
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {viewAdoption.adminMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Update Status Button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => openStatusModal(viewAdoption)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Update Status
                      </Button>
                    </div>
                  </div>

                  {/* Right Side - PDF Viewer */}
                  <div className="bg-gray-50 p-6 flex flex-col">
                    {viewAdoption.adoptionFormUrl ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              Adoption Form (PDF)
                            </span>
                          </div>
                          <a
                            href={viewAdoption.adoptionFormUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                          >
                            Open Full
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        <div className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <iframe
                            src={`${viewAdoption.adoptionFormUrl}#view=FitH`}
                            className="w-full h-full"
                            title="Adoption Form PDF"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <FileText className="w-16 h-16 mx-auto mb-3 opacity-40" />
                          <p className="text-sm">No PDF form uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Status Update Modal */}
          {statusModalOpen && selectedAdoption && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h3 className="font-bold text-lg text-[#0a1629]">
                    Update Adoption Status
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-100"
                    onClick={() => {
                      setStatusModalOpen(false);
                      setSelectedAdoption(null);
                      setNewStatus("");
                      setAdminMessage("");
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="text-sm text-gray-600">
                    Updating status for{" "}
                    <strong>
                      {selectedAdoption.pet?.name || selectedAdoption.petName}
                    </strong>{" "}
                    by{" "}
                    <strong>
                      {selectedAdoption.user?.fullname ||
                        selectedAdoption.fullname ||
                        selectedAdoption.adopterName}
                    </strong>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show only valid status transitions based on current status */}
                        {selectedAdoption?.status === "Under Review" && (
                          <>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </>
                        )}
                        {selectedAdoption?.status === "Approved" && (
                          <>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Denied">Denied</SelectItem>
                          </>
                        )}
                        {selectedAdoption?.status === "Completed" && (
                          <>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Returned">Returned</SelectItem>
                          </>
                        )}
                        {(selectedAdoption?.status === "Rejected" || 
                          selectedAdoption?.status === "Denied" ||
                          selectedAdoption?.status === "Returned") && (
                          <SelectItem value={selectedAdoption.status}>{selectedAdoption.status}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Message {(newStatus === "Rejected" || newStatus === "Denied") && "(Required)"}
                    </label>
                    <Textarea
                      placeholder={
                        newStatus === "Approved"
                          ? "Congratulations! Your adoption request has been approved..."
                          : newStatus === "Rejected"
                          ? "After careful consideration, we regret to inform you..."
                          : newStatus === "Denied"
                          ? "We regret to inform you that your approved adoption request has been denied..."
                          : newStatus === "Returned"
                          ? "The pet has been returned and is now available for adoption again..."
                          : "Add any additional message for the adopter..."
                      }
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      className="w-full min-h-[100px] resize-vertical"
                      required={newStatus === "Rejected" || newStatus === "Denied"}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusModalOpen(false);
                      setSelectedAdoption(null);
                      setNewStatus("");
                      setAdminMessage("");
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={
                      isProcessing ||
                      ((newStatus === "Rejected" || newStatus === "Denied") && !adminMessage.trim())
                    }
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Update Status
                  </Button>
                </div>
              </div>
            </div>
          )}
    </AdminAuthWrapper>
  );
}
