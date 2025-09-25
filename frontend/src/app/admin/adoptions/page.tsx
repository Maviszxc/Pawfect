"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { Search, RefreshCw, Pencil, Trash2, Plus, X } from "lucide-react";
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
}

export default function AdminAdoptionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal state for Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editAdoption, setEditAdoption] = useState<Adoption | null>(null);
  const [form, setForm] = useState({
    adopterName: "",
    adopterEmail: "",
    petName: "",
    status: "",
  });

  const [currentUser, setCurrentUser] = useState<{
    fullname: string;
    email: string;
    profilePicture?: string;
  } | null>(null);

  // Modal state for View
  const [viewAdoption, setViewAdoption] = useState<Adoption | null>(null);
  const [viewUser, setViewUser] = useState<{
    fullname: string;
    email: string;
    profilePicture?: string;
  } | null>(null);
  const [viewPet, setViewPet] = useState<any>(null);

  useEffect(() => {
    fetchAdoptions();
    fetchCurrentUser();
  }, []);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (modalOpen || viewAdoption) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, viewAdoption]);

  const fetchAdoptions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");
      // Fetch adoptions with user details populated
      const response = await axiosInstance.get(
        `${BASE_URL}/api/admin/adoptions?populate=user`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await axiosInstance.get(
        `${BASE_URL}/api/users/current-user`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success && response.data.user) {
        setCurrentUser({
          fullname: response.data.user.fullname,
          email: response.data.user.email,
          profilePicture: response.data.user.profilePicture || "",
        });
      }
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const handleDeleteAdoption = async (adoptionId: string) => {
    setIsDeleting(true);
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
      }
    } catch (error) {
      console.error("Error deleting adoption:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (adoption: Adoption) => {
    setEditAdoption(adoption);
    setForm({
      adopterName: adoption.adopterName,
      adopterEmail: adoption.adopterEmail,
      petName: adoption.petName,
      status: adoption.status,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditAdoption(null);
    setForm({ adopterName: "", adopterEmail: "", petName: "", status: "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      if (editAdoption) {
        await axiosInstance.put(
          `${BASE_URL}/api/admin/adoptions/${editAdoption._id}`,
          form,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axiosInstance.post(`${BASE_URL}/api/admin/adoptions`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setModalOpen(false);
      fetchAdoptions();
    } catch (error) {
      alert("Failed to save adoption.");
    }
  };

  // Helper function to get profile picture URL (handles base64 and URL)
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
    // If it's a base64 image, return as is
    if (profilePicture.startsWith("data:image")) {
      return profilePicture;
    }
    // If it's a URL (http, https, //), return as is
    if (profilePicture.startsWith("http") || profilePicture.startsWith("//")) {
      return profilePicture;
    }
    // Otherwise, treat as relative path from uploads
    return `${BASE_URL}${
      profilePicture.startsWith("/") ? "" : "/"
    }${profilePicture}`;
  };

  const filteredAdoptions = searchQuery
    ? adoptions.filter(
        (a) =>
          a.adopterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.adopterEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.user?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : adoptions;

  // Fetch user profile for the adoption view modal
  const fetchUserProfile = async (userId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(
        `${BASE_URL}/api/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success && response.data.user) {
        setViewUser({
          fullname: response.data.user.fullname,
          email: response.data.user.email,
          profilePicture: response.data.user.profilePicture || "",
        });
      }
    } catch (error) {
      setViewUser(null);
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

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-[#f8fafc] pb-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
          {/* Display current admin profile at the top right */}
          <div className="flex justify-end mb-2">
            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#0a1629]">
                  {currentUser.fullname}
                </span>
              </div>
            )}
          </div>

          <Card className="rounded-2xl shadow bg-white px-0 py-0">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0a1629]">
                      Adoption Management
                    </div>
                    <div className="text-gray-500 text-base mt-1">
                      <span className="font-semibold text-[#0a1629]">
                        {adoptions.length} total
                      </span>
                      , manage all adoption requests
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Button
                      variant="outline"
                      onClick={fetchAdoptions}
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
                      <Plus className="h-4 w-4 mr-2" /> Add Adoption
                    </Button>
                  </div>
                </div>

                {/* Search and filter */}
                <div className="flex justify-between items-center">
                  <div className="relative w-full max-w-sm">
                    <Input
                      type="text"
                      placeholder="Search adoptions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {filteredAdoptions.length} adoptions
                  </Badge>
                </div>

                {/* Table */}
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader />
                  </div>
                ) : (
                  <div
                    className="overflow-x-auto"
                    style={{ maxHeight: "60vh", overflowY: "auto" }}
                  >
                    <Table>
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
                            // Get adopter profile picture (prefer user.profilePicture, fallback to adoption.profilePicture)
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
                              <TableRow
                                key={adoption._id}
                                className="hover:bg-gray-50 transition cursor-pointer"
                                onClick={async () => {
                                  setViewAdoption(adoption);
                                  if (adoption.user?._id) {
                                    await fetchUserProfile(adoption.user._id);
                                  } else {
                                    setViewUser(null);
                                  }
                                  if (adoption.pet?._id) {
                                    await fetchPetDetails(adoption.pet._id);
                                  } else {
                                    setViewPet(null);
                                  }
                                }}
                              >
                                {/* Pet column: show pet image and name */}
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
                                {/* Adopter column: show user profile image and name */}
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
                                    variant={
                                      adoption.status === "approved"
                                        ? "default"
                                        : adoption.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className="px-3 py-1 rounded-full text-xs font-semibold"
                                  >
                                    {adoption.status
                                      ? adoption.status
                                          .charAt(0)
                                          .toUpperCase() +
                                        adoption.status.slice(1)
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
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(adoption);
                                      }}
                                      title="Edit adoption"
                                      className="h-8 w-8"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          disabled={isDeleting}
                                          title="Delete adoption"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure you want to delete this
                                            adoption request?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This
                                            will permanently delete the adoption
                                            request.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() =>
                                              handleDeleteAdoption(adoption._id)
                                            }
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
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

          {/* Modal for Add/Edit */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4 text-[#0a1629]">
                  {editAdoption ? "Edit Adoption" : "Add Adoption"}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Adopter Name"
                    value={form.adopterName}
                    onChange={(e) =>
                      setForm({ ...form, adopterName: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Adopter Email"
                    type="email"
                    value={form.adopterEmail}
                    onChange={(e) =>
                      setForm({ ...form, adopterEmail: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Pet Name"
                    value={form.petName}
                    onChange={(e) =>
                      setForm({ ...form, petName: e.target.value })
                    }
                    required
                  />
                  <select
                    className="border rounded px-3 py-2"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <div className="flex gap-2 justify-end">
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
                    >
                      {editAdoption ? "Save" : "Add"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Adoption View Modal */}
          {viewAdoption && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-2xl relative">
                {/* Close Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full h-10 w-10 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                  onClick={() => {
                    setViewAdoption(null);
                    setViewUser(null);
                    setViewPet(null);
                  }}
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </Button>

                <h3 className="font-bold text-2xl mb-8 text-[#0a1629] text-center">
                  Adoption Application Details
                </h3>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  {/* Adopter Info */}
                  <div className="flex-1 flex flex-col items-center gap-6">
                    <Avatar className="h-28 w-28 border-4 border-orange-200 shadow-lg">
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
                    <div className="flex flex-col items-center gap-2">
                      Adopter
                      <div className="font-semibold text-xl">
                        {viewUser?.fullname ||
                          viewAdoption.user?.fullname ||
                          viewAdoption.fullname ||
                          viewAdoption.adopterName ||
                          "Unknown User"}
                      </div>
                      <div className="text-gray-500 text-base">
                        {viewUser?.email ||
                          viewAdoption.user?.email ||
                          viewAdoption.email ||
                          viewAdoption.adopterEmail}
                      </div>
                      <div className="text-xs text-gray-500">
                        {viewAdoption.phone && <>Phone: {viewAdoption.phone}</>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {viewAdoption.address && (
                          <>Address: {viewAdoption.address}</>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Pet Info */}
                  <div className="flex-1 flex flex-col items-center gap-6">
                    <Avatar className="h-28 w-28 border-4 border-blue-200 shadow-lg">
                      <AvatarImage
                        src={getPetImageUrl(viewPet, viewAdoption)}
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
                    <div className="flex flex-col items-center gap-2 font-medium text-base">
                      Pet
                      <div className="font-semibold text-xl">
                        {viewPet?.name ||
                          viewAdoption.pet?.name ||
                          viewAdoption.petName ||
                          "Unknown Pet"}
                      </div>
                      <div className="text-gray-500 text-base">
                        {viewPet?.breed ||
                          viewAdoption.pet?.breed ||
                          "Breed: Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {viewPet?.type ||
                          viewAdoption.pet?.type ||
                          "Type: Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {viewPet?.age ||
                          viewAdoption.pet?.age ||
                          "Age: Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {viewPet?.gender ||
                          viewAdoption.pet?.gender ||
                          "Gender: Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-8">
                  <h4 className="font-semibold text-lg mb-3 text-[#0a1629]">
                    Message from Adopter
                  </h4>
                  <div className="bg-gray-50 rounded p-3 text-gray-700">
                    {viewAdoption.message || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
