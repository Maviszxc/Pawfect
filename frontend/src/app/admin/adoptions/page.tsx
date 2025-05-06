"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Adoption {
  _id: string;
  pet: {
    _id: string;
    name: string;
    type: string;
    breed: string;
    image: string;
  };
  user: {
    _id: string;
    fullname: string;
    email: string;
    profilePicture?: string;
  };
  status: string;
  message: string;
  createdAt: string;
}

export default function AdminAdoptionsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAdoption, setSelectedAdoption] = useState<Adoption | null>(
    null
  );
  const [responseMessage, setResponseMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const response = await axiosInstance.get(
          `${BASE_URL}/api/users/current`
        );
        if (response.data.success) {
          const user = response.data.user;
          if (!user.isAdmin) {
            toast.error("You don't have admin privileges");
            router.push("/dashboard");
            return;
          }
          setIsAdmin(true);
          fetchAdoptions();
        }
      } catch (error) {
        console.error("Authentication error:", error);
        localStorage.removeItem("accessToken");
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchAdoptions = async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/api/adoptions/all`);
      if (response.data.success) {
        setAdoptions(response.data.adoptions);
      }
    } catch (error) {
      console.error("Error fetching adoptions:", error);
      toast.error("Failed to load adoption requests");
    }
  };

  const handleUpdateStatus = async (adoptionId: string, newStatus: string) => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.patch(
        `${BASE_URL}/api/adoptions/${adoptionId}/status`,
        {
          status: newStatus,
          adminMessage: responseMessage,
        }
      );

      if (response.data.success) {
        toast.success(`Adoption request ${newStatus.toLowerCase()}`);
        // Update the local state
        setAdoptions(
          adoptions.map((adoption) =>
            adoption._id === adoptionId
              ? { ...adoption, status: newStatus }
              : adoption
          )
        );
        setIsDialogOpen(false);
        setResponseMessage("");
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating adoption status:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResponseDialog = (adoption: Adoption) => {
    setSelectedAdoption(adoption);
    setIsDialogOpen(true);
  };

  const filteredAdoptions = adoptions.filter((adoption) => {
    // Filter by search query
    const matchesSearch =
      adoption.pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adoption.user.fullname.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by status
    const matchesStatus =
      statusFilter === "all" || adoption.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-4 pt-24">
      <ToastContainer />
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Adoption Requests</h1>
            <p className="text-muted-foreground">
              Manage and respond to adoption requests
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/dashboard")}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="flex justify-between items-center gap-4">
          <Input
            placeholder="Search by pet or user name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adoption Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAdoptions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  No adoption requests found matching your criteria.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pet</TableHead>
                    <TableHead>Adopter</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdoptions.map((adoption) => (
                    <TableRow key={adoption._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={adoption.pet.image || "/placeholder-pet.jpg"}
                            alt={adoption.pet.name}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                          <div>
                            <p className="font-medium">{adoption.pet.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {adoption.pet.breed} {adoption.pet.type}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              adoption.user.profilePicture ||
                              "/placeholder-user.jpg"
                            }
                            alt={adoption.user.fullname}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">
                              {adoption.user.fullname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {adoption.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(adoption.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            adoption.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : adoption.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : adoption.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {adoption.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResponseDialog(adoption)}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adoption Request Details</DialogTitle>
            <DialogDescription>
              {selectedAdoption && (
                <div className="mt-2">
                  <p>
                    <strong>Pet:</strong> {selectedAdoption.pet.name} (
                    {selectedAdoption.pet.breed})
                  </p>
                  <p>
                    <strong>Adopter:</strong> {selectedAdoption.user.fullname}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedAdoption.status}
                  </p>
                  <p>
                    <strong>Request Date:</strong>{" "}
                    {new Date(selectedAdoption.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2">
                    <strong>Message from adopter:</strong>
                  </p>
                  <p className="p-2 bg-gray-50 rounded-md mt-1">
                    {selectedAdoption.message || "No message provided"}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="font-medium">Your Response:</label>
              <Textarea
                placeholder="Enter your response to the adopter..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Update Status:</label>
              <div className="flex space-x-2">
                {selectedAdoption?.status !== "Approved" && (
                  <Button
                    onClick={() =>
                      selectedAdoption &&
                      handleUpdateStatus(selectedAdoption._id, "Approved")
                    }
                    className="bg-green-500 hover:bg-green-600 flex-1"
                    disabled={isSubmitting}
                  >
                    Approve
                  </Button>
                )}
                {selectedAdoption?.status !== "Rejected" && (
                  <Button
                    onClick={() =>
                      selectedAdoption &&
                      handleUpdateStatus(selectedAdoption._id, "Rejected")
                    }
                    className="bg-red-500 hover:bg-red-600 flex-1"
                    disabled={isSubmitting}
                  >
                    Reject
                  </Button>
                )}
                {selectedAdoption?.status === "Approved" && (
                  <Button
                    onClick={() =>
                      selectedAdoption &&
                      handleUpdateStatus(selectedAdoption._id, "Completed")
                    }
                    className="bg-blue-500 hover:bg-blue-600 flex-1"
                    disabled={isSubmitting}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
