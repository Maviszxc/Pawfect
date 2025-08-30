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
import { Search, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
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

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  gender: string;
  image: string;
  description: string;
  adoptionStatus: string;
  owner?: string;
  createdAt?: string;
  images?: string[];
}

export default function AdminPetsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal state for Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    breed: "",
    age: 0,
    gender: "",
    description: "",
    adoptionStatus: "",
    image: "",
  });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`${BASE_URL}/api/admin/pets`);
      if (response.data.success) {
        setPets(response.data.pets);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    setIsDeleting(true);
    try {
      const response = await axiosInstance.delete(
        `${BASE_URL}/api/admin/pets/${petId}`
      );
      if (response.data.success) {
        setPets(pets.filter((pet) => pet._id !== petId));
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
    } finally {
      setIsDeleting(false);
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
      image: pet.images?.[0] || "",
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditPet(null);
    setForm({
      name: "",
      type: "",
      breed: "",
      age: 0,
      gender: "",
      description: "",
      adoptionStatus: "",
      image: "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editPet) {
        await axiosInstance.put(
          `${BASE_URL}/api/admin/pets/${editPet._id}`,
          form
        );
      } else {
        await axiosInstance.post(`${BASE_URL}/api/admin/pets`, form);
      }
      setModalOpen(false);
      fetchPets();
    } catch (error) {
      alert("Failed to save pet.");
    }
  };

  const filteredPets = searchQuery
    ? pets.filter(
        (pet) =>
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pets;

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
                      Pet Management
                    </div>
                    <div className="text-gray-500 text-base mt-1">
                      <span className="font-semibold text-[#0a1629]">
                        {pets.length} total
                      </span>
                      , manage all pets in the system
                    </div>
                  </div>
                  <div className="flex flex-row gap-4">
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

                {/* Search and filter */}
                <div className="flex justify-between items-center">
                  <div className="relative w-full max-w-sm">
                    <Input
                      type="text"
                      placeholder="Search pets by name, type, or breed..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {filteredPets.length} pets
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
                          <th className="py-2 pr-2 pl-1 font-medium">Image</th>
                          <th className="py-2 font-medium">Name</th>
                          <th className="py-2 font-medium">Type</th>
                          <th className="py-2 font-medium">Breed</th>
                          <th className="py-2 font-medium">Age</th>
                          <th className="py-2 font-medium">Gender</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPets.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center py-10 text-gray-500"
                            >
                              No pets found
                            </td>
                          </tr>
                        ) : (
                          filteredPets.map((pet) => (
                            <tr
                              key={pet._id}
                              className="border-t border-gray-100 hover:bg-gray-50 transition"
                            >
                              <td className="py-3 pr-2 pl-1">
                                <Avatar>
                                  <AvatarImage
                                    src={
                                      pet.images?.[0] || "/placeholder-pet.jpg"
                                    }
                                  />
                                  <AvatarFallback>
                                    {pet.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </td>
                              <td className="py-3 font-medium text-[#0a1629]">
                                {pet.name}
                              </td>
                              <td className="py-3 text-gray-700 text-sm">
                                {pet.type}
                              </td>
                              <td className="py-3 text-gray-700 text-sm">
                                {pet.breed}
                              </td>
                              <td className="py-3 text-gray-700 text-sm">
                                {pet.age}
                              </td>
                              <td className="py-3 text-gray-700 text-sm">
                                {pet.gender}
                              </td>
                              <td className="py-3">
                                <Badge
                                  className={
                                    pet.adoptionStatus === "available"
                                      ? "bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold"
                                      : pet.adoptionStatus === "pending"
                                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full text-xs font-semibold"
                                      : pet.adoptionStatus === "adopted"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold"
                                      : "bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold"
                                  }
                                >
                                  {pet.adoptionStatus.charAt(0).toUpperCase() +
                                    pet.adoptionStatus.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(pet)}
                                    title="Edit pet"
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        disabled={isDeleting}
                                        title="Delete pet"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you sure you want to delete this
                                          pet?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This
                                          will permanently delete the pet from
                                          the system.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-500 hover:bg-red-600"
                                          onClick={() =>
                                            handleDeletePet(pet._id)
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
                  {editPet ? "Edit Pet" : "Add Pet"}
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Breed"
                    value={form.breed}
                    onChange={(e) =>
                      setForm({ ...form, breed: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Age"
                    type="number"
                    value={form.age}
                    onChange={(e) =>
                      setForm({ ...form, age: Number(e.target.value) })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Gender"
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Image URL"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                  />
                  <select
                    className="border rounded px-3 py-2"
                    value={form.adoptionStatus}
                    onChange={(e) =>
                      setForm({ ...form, adoptionStatus: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="adopted">Adopted</option>
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
                      {editPet ? "Save" : "Add"}
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
