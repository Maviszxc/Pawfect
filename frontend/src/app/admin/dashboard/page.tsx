"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/dynamic-card";
import { Button } from "@/components/ui/button";
// Toast imports removed
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPets: 0,
    totalUsers: 0,
    adoptedPets: 0,
    pendingAdoptions: 0,
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Using the correct endpoint with authentication
      const token = localStorage.getItem("accessToken");
      const response = await axiosInstance.get(`${BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Use mock data for demonstration if API fails
      setStats({
        totalPets: 2478,
        totalUsers: 983,
        adoptedPets: 1256,
        pendingAdoptions: 652,
      });
    }
  };

  // Sample data for charts
  const petTypeData = [
    { name: "Dogs", value: 12 },
    { name: "Cats", value: 8 },
    { name: "Birds", value: 2 },
    { name: "Others", value: 2 },
  ];

  const adoptionData = [
    { name: "Jan", adoptions: 2 },
    { name: "Feb", adoptions: 3 },
    { name: "Mar", adoptions: 1 },
    { name: "Apr", adoptions: 4 },
    { name: "May", adoptions: 2 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <AdminAuthWrapper>
      <div className="container mx-auto p-4 pt-20">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage pets, users, and adoption requests
            </p>
          </div>

          <Tabs
            defaultValue="overview"
            className="space-y-4"
            onValueChange={setActiveTab}
          >
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-purple-600 text-white overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Invoices
                    </CardTitle>
                    <div className="rounded-full bg-white/20 p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPets}</div>
                    <p className="text-xs text-white/70">Total Invoices</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-500 text-white overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Paid Invoices
                    </CardTitle>
                    <div className="rounded-full bg-white/20 p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-white/70">Paid Invoices</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500 text-white overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Unpaid Invoices
                    </CardTitle>
                    <div className="rounded-full bg-white/20 p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h.01M12 12h.01M16 12h.01" />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.adoptedPets}
                    </div>
                    <p className="text-xs text-white/70">Unpaid Invoices</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-600 to-pink-500 text-white overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Invoices Sent
                    </CardTitle>
                    <div className="rounded-full bg-white/20 p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                      </svg>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.pendingAdoptions}
                    </div>
                    <p className="text-xs text-white/70">Total Invoices Sent</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Card's Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit prius olor
                        </p>
                      </div>
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200">
                        <svg
                          className="h-6 w-6 text-gray-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Account", value: 20 },
                                { name: "Services", value: 40 },
                                { name: "Restaurant", value: 15 },
                                { name: "Others", value: 15 },
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#8884d8" />
                              <Cell fill="#82ca9d" />
                              <Cell fill="#FFBB28" />
                              <Cell fill="#FF8042" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-purple-600 mr-2"></div>
                          <span className="text-sm">Account</span>
                          <span className="ml-auto text-sm font-medium">
                            20%
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Services</span>
                          <span className="ml-auto text-sm font-medium">
                            40%
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span className="text-sm">Restaurant</span>
                          <span className="ml-auto text-sm font-medium">
                            15%
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
                          <span className="text-sm">Others</span>
                          <span className="ml-auto text-sm font-medium">
                            15%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Wallet Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-purple-600 text-white p-4 rounded-lg relative">
                        <div className="absolute right-4 top-4 bottom-4 flex flex-col justify-between items-center bg-white bg-opacity-20 rounded-md px-2">
                          <button className="text-white p-1">↑</button>
                          <span className="text-xs font-medium transform -rotate-90">
                            Change
                          </span>
                          <button className="text-white p-1">↓</button>
                        </div>
                        <div className="flex items-center mb-2">
                          <div className="flex space-x-1">
                            <div className="h-6 w-6 rounded-full bg-gray-300"></div>
                            <div className="h-6 w-6 rounded-full bg-gray-400 -ml-2"></div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold mb-2">
                          $824,571.93
                        </div>
                        <div className="text-sm">Wallet Balance</div>
                        <div className="text-xs mt-4">+0.8% than last week</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Activity</CardTitle>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Income</span>
                          <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Quick Transfer</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Activity</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                      <span className="text-sm font-medium">Income</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">
                        Activity data will be displayed here
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Quick Transfer</CardTitle>
                    <Button variant="ghost" size="icon">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        ></path>
                      </svg>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">
                        Quick transfer interface will be implemented here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pet Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <p className="text-muted-foreground mb-4">
                      Pet management interface will be implemented here
                    </p>
                    <Button
                      onClick={() => router.push("/admin/pets/add")}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Add New Pet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">
                      User management interface will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adoptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adoption Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">
                      Adoption management interface will be implemented here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
