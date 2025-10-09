"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Search,
  LayoutGrid,
  List,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";

interface UserType {
  _id: string;
  fullname?: string;
  name?: string;
  email: string;
  role?: string;
  profilePicture?: string;
}

const AdminHeader = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [dateString, setDateString] = useState<string>("");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await axios.get(`${BASE_URL}/api/users/current-user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data.user || response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();

    // Fix hydration error: only set date on client
    const now = new Date();
    setDateString(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/auth/login";
  };

  return (
    <div className="w-full px-4 py-6 flex justify-center">
      <div className="w-full max-w-6xl flex flex-wrap md:flex-nowrap items-center bg-white rounded-2xl shadow px-4 sm:px-6 py-4 gap-4 md:space-x-6">
        {/* Date at the very right */}
        <div className="w-full md:flex-1 flex justify-between items-center gap-2 md:gap-8">
          <div className="flex items-center text-gray-600 text-sm md:text-base font-medium">
            {dateString}
          </div>
          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-10 w-10 rounded-full md:justify-end  hover:bg-orange-100 transition-colors duration-150"
                style={{ transition: "background 0.15s" }}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.profilePicture || "/placeholder-user.png"}
                  />
                  <AvatarFallback>
                    {user?.fullname?.[0] || user?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              <DropdownMenuLabel>
                {user?.fullname || user?.name || "User"}
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = "/admin/profile")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
