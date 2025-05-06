"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Heart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    window.location.href = "/auth/login";
  };

  const isActive = (path: string) => {
    return pathname.startsWith(path);
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
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: "Pet Management",
      path: "/admin/pets",
      icon: <PawPrint className="w-5 h-5" />,
    },
    {
      title: "Adoption Management",
      path: "/admin/adoptions",
      icon: <Heart className="w-5 h-5" />,
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
          className="rounded-full bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="h-10 w-10 rounded-md bg-purple-600 flex items-center justify-center mr-2">
              <svg
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 8L15 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 16L15 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M9 4L9 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M9 12L9 20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-xl font-bold">Admin</span>
          </div>

          <div className="px-4 mb-6">
            <div className="flex items-center bg-gray-100 rounded-lg p-2">
              <img
                src="/logors.png"
                alt="User"
                className="w-10 h-10 rounded-full"
              />
              <div className="ml-2">
                <div className="text-sm font-medium">Hi AC</div>
                <div className="text-xs text-gray-500">xyz@gmail.com</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                    isActive(item.path)
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`mr-3 ${
                      isActive(item.path)
                        ? "text-purple-700"
                        : "text-gray-400 group-hover:text-gray-500"
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center mr-2">
                  <PawPrint className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Paw Admin</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 h-0 overflow-y-auto pt-2 pb-4">
              <nav className="mt-2 px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all ${
                        isActive(item.path)
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`mr-3 ${
                          isActive(item.path)
                            ? "text-purple-700"
                            : "text-gray-400 group-hover:text-gray-500"
                        }`}
                      >
                        {item.icon}
                      </div>
                      {item.title}
                      {isActive(item.path) && (
                        <div className="ml-auto w-1.5 h-6 rounded-full bg-purple-600" />
                      )}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Button
                variant="ghost"
                className="flex items-center w-full text-gray-600 hover:bg-gray-100"
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
