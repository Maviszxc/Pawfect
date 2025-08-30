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

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const fetchAdoptions = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/api/admin/adoptions`
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

  const filteredAdoptions = searchQuery
    ? adoptions.filter(
        (a) =>
          a.adopterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.adopterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.petName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : adoptions;

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
                  <div className="overflow-x-auto">
                    <table className="w-full mt-4 text-left">
                      <thead>
                        <tr className="text-gray-400 text-sm">
                          <th className="py-2 font-medium">Pet</th>
                          <th className="py-2 font-medium">Adopter</th>
                          <th className="py-2 font-medium">Email</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium">Date</th>
                          <th className="py-2 font-medium">Actions</th>
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
                          filteredAdoptions.map((adoption) => (
                            <tr
                              key={adoption._id}
                              className="border-t border-gray-100 hover:bg-gray-50 transition"
                            >
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage
                                      src={
                                        adoption.petImage ||
                                        "/placeholder-pet.jpg"
                                      }
                                    />
                                    <AvatarFallback>
                                      {adoption.petName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-[#0a1629]">
                                    {adoption.petName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 font-medium text-[#0a1629]">
                                {adoption.adopterName}
                              </td>
                              <td className="py-3 text-gray-700 text-sm">
                                {adoption.adopterEmail}
                              </td>
                              <td className="py-3">
                                <Badge
                                  className={
                                    adoption.status === "approved"
                                      ? "bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold"
                                      : adoption.status === "pending"
                                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs font-semibold"
                                      : "bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold"
                                  }
                                >
                                  {adoption.status.charAt(0).toUpperCase() +
                                    adoption.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 text-gray-700 text-sm">
                                {new Date(
                                  adoption.createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
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
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
