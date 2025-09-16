"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Calendar,
  MoreHorizontal,
  Users,
  PawPrint,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";

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
  images?: { url: string }[]; // <-- update type
}

interface User {
  _id: string;
  fullname: string;
  email: string;
  profilePicture?: string;
  verified: boolean;
  isAdmin: boolean;
  createdAt: string;
}

interface Adoption {
  fullname: string | undefined;
  _id: string;
  adopterName: string;
  adopterEmail: string;
  petName: string;
  petImage?: string;
  status: string;
  createdAt: string;
  user?: {
    _id: string;
    fullname: string;
    email: string;
    profilePicture?: string;
  };
  pet?: {
    name?: string;
    images?: { url: string }[];
    [key: string]: any;
  };
}

// Sample data for productivity chart
const productivityData = [
  { name: "Mon", Adoptions: 2, Applications: 5 },
  { name: "Tue", Adoptions: 3, Applications: 7 },
  { name: "Wed", Adoptions: 2, Applications: 4 },
  { name: "Thu", Adoptions: 4, Applications: 6 },
  { name: "Fri", Adoptions: 3, Applications: 8 },
  { name: "Sat", Adoptions: 5, Applications: 9 },
  { name: "Sun", Adoptions: 4, Applications: 7 },
];

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [stats, setStats] = useState({
    totalPets: 0,
    totalUsers: 0,
    totalAdoptions: 0,
    availablePets: 0,
    pendingAdoptions: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      // Fetch pets (admin route)
      const petsResponse = await axiosInstance.get(
        `${BASE_URL}/api/pets/admin/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      if (petsResponse.data.success) {
        setPets(petsResponse.data.pets);
        const availablePets = petsResponse.data.pets.filter(
          (pet: Pet) => pet.adoptionStatus === "available"
        ).length;
        setStats((prev) => ({
          ...prev,
          totalPets: petsResponse.data.pets.length,
          availablePets,
        }));
      }

      // Fetch users
      const usersResponse = await axiosInstance.get(
        `${BASE_URL}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
        setStats((prev) => ({
          ...prev,
          totalUsers: usersResponse.data.users.length,
        }));
      }

      // Fetch adoptions with user and pet populated
      const adoptionsResponse = await axiosInstance.get(
        `${BASE_URL}/api/admin/adoptions?populate=user,pet`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      if (adoptionsResponse.data.success) {
        setAdoptions(adoptionsResponse.data.adoptions);
        const pendingAdoptions = adoptionsResponse.data.adoptions.filter(
          (adoption: Adoption) => adoption.status === "pending"
        ).length;
        setStats((prev) => ({
          ...prev,
          totalAdoptions: adoptionsResponse.data.adoptions.length,
          pendingAdoptions,
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get recent pets (last 4)
  const recentPets = pets.slice(0, 4);

  // Get recent users (last 4)
  const recentUsers = users.slice(0, 4);

  // Get recent adoptions (last 4)
  const recentAdoptions = adoptions.slice(0, 4);

  // if (isLoading) {
  //   return (
  //     <AdminAuthWrapper>
  //       <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
  //         <Loader />
  //       </div>
  //     </AdminAuthWrapper>
  //   );
  // }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-[#f8fafc] pb-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="rounded-2xl shadow bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0a1629]">
                      {stats.totalPets}
                    </div>
                    <div className="text-gray-500 text-sm">Total Pets</div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <PawPrint className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-600">
                  {stats.availablePets} available for adoption
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0a1629]">
                      {stats.totalUsers}
                    </div>
                    <div className="text-gray-500 text-sm">Total Users</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-blue-600">
                  {users.filter((u) => u.isAdmin).length} admin users
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0a1629]">
                      {stats.totalAdoptions}
                    </div>
                    <div className="text-gray-500 text-sm">Total Adoptions</div>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-yellow-600">
                  {stats.pendingAdoptions} pending requests
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adoption Activity Chart */}
          <Card className="rounded-2xl shadow bg-white">
            <CardContent className="p-8">
              <div className="font-bold text-lg text-[#0a1629] mb-2">
                Adoption Activity
              </div>
              <div className="flex flex-row items-center gap-8">
                <div className="flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={productivityData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="Adoptions"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Applications"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#2563eb]" />
                    <span className="text-sm text-gray-700">Adoptions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#7c3aed]" />
                    <span className="text-sm text-gray-700">Applications</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Data updates every 3 hours
              </div>
            </CardContent>
          </Card>

          {/* Bottom row: Recent Pets, Users, and Adoptions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recent Pets */}
            <Card className="rounded-2xl shadow bg-white">
              <CardContent className="p-6">
                <div className="font-bold text-lg text-[#0a1629] mb-4 flex items-center gap-2">
                  Recent Pets
                </div>
                {recentPets.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No pets found
                  </div>
                ) : (
                  recentPets.map((pet) => (
                    <div
                      key={pet._id}
                      className="border-t border-gray-100 pt-3 pb-3 first:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={
                              pet.images &&
                              pet.images.length > 0 &&
                              pet.images[0].url
                                ? pet.images[0].url
                                : "/placeholder-pet.jpg"
                            }
                          />
                          <AvatarFallback>
                            {pet.name && pet.name.length > 0 ? pet.name[0] : ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-[#0a1629]">
                            {pet.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pet.breed}
                          </div>
                        </div>
                        <Badge
                          className={
                            pet.adoptionStatus === "available"
                              ? "bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : pet.adoptionStatus === "pending"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : "bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                          }
                        >
                          {pet.adoptionStatus}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex justify-end mt-4">
                  <button className="text-orange-500 text-sm font-medium hover:text-orange-600">
                    View all pets →
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className="rounded-2xl shadow bg-white">
              <CardContent className="p-6">
                <div className="font-bold text-lg text-[#0a1629] mb-4 flex items-center gap-2">
                  Recent Users
                </div>
                {recentUsers.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No users found
                  </div>
                ) : (
                  recentUsers.map((user) => (
                    <div
                      key={user._id}
                      className="border-t border-gray-100 pt-3 pb-3 first:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user.profilePicture || "/placeholder-user.png"}
                          />
                          <AvatarFallback>
                            {user.fullname && user.fullname.length > 0
                              ? user.fullname[0]
                              : ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-[#0a1629]">
                            {user.fullname}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        {user.isAdmin ? (
                          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                            Admin
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                            User
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                 ) }

                <div className="flex justify-end mt-4">
                  <button className="text-orange-500 text-sm font-medium hover:text-orange-600">
                    View all users →
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Adoptions */}
            <Card className="rounded-2xl shadow bg-orange-500 text-white">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  Recent Adoptions
                </div>
                {recentAdoptions.length === 0 ? (
                  <div className="text-black text-center py-4">
                    No adoptions found
                  </div>
                ) : (
                  recentAdoptions.map((adoption) => (
                    <div
                      key={adoption._id}
                      className="bg-white rounded-xl p-4 text-[#0a1629] shadow mb-3"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {/* Pet Avatar */}
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              adoption.pet?.images &&
                              adoption.pet.images.length > 0 &&
                              adoption.pet.images[0]?.url
                                ? adoption.pet.images[0]?.url
                                : "/placeholder-pet.jpg"
                            }
                            alt={
                              adoption.pet?.name || adoption.petName || "Pet"
                            }
                          />
                          <AvatarFallback>
                            {(adoption.pet?.name || adoption.petName || "P")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            {adoption.pet?.name || adoption.petName}
                          </div>
                          <div>
                            <div className="font-light text-xs text-gray-600">
                              by:&nbsp;
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
                        <Badge
                          className={
                            adoption.status === "approved"
                              ? "bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : adoption.status === "pending"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : "bg-red-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                          }
                        >
                          {adoption.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(adoption.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
                <div className="flex justify-end mt-auto pt-4">
                  <button className="text-white text-sm font-medium hover:text-orange-200">
                    View all adoptions →
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
