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
import {
  Search,
  RefreshCw,
  Shield,
  Trash2,
  Pencil,
  Plus,
  X,
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface User {
  _id: string;
  fullname: string;
  email: string;
  profilePicture?: string;
  verified: boolean;
  isAdmin: boolean;
  createdAt: string;
  isArchived?: boolean; // Add archive flag
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Modal state for Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  // Current user profile
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // View user modal state
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewUserAdoptions, setViewUserAdoptions] = useState<any[]>([]);
  const [isLoadingAdoptions, setIsLoadingAdoptions] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();

    // Check initial orientation
    checkOrientation();

    // Add event listener for orientation changes
    window.addEventListener("resize", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  const checkOrientation = () => {
    setIsLandscape(window.innerWidth > window.innerHeight);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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
      setCurrentUser(response.data);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/admin/users/${userId}/admin`,
        {
          isAdmin: !currentStatus,
        }
      );
      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isAdmin: !currentStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Error updating admin status:", error);
    }
  };

  const handleArchiveUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/admin/users/${userId}/archive`
      );
      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isArchived: true } : user
          )
        );
      }
    } catch (error) {
      console.error("Error archiving user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/admin/users/${userId}/restore`
      );
      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isArchived: false } : user
          )
        );
      }
    } catch (error) {
      console.error("Error restoring user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(
        `${BASE_URL}/api/admin/users/${userId}`
      );
      if (response.data.success) {
        setUsers(users.filter((user) => user._id !== userId));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setForm({
      fullname: user.fullname,
      email: user.email,
      password: "",
      isAdmin: user.isAdmin,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditUser(null);
    setForm({ fullname: "", email: "", password: "", isAdmin: false });
    setModalOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editUser) {
        await axiosInstance.put(
          `${BASE_URL}/api/admin/users/${editUser._id}`,
          form
        );
      } else {
        await axiosInstance.post(`${BASE_URL}/api/admin/users`, form);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      alert("Failed to save user.");
    }
  };

  // Fetch adoptions for a user
  const fetchUserAdoptions = async (userId: string) => {
    setIsLoadingAdoptions(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(
        `${BASE_URL}/api/adoptions/all?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setViewUserAdoptions(response.data.adoptions);
      }
    } catch (error) {
      console.error("Error fetching user adoptions:", error);
      setViewUserAdoptions([]);
    } finally {
      setIsLoadingAdoptions(false);
    }
  };

  const handleViewUser = async (user: User) => {
    setViewUser(user);
    setViewUserAdoptions([]); // Clear previous adoptions
    setViewModalOpen(true);
    if (user._id) {
      await fetchUserAdoptions(user._id);
    }
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setViewUser(null);
    setViewUserAdoptions([]); // Clear adoptions when closing
  };

  // Filter users by archive status
  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          (user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !user.isArchived // Only show active by default
      )
    : users.filter((user) => !user.isArchived);

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6 px-0">
          <Card className="rounded-xl sm:rounded-2xl shadow-sm bg-white px-0 py-0 border-0">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      User Management
                    </div>
                    <div className="text-gray-500 text-sm sm:text-base mt-1">
                      <span className="font-semibold text-[#0a1629]">
                        {users.length} total
                      </span>
                      , manage all users in the system
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 sm:gap-4">
                    <Button
                      variant="outline"
                      onClick={fetchUsers}
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

                {/* Search and filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:max-w-sm">
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {filteredUsers.length} users
                  </Badge>
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
                    <table className="w-full mt-4 text-left min-w-[600px]">
                      <thead>
                        <tr className="text-gray-500 text-xs sm:text-sm">
                          <th className="py-2 font-medium pl-4 sm:pl-0">User</th>
                          <th className="py-2 font-medium">Email</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium pr-4 sm:pr-0">Admin</th>
                          {/* <th className="py-2 font-medium">Actions</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-10 text-gray-500"
                            >
                              No users found
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr
                              key={user._id}
                              className={`border-t border-gray-100 hover:bg-gray-50 transition ${
                                user.isArchived ? "opacity-60" : ""
                              } cursor-pointer`}
                              onClick={() => handleViewUser(user)}
                            >
                              <td className="py-3 pl-4 sm:pl-0">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage
                                      src={
                                        user.profilePicture &&
                                        user.profilePicture.trim() !== ""
                                          ? user.profilePicture
                                          : "/placeholder-user.png"
                                      }
                                    />
                                    <AvatarFallback>
                                      {user.fullname.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">
                                      {user.fullname}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      Joined{" "}
                                      {new Date(
                                        user.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-gray-700 text-xs sm:text-sm">
                                {user.email}
                              </td>
                              <td className="py-3">
                                {user.verified ? (
                                  <Badge className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold">
                                    Unverified
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3 pr-4 sm:pr-0">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                    user.isAdmin
                                      ? "bg-orange-50 text-orange-700 border-orange-200"
                                      : "bg-gray-50 text-gray-700 border-green-200"
                                  }`}
                                >
                                  {user.isAdmin ? "Admin" : "User"}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  {/* <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(user);
                                    }}
                                    title="Edit user"
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button> */}
                                  {/* <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleAdmin(user._id, user.isAdmin);
                                    }}
                                    title="Toggle admin status"
                                    className="h-8 w-8"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button> */}
                                  {/* {!user.isArchived ? (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          disabled={isDeleting}
                                          title="Archive user"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Archive this user?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will remove the user from
                                            active users but keep their data for
                                            records.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() =>
                                              handleArchiveUser(user._id)
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
                                        handleRestoreUser(user._id);
                                      }}
                                      disabled={isDeleting}
                                      title="Restore user"
                                      className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50"
                                    >
                                      Restore
                                    </Button>
                                  )} */}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
                  {editUser ? "Edit User" : "Add User"}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Full Name"
                    value={form.fullname}
                    onChange={(e) =>
                      setForm({ ...form, fullname: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                  {!editUser && (
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="Password"
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isAdmin}
                      onChange={(e) =>
                        setForm({ ...form, isAdmin: e.target.checked })
                      }
                    />
                    Is Admin
                  </label>
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
                      {editUser ? "Save" : "Add"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User View Modal - Landscape layout when in landscape mode */}
          {viewModalOpen && viewUser && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
              <div
                className={`bg-white rounded-2xl shadow-lg p-20 w-full max-w-4xl ${
                  isLandscape ? "flex gap-8" : ""
                } relative`}
              >
                <h3 className="font-bold text-2xl mb-8 text-[#0a1629] text-center absolute top-6 left-6">
                  User Details
                </h3>

                <div
                  className={`flex ${
                    isLandscape
                      ? "flex-col items-center gap-6 w-1/3"
                      : "flex-col items-center gap-6 mb-8"
                  }`}
                >
                  <Avatar
                    className={`${
                      isLandscape ? "h-24 w-24" : "h-28 w-28"
                    } border-4 border-orange-200 shadow-lg`}
                  >
                    <AvatarImage
                      src={
                        viewUser.profilePicture &&
                        viewUser.profilePicture.trim() !== ""
                          ? viewUser.profilePicture
                          : "/placeholder-user.png"
                      }
                      alt={viewUser.fullname}
                    />
                    <AvatarFallback>
                      {viewUser.fullname.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-semibold text-xl">
                      {viewUser.fullname}
                    </div>
                    <div className="text-gray-500 text-base">
                      {viewUser.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      Joined:{" "}
                      {new Date(viewUser.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                      <Badge
                        className={
                          viewUser.verified
                            ? "bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold"
                            : "bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold"
                        }
                      >
                        {viewUser.verified ? "Verified" : "Unverified"}
                      </Badge>
                      <Badge
                        className={
                          viewUser.isAdmin
                            ? "bg-orange-50 text-orange-700 border-orange-200 px-3 py-1 rounded-full text-xs font-semibold"
                            : "bg-gray-50 text-gray-700 border-green-200 px-3 py-1 rounded-full text-xs font-semibold"
                        }
                      >
                        {viewUser.isAdmin ? "Admin" : "User"}
                      </Badge>
                      {viewUser.isArchived && (
                        <Badge className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1 rounded-full text-xs font-semibold">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`${isLandscape ? "w-2/3" : ""}`}>
                  <h4 className="font-semibold text-lg mb-3 text-[#0a1629]">
                    Adoption Forms Submitted
                  </h4>
                  {isLoadingAdoptions ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader />
                    </div>
                  ) : viewUserAdoptions.length === 0 ? (
                    <div className="text-gray-500 text-sm">
                      No adoption forms submitted.
                    </div>
                  ) : (
                    <div
                      className={`${
                        isLandscape ? "max-h-64 overflow-y-auto" : ""
                      }`}
                    >
                      <ul className="space-y-3">
                        {viewUserAdoptions.map((adoption) => (
                          <li
                            key={adoption._id}
                            className="bg-gray-50 rounded-lg p-3 flex flex-col"
                          >
                            <span className="font-medium text-[#0a1629]">
                              {adoption.pet?.name || adoption.petName}
                            </span>
                            <span className="text-xs text-gray-500">
                              Status: {adoption.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              Date:{" "}
                              {new Date(
                                adoption.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Close button at the bottom */}
                <div className="absolute top-6 right-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                    onClick={handleCloseModal}
                    title="Close"
                  >
                    <X className="h-5 w-5" />
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
