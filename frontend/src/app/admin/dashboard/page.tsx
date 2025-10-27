"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Calendar,
  MoreHorizontal,
  Users,
  PawPrint,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

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
  images?: { url: string }[];
  isArchived?: boolean;
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
  isArchived?: boolean;
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

interface DashboardStats {
  totalPets: number;
  totalUsers: number;
  adoptedPets: number;
  pendingAdoptions: number;
  petTypes: { name: string; value: number }[];
  monthlyAdoptions: { name: string; adoptions: number }[];
}

// Chart options for different chart types
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        color: "#6b7280",
        font: {
          size: 12,
          family: "'Inter', sans-serif",
        },
      },
    },
    title: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#4f46e5",
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#6b7280",
        font: {
          size: 11,
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: "rgba(107, 114, 128, 0.1)",
        drawBorder: false,
      },
      ticks: {
        color: "#6b7280",
        font: {
          size: 11,
        },
        precision: 0,
      },
      border: {
        display: false,
      },
      beginAtZero: true,
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: "#fff",
      borderWidth: 2,
    },
  },
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        color: "#6b7280",
        font: {
          size: 12,
          family: "'Inter', sans-serif",
        },
      },
    },
    title: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#4f46e5",
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#6b7280",
        font: {
          size: 11,
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: "rgba(107, 114, 128, 0.1)",
        drawBorder: false,
      },
      ticks: {
        color: "#6b7280",
        font: {
          size: 11,
        },
        precision: 0,
      },
      border: {
        display: false,
      },
      beginAtZero: true,
    },
  },
  elements: {
    bar: {
      borderRadius: 6,
      borderSkipped: false,
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        color: "#6b7280",
        font: {
          size: 11,
          family: "'Inter', sans-serif",
        },
        boxWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "#4f46e5",
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  cutout: "65%",
};

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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPets: 0,
    totalUsers: 0,
    adoptedPets: 0,
    pendingAdoptions: 0,
    petTypes: [],
    monthlyAdoptions: [],
  });

  // Chart data states
  const [adoptionTrendsData, setAdoptionTrendsData] = useState<any>(null);
  const [applicationStatusData, setApplicationStatusData] = useState<any>(null);
  const [adoptionByPetTypeData, setAdoptionByPetTypeData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchDashboardStats();
  }, []);

  // Recalculate chart data when adoptions or dashboard stats change
  useEffect(() => {
    if (adoptions.length > 0 || dashboardStats.petTypes.length > 0) {
      prepareChartData();
    }
  }, [adoptions, dashboardStats]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      // Fetch pets (admin route) - exclude archived
      const petsResponse = await axiosInstance.get(
        `${BASE_URL}/api/pets/admin/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      if (petsResponse.data.success) {
        // Filter out archived pets for accurate count
        const activePets = petsResponse.data.pets.filter(
          (pet: Pet) => !pet.isArchived && pet.adoptionStatus?.toLowerCase() !== "archived"
        );
        setPets(activePets);
        const availablePets = activePets.filter(
          (pet: Pet) => pet.adoptionStatus?.toLowerCase() === "available"
        ).length;
        setStats((prev) => ({
          ...prev,
          totalPets: activePets.length,
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

      // Fetch adoptions with user and pet populated - exclude archived
      const adoptionsResponse = await axiosInstance.get(
        `${BASE_URL}/api/admin/adoptions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      if (adoptionsResponse.data.success) {
        // Filter out archived adoptions
        const activeAdoptions = adoptionsResponse.data.adoptions.filter(
          (adoption: Adoption) => !adoption.isArchived
        );
        setAdoptions(activeAdoptions);
        const pendingAdoptions = activeAdoptions.filter(
          (adoption: Adoption) => 
            adoption.status?.toLowerCase() === "pending" ||
            adoption.status === "Under Review"
        ).length;
        setStats((prev) => ({
          ...prev,
          totalAdoptions: activeAdoptions.length,
          pendingAdoptions,
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const statsResponse = await axiosInstance.get(
        `${BASE_URL}/api/admin/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );

      if (statsResponse.data.success) {
        const statsData = statsResponse.data.stats;
        setDashboardStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const prepareChartData = () => {
    console.log("Preparing chart data with adoptions:", adoptions.length);

    // Adoption Trends - Monthly Adoptions
    const monthlyAdoptionsData = {
      labels: dashboardStats.monthlyAdoptions.map((item) => item.name),
      datasets: [
        {
          label: "Completed Adoptions",
          data: dashboardStats.monthlyAdoptions.map((item) => item.adoptions),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#10b981",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    // Application Status - Calculate from adoptions (exclude archived, normalize status values)
    const statusCounts = {
      Approved: adoptions.filter((a) => 
        !a.isArchived && a.status?.toLowerCase() === "approved"
      ).length,
      Pending: adoptions.filter((a) => 
        !a.isArchived && (
          a.status?.toLowerCase() === "pending" || 
          a.status === "Under Review"
        )
      ).length,
      Rejected: adoptions.filter((a) => 
        !a.isArchived && a.status?.toLowerCase() === "rejected"
      ).length,
      Completed: adoptions.filter((a) => 
        !a.isArchived && a.status?.toLowerCase() === "completed"
      ).length,
    };

    console.log("Application status counts:", statusCounts);

    const applicationStatusChartData = {
      labels: ["Approved", "Pending", "Rejected", "Completed"],
      datasets: [
        {
          data: [
            statusCounts.Approved,
            statusCounts.Pending,
            statusCounts.Rejected,
            statusCounts.Completed,
          ],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(59, 130, 246, 0.8)",
          ],
          borderColor: ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"],
          borderWidth: 2,
        },
      ],
    };

    // Adoption by Pet Type
    const petTypeData = {
      labels: dashboardStats.petTypes.map((item) => item.name),
      datasets: [
        {
          label: "Pets by Type",
          data: dashboardStats.petTypes.map((item) => item.value),
          backgroundColor: [
            "rgba(139, 92, 246, 0.8)",
            "rgba(20, 184, 166, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
          ],
          borderColor: ["#8b5cf6", "#14b8a6", "#f97316", "#3b82f6", "#ec4899"],
          borderWidth: 1,
        },
      ],
    };

    setAdoptionTrendsData(monthlyAdoptionsData);
    setApplicationStatusData(applicationStatusChartData);
    setAdoptionByPetTypeData(petTypeData);
  };

  // Application Volume - Weekly data (sample data)
  const applicationVolumeData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Applications Received",
        data: [5, 7, 4, 6, 8, 9, 7], // This could be enhanced with real weekly data
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(59, 130, 246, 0.6)",
          "rgba(59, 130, 246, 0.5)",
          "rgba(59, 130, 246, 0.4)",
          "rgba(59, 130, 246, 0.3)",
          "rgba(59, 130, 246, 0.2)",
        ],
        borderColor: [
          "#3b82f6",
          "#3b82f6",
          "#3b82f6",
          "#3b82f6",
          "#3b82f6",
          "#3b82f6",
          "#3b82f6",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Get recent pets (last 4)
  const recentPets = pets.slice(0, 4);

  // Get recent users (last 4)
  const recentUsers = users.slice(0, 4);

  // Get recent adoptions (last 4)
  const recentAdoptions = adoptions.slice(0, 4);

  if (isLoading) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <Loader />
        </div>
      </AdminAuthWrapper>
    );
  }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6 px-0">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0a1629]">
                      {dashboardStats.totalPets}
                    </div>
                    <div className="text-gray-500 text-xs sm:text-sm">
                      Total Pets
                    </div>
                  </div>
                  <div className="bg-blue-50 p-2.5 sm:p-3 rounded-lg">
                    <PawPrint className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs sm:text-sm text-green-600">
                  {dashboardStats.adoptedPets} successfully adopted
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {dashboardStats.totalUsers}
                    </div>
                    <div className="text-gray-500 text-xs sm:text-sm">
                      Total Users
                    </div>
                  </div>
                  <div className="bg-green-50 p-2.5 sm:p-3 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs sm:text-sm text-blue-600">
                  {users.filter((u) => u.isAdmin).length} admin users
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {dashboardStats.pendingAdoptions}
                    </div>
                    <div className="text-gray-500 text-xs sm:text-sm">
                      Under Review
                    </div>
                  </div>
                  <div className="bg-orange-50 p-2.5 sm:p-3 rounded-lg">
                    <Heart className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs sm:text-sm text-yellow-600">
                  {stats.totalAdoptions} total transactions
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row: Recent Pets, Users, and Adoptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Recent Pets */}
            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  Recent Pets
                </div>
                {recentPets.length === 0 ? (
                  <div className="text-gray-500 text-center py-4 text-sm">
                    No pets found
                  </div>
                ) : (
                  recentPets.map((pet) => (
                    <div
                      key={pet._id}
                      className="border-t border-gray-100 pt-2.5 pb-2.5 first:border-0"
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
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {pet.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {pet.breed}
                          </div>
                        </div>
                        <Badge
                          className={
                            pet.adoptionStatus === "Available"
                              ? "bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : pet.adoptionStatus === "Pending"
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
                <div className="flex justify-end mt-3 sm:mt-4">
                  <button className="text-orange-500 text-xs sm:text-sm font-medium hover:text-orange-600">
                    View all pets →
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
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
                )}

                <div className="flex justify-end mt-4">
                  <button className="text-orange-500 text-sm font-medium hover:text-orange-600">
                    View all users →
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Adoptions */}
            <Card className="rounded-xl shadow-sm bg-orange-500 text-white border-0">
              <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                <div className="font-bold text-white text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
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
                            adoption.status === "Approved"
                              ? "bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : adoption.status === "Pending"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : adoption.status === "Completed"
                              ? "bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              : "bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-xs font-semibold"
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

            {/* Adoption Trends - Line Chart */}
            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
                  Adoption Trends
                </div>
                <div className="h-48 sm:h-64">
                  {adoptionTrendsData ? (
                    <Line
                      data={adoptionTrendsData}
                      options={lineChartOptions}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      Loading chart data...
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Monthly completed adoptions
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Volume - Bar Chart */}
          <Card className="rounded-xl shadow-sm bg-white border-0">
            <CardContent className="p-4 sm:p-5">
              <div className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
                Application Volume
              </div>
              <div className="h-48 sm:h-64">
                <Bar data={applicationVolumeData} options={barChartOptions} />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Daily applications received (sample data)
              </div>
            </CardContent>
          </Card>

          {/* Charts Section - 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Application Status - Doughnut Chart */}
            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
                  Application Status
                </div>
                <div className="h-48 sm:h-64">
                  {applicationStatusData ? (
                    <Doughnut
                      data={applicationStatusData}
                      options={doughnutOptions}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      Loading chart data...
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Distribution of application statuses
                </div>
              </CardContent>
            </Card>

            {/* Adoptions by Pet Type - Bar Chart */}
            <Card className="rounded-xl shadow-sm bg-white border-0">
              <CardContent className="p-4 sm:p-5">
                <div className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
                  Pets by Type
                </div>
                <div className="h-48 sm:h-64">
                  {adoptionByPetTypeData ? (
                    <Bar
                      data={adoptionByPetTypeData}
                      options={barChartOptions}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                      Loading chart data...
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Total pets by category
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}