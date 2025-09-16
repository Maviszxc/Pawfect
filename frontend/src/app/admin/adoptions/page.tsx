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
import { Search, RefreshCw, Pencil, Trash2, Plus } from "lucide-react";
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
    images?: string[];
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

  useEffect(() => {
    fetchAdoptions();
    fetchCurrentUser();
  }, []);

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
      const response = await axiosInstance.delete(
        `${BASE_URL}/api/admin/adoptions/${adoptionId}`
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editAdoption) {
        await axiosInstance.put(
          `${BASE_URL}/api/admin/adoptions/${editAdoption._id}`,
          form
        );
      } else {
        await axiosInstance.post(`${BASE_URL}/api/admin/adoptions`, form);
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
          "" ||
          a.adopterEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          "" ||
          a.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          "" ||
          a.user?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          "" ||
          a.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ""
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

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-[#f8fafc] pb-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
          {/* Display current admin profile at the top right */}
          <div className="flex justify-end mb-2">
            {currentUser && (
              <div className="flex items-center gap-2">
                {/* <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getProfilePictureUrl(currentUser.profilePicture)}
                    alt={currentUser.fullname}
                  />
                  <AvatarFallback>
                    {currentUser.fullname
                      ? currentUser.fullname.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar> */}
                {/* <span className="text-sm font-medium text-[#0a1629]">
                  {currentUser.fullname}
                </span> */}
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
                          filteredAdoptions.map((adoption) => (
                            <TableRow key={adoption._id} className="hover:bg-gray-50 transition">
                              {/* Pet column: show pet image and name */}
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage
                                      src={
                                        // Prefer pet.images[0] if available, then petImage, else placeholder
                                        adoption.pet?.images?.[0]
                                          ? adoption.pet.images[0]
                                          : adoption.petImage
                                          ? adoption.petImage
                                          : "/placeholder-pet.jpg"
                                      }
                                      alt={
                                        // Prefer pet.name if available, else adoption.petName
                                        adoption.pet?.name
                                          ? adoption.pet.name
                                          : adoption.petName
                                      }
                                    />
                                    <AvatarFallback>
                                      {(adoption.pet?.name
                                        ? adoption.pet.name
                                        : adoption.petName
                                      )
                                        ?.charAt(0)
                                        ?.toUpperCase() || "P"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-[#0a1629]">
                                    {adoption.pet?.name
                                      ? adoption.pet.name
                                      : adoption.petName}
                                  </span>
                                </div>
                              </TableCell>
                              {/* Adopter column: show user profile image and name */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        adoption.user?.profilePicture &&
                                        adoption.user.profilePicture.trim() !== ""
                                          ? adoption.user.profilePicture
                                          : "/placeholder-user.png"
                                      }
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
                                    ? adoption.status.charAt(0).toUpperCase() +
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
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      setViewAdoption(adoption);
                                      if (adoption.user?._id) {
                                        await fetchUserProfile(
                                          adoption.user._id
                                        );
                                      } else {
                                        setViewUser(null);
                                      }
                                    }}
                                    className="px-3"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(adoption)}
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
                          ))
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
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4 text-[#0a1629]">
                  Adoption Application Details
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        viewUser?.profilePicture &&
                        viewUser.profilePicture.trim() !== ""
                          ? viewUser.profilePicture
                          : viewAdoption.user?.profilePicture &&
                            viewAdoption.user.profilePicture.trim() !== ""
                          ? viewAdoption.user.profilePicture
                          : "/placeholder-user.png"
                      }
                      alt={
                        viewUser?.fullname ||
                        viewAdoption.user?.fullname ||
                        "Adopter"
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
                  <div>
                    <div className="font-semibold text-lg">
                      {viewUser?.fullname ||
                        viewAdoption.user?.fullname ||
                        viewAdoption.fullname ||
                        viewAdoption.adopterName ||
                        "Unknown User"}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {viewUser?.email ||
                        viewAdoption.user?.email ||
                        viewAdoption.email ||
                        viewAdoption.adopterEmail}
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Phone:</span>{" "}
                  {viewAdoption.phone || "-"}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Address:</span>{" "}
                  {viewAdoption.address || "-"}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Message:</span>
                  <div className="bg-gray-50 rounded p-2 mt-1 text-gray-700">
                    {viewAdoption.message || "-"}
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setViewAdoption(null);
                      setViewUser(null);
                    }}
                  >
                    Close
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
  