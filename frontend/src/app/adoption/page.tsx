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

// Dynamically import FloatingBotDemo with SSR disabled
const FloatingBotDemo = dynamic(() => import("@/components/FloatingBotDemo"), {
  ssr: false,
});

// Define interfaces for type safety
interface Pet {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  gender: string;
  images: string[];
  description: string;
  adoptionStatus: string;
}

interface FilterState {
  type: string;
  gender: string;
  breed: string;
  ageMin: number;
  ageMax: number;
  searchQuery: string;
}

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
    ageMin: 0,
    ageMax: 20,
    searchQuery: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      setIsAuthenticated(!!token);
    }
  }, []);

  // Fetch all pets initially
  useEffect(() => {
    const fetchPets = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/pets`);
        if (response.data.success) {
          setPets(response.data.pets);

          // Extract unique breeds for filtering
          const dogs = response.data.pets.filter(
            (pet: Pet) => pet.type.toLowerCase() === "dog"
          );
          const cats = response.data.pets.filter(
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
        console.error("Error fetching pets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, []);

  // Fetch filtered pets when filters change
  useEffect(() => {
    const fetchFilteredPets = async () => {
      setIsLoading(true);
      try {
        // Build query parameters based on filters
        const params = new URLSearchParams();

        if (filters.type !== "all") params.append("type", filters.type);
        if (filters.gender !== "all") params.append("gender", filters.gender);
        if (filters.breed !== "all") params.append("breed", filters.breed);
        if (filters.ageMin > 0)
          params.append("ageMin", filters.ageMin.toString());
        if (filters.ageMax < 20)
          params.append("ageMax", filters.ageMax.toString());
        if (filters.searchQuery)
          params.append("searchQuery", filters.searchQuery);

        const response = await axios.get(
          `${BASE_URL}/api/pets/filter?${params}`
        );

        if (response.data.success) {
          setPets(response.data.pets);
        }
      } catch (error: any) {
        console.error("Error fetching filtered pets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have changed filters (skip the initial render)
    if (Object.values(filters).some((value) => value !== "")) {
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
                              handleFilterChange("type", "all")
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
                            checked={filters.type === "Dog"}
                            onCheckedChange={() =>
                              handleFilterChange("type", "Dog")
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
                            checked={filters.type === "Cat"}
                            onCheckedChange={() =>
                              handleFilterChange("type", "Cat")
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
                          handleFilterChange("gender", value)
                        }
                      >
                        <SelectTrigger className="rounded-lg text-sm">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
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
                          handleFilterChange("breed", value)
                        }
                      >
                        <SelectTrigger className="rounded-lg text-sm">
                          <SelectValue placeholder="Select breed" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="all">All Breeds</SelectItem>
                          {filters.type === "Dog" || filters.type === "all"
                            ? dogBreeds.map((breed) => (
                                <SelectItem key={breed} value={breed}>
                                  {breed}
                                </SelectItem>
                              ))
                            : null}
                          {filters.type === "Cat" || filters.type === "all"
                            ? catBreeds.map((breed) => (
                                <SelectItem key={breed} value={breed}>
                                  {breed}
                                </SelectItem>
                              ))
                            : null}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Age Range Filter */}
                    <div>
                      <Label
                        htmlFor="age-range"
                        className="text-xs text-gray-500 mb-1 block"
                      >
                        Age Range (years)
                      </Label>
                      <div id="age-range" className="flex items-center gap-2">
                        <Input
                          id="age-min"
                          type="number"
                          min="0"
                          max="20"
                          value={filters.ageMin}
                          onChange={(e) =>
                            handleFilterChange(
                              "ageMin",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 rounded-lg text-sm"
                        />
                        <span className="text-xs">to</span>
                        <Input
                          id="age-max"
                          type="number"
                          min="0"
                          max="20"
                          value={filters.ageMax}
                          onChange={(e) =>
                            handleFilterChange(
                              "ageMax",
                              parseInt(e.target.value) || 20
                            )
                          }
                          className="w-16 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Pet Cards Grid - Right Side */}
            <div className="flex-1">
              {isLoading ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-600">Loading pets...</p>
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
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={
                              pet.images && pet.images.length > 0
                                ? pet.images[0]
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
                              {pet.breed}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {pet.gender}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 flex-grow">
                          <p className="text-sm text-gray-600">
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
                                // Navigate to pet details page
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
  );
}
