"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  FileText,
  Heart,
  X,
  Menu,
  LogOut,
  Users,
  PawPrint,
  HeartHandshake,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Card } from "./ui/card";
import axiosInstance from "@/lib/axiosInstance";

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{
    fullname: string;
    email: string;
    profilePicture?: string;
  } | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axiosInstance.get("/api/users/current-user");
        // The backend returns { success: true, user: { ... } }
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      }
    };
    fetchCurrentUser();
  }, []);

  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/auth/login";
  };

  const menuItems = [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: "Users",
      path: "/admin/users",
      icon: <Users className="w-5 h-5" />, // More appropriate for users
    },
    {
      title: "Pets",
      path: "/admin/pets",
      icon: <PawPrint className="w-5 h-5" />, // More appropriate for pets
    },
    {
      title: "Adoptions",
      path: "/admin/adoptions",
      icon: <HeartHandshake className="w-5 h-5" />, // Better represents adoptions
    },
    {
      title: "Live",
      path: "/admin/live",
      icon: <Video className="w-5 h-5" />, // Video icon for live streaming
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-full bg-white shadow-sm border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden md:flex flex-col fixed top-2 left-3 z-20 w-60 lg:w-64 h-[92vh] bg-white rounded-2xl shadow-lg m-4 p-5 overflow-y-auto">
        {/* Logo */}
        <div className="flex justify-center items-center mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            key="logo"
          >
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <img src="/biyaya.png" alt="Pawfect" className="h-12" />
            </Link>
          </motion.div>
        </div>

        {/* Menu */}
        <nav className="flex-1 flex flex-col gap-3">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path} className="block">
              <div
                className={`flex items-center px-4 py-3 rounded-xl font-medium text-[15px] transition ${
                  isActive(item.path)
                    ? "bg-orange-500 text-white"
                    : "text-gray-700 hover:bg-orange-100"
                }`}
              >
                <span
                  className={`mr-3 ${
                    isActive(item.path)
                      ? "text-white"
                      : "text-gray-400 group-hover:text-[#0a1629]"
                  }`}
                >
                  {item.icon}
                </span>
                {item.title}
              </div>
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <div className="mt-auto flex flex-col items-center pt-8 pb-6">
          <Avatar className="h-14 w-14 mb-2">
            <AvatarImage
              src={user?.profilePicture || "/placeholder-user.png"}
              alt={user?.fullname || "User"}
            />
            <AvatarFallback>
              {user?.fullname ? user.fullname[0] : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-base font-semibold text-[#0a1629]">
            {user?.fullname || "User"}
          </div>
          <div className="text-xs text-gray-500">
            {user?.email || "user@email.com"}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 flex md:hidden"
        >
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-[#f8fafc] rounded-r-2xl shadow-lg">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
              <div className="flex items-center">
                <img src="/biyaya.png" alt="Pawfect" className="h-10" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-full hover:bg-orange-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pt-5 pb-4">
              <div className="px-6 mb-6">
                <Card className="p-3 border-0 shadow-sm bg-white rounded-xl">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user?.profilePicture || "/placeholder-user.png"}
                        alt={user?.fullname || "User"}
                      />
                      <AvatarFallback className="bg-gray-100">
                        {user?.fullname ? user.fullname[0] : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-black">
                        {user?.fullname || "User"}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[180px]">
                        {user?.email || "user@email.com"}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <nav className="mt-2 px-4 space-y-2">
                {menuItems.map((item) => (
                  <Link key={item.path} href={item.path} className="block">
                    <div
                      className={`group flex items-center px-4 py-3 text-[15px] font-medium rounded-xl transition-all ${
                        isActive(item.path)
                          ? "bg-orange-500 text-white"
                          : "text-gray-700 hover:bg-orange-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`mr-3 ${
                          isActive(item.path)
                            ? "text-white"
                            : "text-gray-400 group-hover:text-[#0a1629]"
                        }`}
                      >
                        {item.icon}
                      </div>
                      {item.title}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-100 p-4">
              <Button
                variant="ghost"
                className="flex items-center w-full text-gray-600 hover:bg-gray-100 justify-start rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default AdminSidebar;
