"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loader from "@/components/Loader";
import { toast } from "react-toastify";
import Footer from "@/components/Footer";

// Dynamically import FloatingBotDemo with SSR disabled
const FloatingBotDemo = dynamic(() => import("@/components/FloatingBotDemo"), {
  ssr: false,
});

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: string;
  gender: string;
  images: { url: string }[];
  description: string;
  adoptionStatus: string;
  isUnavailable?: boolean;
}

interface FilterState {
  type: string;
  gender: string;
  breed: string;
  age: string;
  searchQuery: string;
}

// Add helpers for colored badges
const getBreedColor = (breed: string) => {
  if (!breed) return "bg-gray-100 text-gray-700";
  if (
    breed.toLowerCase().includes("shi") ||
    breed.toLowerCase().includes("retriever")
  )
    return "bg-yellow-100 text-yellow-800";
  if (
    breed.toLowerCase().includes("persian") ||
    breed.toLowerCase().includes("ragdoll")
  )
    return "bg-purple-100 text-purple-800";
  return "bg-blue-100 text-blue-800";
};
const getGenderColor = (gender: string) => {
  if (gender.toLowerCase() === "male") return "bg-blue-100 text-blue-800";
  if (gender.toLowerCase() === "female") return "bg-pink-100 text-pink-800";
  return "bg-gray-100 text-gray-700";
};
const getAgeColor = (age: string | number) => {
  if (typeof age === "string") {
    if (age.toLowerCase().includes("kitten"))
      return "bg-amber-100 text-amber-800";
    if (age.toLowerCase().includes("young"))
      return "bg-green-100 text-green-800";
    if (age.toLowerCase().includes("mature"))
      return "bg-blue-100 text-blue-800";
    if (age.toLowerCase().includes("adult")) return "bg-gray-100 text-gray-800";
  }
  return "bg-gray-100 text-gray-800";
};

