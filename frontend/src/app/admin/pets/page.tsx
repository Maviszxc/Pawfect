"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { Search, Edit, Trash2, PlusCircle, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
      toast.error("Failed to load pets");
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
        toast.success("Pet deleted successfully");
        fetchPets(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
      toast.error("Failed to delete pet");
    } finally {
      setIsDeleting(false);
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
      <div className="container mx-auto p-4 pt-24">
        <ToastContainer />
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold">Pet Management</h1>
              <p className="text-muted-foreground">
                Add, edit, and manage pets available for adoption
              </p>
            </div>
            <div className="flex space-x-2">
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
                onClick={() => router.push("/admin/pets/add")}
                className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Pet
              </Button>
            </div>
          </div>

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
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-gray-100">
              <CardTitle className="flex items-center justify-between">
                <span>Pet List</span>
                <Badge variant="outline" className="ml-2">
                  {filteredPets.length} pets
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader />
                </div>
              ) : filteredPets.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No pets found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  {filteredPets.map((pet) => (
                    <motion.div
                      key={pet._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={pet.images?.[0] || "/placeholder-pet.jpg"}
                            alt={pet.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge
                              className={`${
                                pet.adoptionStatus === "available"
                                  ? "bg-green-500"
                                  : pet.adoptionStatus === "pending"
                                  ? "bg-yellow-500"
                                  : pet.adoptionStatus === "adopted"
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                              }`}
                            >
                              {pet.adoptionStatus.charAt(0).toUpperCase() +
                                pet.adoptionStatus.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-xl">
                              {pet.name}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {pet.age} {pet.age === 1 ? "year" : "years"}
                            </Badge>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {pet.type}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {pet.breed}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added{" "}
                            {new Date(pet.createdAt || "").toLocaleDateString()}
                          </p>
                        </CardHeader>
                        <CardContent className="py-0 flex-grow">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {pet.description}
                          </p>
                        </CardContent>
                        <div className="flex justify-between p-4 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/pets/edit/${pet._id}`)
                            }
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure you want to delete this pet?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the pet from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDeletePet(pet._id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
