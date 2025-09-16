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
import { Search, RefreshCw, Shield, Trash2, Pencil, Plus } from "lucide-react";
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
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

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

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-[#f8fafc] pb-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
          <Card className="rounded-2xl shadow bg-white px-0 py-0">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0a1629]">
                      User Management
                    </div>
                    <div className="text-gray-500 text-base mt-1">
                      <span className="font-semibold text-[#0a1629]">
                        {users.length} total
                      </span>
                      , manage all users in the system
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
                    <Button
                      variant="outline"
                      onClick={fetchUsers}
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
                      <Plus className="h-4 w-4 mr-2" /> Add User
                    </Button>
                  </div>
                </div>

                {/* Search and filter */}
                <div className="flex justify-between items-center">
                  <div className="relative w-full max-w-sm">
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
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
                    className="overflow-x-auto"
                    style={{ maxHeight: "60vh", overflowY: "auto" }}
                  >
                    <table className="w-full mt-4 text-left">
                      <thead>
                        <tr className="text-gray-400 text-sm">
                          <th className="py-2 font-medium">User</th>
                          <th className="py-2 font-medium">Email</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium">Admin</th>
                          <th className="py-2 font-medium">Actions</th>
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
                              className="border-t border-gray-100 hover:bg-gray-50 transition"
                            >
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar>
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
                                  <div>
                                    <p className="font-medium text-[#0a1629]">
                                      {user.fullname}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Joined{" "}
                                      {new Date(
                                        user.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-gray-700 text-sm">
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
                              <td className="py-3">
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(user)}
                                    title="Edit user"
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleToggleAdmin(user._id, user.isAdmin)
                                    }
                                    title="Toggle admin status"
                                    className="h-8 w-8"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        disabled={isDeleting}
                                        title="Delete user"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you sure you want to delete this
                                          user?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This
                                          will permanently delete the user
                                          account and all associated data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-500 hover:bg-red-600"
                                          onClick={() =>
                                            handleDeleteUser(user._id)
                                          }
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