// Helper function to check if pet has approved adoption
const checkPetAvailability = async (petId: string): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/adoptions/check-availability/${petId}`
    );
    return response.data.isAvailable;
  } catch (error) {
    console.error(`Error checking availability for pet ${petId}:`, error);
    // If the endpoint doesn't exist yet, assume pet is available
    return true;
  }
};

// Helper function to filter out pets with approved adoptions
const filterAvailablePets = async (pets: Pet[]): Promise<Pet[]> => {
  const availabilityChecks = await Promise.all(
    pets.map(async (pet) => {
      const isAvailable = await checkPetAvailability(pet._id);
      return { pet, isAvailable };
    })
  );

  return availabilityChecks
    .filter(({ isAvailable }) => isAvailable)
    .map(({ pet }) => pet);
};

export default function Adopt() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dogBreeds, setDogBreeds] = useState<string[]>([]);
  const [catBreeds, setCatBreeds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    gender: "all",
    breed: "all",
    age: "all",
    searchQuery: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      setIsAuthenticated(!!token);
    }
  }, []);

  // Fetch all pets initially and check their availability
  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/pets`);
      if (response.data.success) {
        // First filter by adoption status from the database
        const availablePets = response.data.pets.filter(
          (pet: Pet) => pet.adoptionStatus === "available"
        );

        // Then filter out pets that have approved adoptions
        const fullyAvailablePets = await filterAvailablePets(availablePets);

        setPets(fullyAvailablePets);

        // Extract unique breeds for filtering (from available pets only)
        const dogs = fullyAvailablePets.filter(
          (pet: Pet) => pet.type.toLowerCase() === "dog"
        );
        const cats = fullyAvailablePets.filter(
          (pet: Pet) => pet.type.toLowerCase() === "cat"
        );

        setDogBreeds(
          Array.from(new Set(dogs.map((pet: Pet) => pet.breed))) as string[]
        );
        setCatBreeds(
          Array.from(new Set(cats.map((pet: Pet) => pet.breed))) as string[]
        );
      }
    } catch (error: any) {
      toast.error("Error fetching pets. Please try again.");
      console.error("Error fetching pets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  // Fetch filtered pets when filters change
  useEffect(() => {
    const fetchFilteredPets = async () => {
      setIsLoading(true);
      try {
        // Build query parameters based on filters
        const params = new URLSearchParams();

        if (filters.type !== "all")
          params.append("type", filters.type.toLowerCase());
        if (filters.gender !== "all")
          params.append("gender", filters.gender.toLowerCase());
        if (filters.breed !== "all") params.append("breed", filters.breed);
        if (filters.age !== "all") params.append("age", filters.age);
        if (filters.searchQuery)
          params.append("searchQuery", filters.searchQuery);

        const response = await axios.get(
          `${BASE_URL}/api/pets/filter?${params}`
        );

        if (response.data.success) {
          // Filter to only show available pets from database
          const availablePets = response.data.pets.filter(
            (pet: Pet) => pet.adoptionStatus === "available"
          );

          // Then filter out pets that have approved adoptions
          const fullyAvailablePets = await filterAvailablePets(availablePets);

          setPets(fullyAvailablePets);
        }
      } catch (error: any) {
        toast.error("Error fetching filtered pets. Please try again.");
        console.error("Error fetching filtered pets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have changed filters (skip the initial render)
    if (
      filters.type !== "all" ||
      filters.gender !== "all" ||
      filters.breed !== "all" ||
      filters.age !== "all" ||
      filters.searchQuery
    ) {
      fetchFilteredPets();
    }
  }, [filters]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-white-50 to-white pb-20">
        {/* Floating Bot Animation */}
        <div className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none">
          <FloatingBotDemo count={1} width={180} height={180} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
          >
            <div className="inline-block relative">
              <span className="absolute -top-3 -left-6 w-12 h-12 rounded-full bg-orange-100 opacity-70"></span>
              <span className="absolute -bottom-3 -right-6 w-10 h-10 rounded-full bg-blue-100 opacity-70"></span>
              <h1 className="relative text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-2">
                Available Pets
              </h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Filters Section - Left Side */}
              <motion.div
                className={`${
                  filtersVisible ? "w-full md:w-64" : "w-auto"
                } transition-all duration-300 ease-in-out`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {filtersVisible && "Filters"}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiltersVisible(!filtersVisible)}
                      className="p-1 h-8 w-8"
                    >
                      {filtersVisible ? (
                        <ChevronLeft className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {filtersVisible && (
                    <div className="p-4 space-y-4">
                      {/* Search */}
                      <div>
                        <Label
                          htmlFor="search"
                          className="text-xs text-gray-500 mb-1 block"
                        >
                          Search
                        </Label>
                        <Input
                          id="search"
                          placeholder="Search by name, breed..."
                          value={filters.searchQuery}
                          onChange={(e) =>
                            handleFilterChange("searchQuery", e.target.value)
                          }
                          className="rounded-lg text-sm"
                        />
                      </div>

                      {/* Pet Type Filter */}
                      <div>
                        <Label
                          htmlFor="pet-type"
                          className="text-xs text-gray-500 mb-1 block"
                        >
                          Pet Type
                        </Label>
                        <div id="pet-type" className="flex flex-col gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="all"
                              checked={filters.type === "all"}
                              onCheckedChange={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  type: "all",
                                  breed: "all",
                                }))
                              }
                            />
                            <label
                              htmlFor="all"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              All
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="dog"
                              checked={filters.type === "dog"}
                              onCheckedChange={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  type: "dog",
                                  breed: "all",
                                }))
                              }
                            />
                            <label
                              htmlFor="dog"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Dogs
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="cat"
                              checked={filters.type === "cat"}
                              onCheckedChange={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  type: "cat",
                                  breed: "all",
                                }))
                              }
                            />
                            <label
                              htmlFor="cat"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Cats
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Gender Filter */}
                      <div>
                        <Label
                          htmlFor="gender-select"
                          className="text-xs text-gray-500 mb-1 block"
                        >
                          Gender
                        </Label>
                        <Select
                          name="gender-select"
                          value={filters.gender}
                          onValueChange={(value) =>
                            setFilters((prev) => ({
                              ...prev,
                              gender: value,
                            }))
                          }
                        >
                          <SelectTrigger className="rounded-lg text-sm">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Breed Filter */}
                      <div>
                        <Label
                          htmlFor="breed-select"
                          className="text-xs text-gray-500 mb-1 block"
                        >
                          Breed
                        </Label>
                        <Select
                          name="breed-select"
                          value={filters.breed}
                          onValueChange={(value) =>
                            setFilters((prev) => ({
                              ...prev,
                              breed: value,
                            }))
                          }
                        >
                          <SelectTrigger className="rounded-lg text-sm">
                            <SelectValue placeholder="Select breed" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="all">All Breeds</SelectItem>
                            {filters.type === "dog" || filters.type === "all"
                              ? dogBreeds.map((breed) => (
                                  <SelectItem key={breed} value={breed}>
                                    {breed}
                                  </SelectItem>
                                ))
                              : null}
                            {filters.type === "cat" || filters.type === "all"
                              ? catBreeds.map((breed) => (
                                  <SelectItem key={breed} value={breed}>
                                    {breed}
                                  </SelectItem>
                                ))
                              : null}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Age Category Filter */}
                      <div>
                        <Label
                          htmlFor="age-category"
                          className="text-xs text-gray-500 mb-1 block"
                        >
                          Age Category
                        </Label>
                        <Select
                          name="age-category"
                          value={filters.age}
                          onValueChange={(value) =>
                            setFilters((prev) => ({
                              ...prev,
                              age: value,
                            }))
                          }
                        >
                          <SelectTrigger className="rounded-lg text-sm">
                            <SelectValue placeholder="Select age category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="kitten">
                              Kitten (&lt; 1 year)
                            </SelectItem>
                            <SelectItem value="young adult">
                              Young Adult (1-3 years)
                            </SelectItem>
                            <SelectItem value="mature adult">
                              Mature Adult (4-7 years)
                            </SelectItem>
                            <SelectItem value="adult">
                              Adult (8+ years)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Pet Cards Grid - Right Side */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Loader />
                  </div>
                ) : pets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pets.map((pet) => (
                      <motion.div
                        key={pet._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                          <div className="relative h-80 flex  overflow-hidden">
                            <img
                              src={
                                pet.images && pet.images.length > 0
                                  ? pet.images[0]?.url
                                  : "/placeholder-pet.jpg"
                              }
                              alt={pet.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge
                                className={
                                  pet.type.toLowerCase() === "dog"
                                    ? "bg-blue-500"
                                    : pet.type.toLowerCase() === "cat"
                                    ? "bg-purple-500"
                                    : "bg-green-500"
                                }
                              >
                                {pet.type.charAt(0).toUpperCase() +
                                  pet.type.slice(1).toLowerCase()}
                              </Badge>
                            </div>
                          </div>
                          <CardHeader className="pb-1 px-3 pt-2">
                            <div className="flex justify-between items-center p-4">
                              <CardTitle className="text-base">
                                {pet.name}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-1 capitalize ${getAgeColor(
                                  pet.age
                                )}`}
                              >
                                {typeof pet.age === "string"
                                  ? (pet.age as string)
                                      .charAt(0)
                                      .toUpperCase() +
                                    (pet.age as string).slice(1)
                                  : `${pet.age} ${
                                      pet.age === 1 ? "Year" : "Years"
                                    }`}
                              </Badge>
                            </div>
                            <div className="flex gap-3 mt-1 p-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs px-2 py-1 ${getBreedColor(
                                  pet.breed
                                )}`}
                              >
                                {pet.breed}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={`text-xs capitalize px-2 py-1 ${getGenderColor(
                                  pet.gender
                                )}`}
                              >
                                {pet.gender}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 flex-grow">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {pet.description}
                            </p>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <button
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-colors duration-300"
                              onClick={() => {
                                if (!isAuthenticated) {
                                  window.location.href =
                                    "/auth/login?returnUrl=/adoption";
                                } else {
                                  window.location.href = `/pet?id=${pet._id}`;
                                }
                              }}
                            >
                              Meet {pet.name}
                            </button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-600">
                      No pets found matching your filters. Try adjusting your
                      search criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating About Button */}
        <Link
          href="/about"
          className="fixed bottom-8 right-8 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-40"
        >
          <i className="bi bi-info-circle text-xl"></i>
        </Link>

        {isAuthenticated ? <AuthNavigation /> : <Navigation />}
      </main>
      <Footer />
    </>
  );
}
