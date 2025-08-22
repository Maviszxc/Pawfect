"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/dynamic-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditPetPageProps {
  params: {
    id: string;
  };
}

export default function EditPetPage({ params }: EditPetPageProps) {
  const router = useRouter();
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    breed: "",
    age: "",
    gender: "",
    description: "",
    adoptionStatus: "Available",
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const response = await axiosInstance.get(
          `${BASE_URL}/api/users/current-user`
        );
        if (response.data.success) {
          const user = response.data.user;
          if (!user.isAdmin) {
            console.error("You don't have admin privileges");
            router.push("/dashboard");
            return;
          }
          setIsAdmin(true);
          fetchPetDetails();
        }
      } catch (error) {
        console.error("Authentication error:", error);
        localStorage.removeItem("accessToken");
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router, id]);

  const fetchPetDetails = async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/api/pets/${id}`);
      if (response.data.success) {
        const pet = response.data.pet;
        setFormData({
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
          age: pet.age.toString(),
          gender: pet.gender,
          description: pet.description || "",
          adoptionStatus: pet.adoptionStatus,
          image: pet.image,
        });
        setImagePreview(pet.image);
      } else {
        console.error("Failed to fetch pet details");
        router.push("/admin/pets");
      }
    } catch (error) {
      console.error("Error fetching pet details:", error);
      console.error("Something went wrong. Please try again.");
      router.push("/admin/pets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (
        !formData.name ||
        !formData.type ||
        !formData.breed ||
        !formData.age ||
        !formData.gender
      ) {
        console.error("Please fill all required fields");
        setIsSubmitting(false);
        return;
      }

      let updatedPetData = {
        ...formData,
        age: Number(formData.age),
      };

      // If a new image was uploaded, process it first
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);

        const imageResponse = await axiosInstance.post(
          `${BASE_URL}/api/upload`,
          imageFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (!imageResponse.data.success) {
          console.error("Failed to upload image");
          setIsSubmitting(false);
          return;
        }

        updatedPetData.image = imageResponse.data.imageUrl;
      }

      // Update the pet with the new data
      const response = await axiosInstance.put(
        `${BASE_URL}/api/pets/${id}`,
        updatedPetData
      );

      if (response.data.success) {
        console.log("Pet updated successfully!");
        router.push("/admin/pets");
      } else {
        console.error(response.data.message || "Failed to update pet");
      }
    } catch (error) {
      console.error("Error updating pet:", error);
      console.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex flex-col space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Edit Pet</h1>
            <p className="text-muted-foreground">
              Update the details for {formData.name}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/pets")}>
            Back to Pets
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pet Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter pet name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Pet Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dog">Dog</SelectItem>
                      <SelectItem value="Cat">Cat</SelectItem>
                      <SelectItem value="Bird">Bird</SelectItem>
                      <SelectItem value="Fish">Fish</SelectItem>
                      <SelectItem value="Small Animal">Small Animal</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Breed *</Label>
                  <Input
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    placeholder="Enter breed"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age (years) *</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age in years"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adoptionStatus">Adoption Status</Label>
                  <Select
                    value={formData.adoptionStatus}
                    onValueChange={(value) =>
                      handleSelectChange("adoptionStatus", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Adopted">Adopted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter pet description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Pet Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Current Image:
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-40 h-40 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/pets")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Pet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
