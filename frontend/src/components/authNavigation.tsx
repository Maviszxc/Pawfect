"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// Toast imports removed
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Adoption", href: "/adoption" },
  { label: "Articles", href: "/articles" },
  { label: "Merchandise", href: "/merchandise" },
];

export default function AuthNavigation() {
  const pathname = usePathname();
  const [profilePicture, setProfilePicture] = useState("");
  const [activeTab, setActiveTab] = useState("");
  
  // Set active tab based on pathname when component mounts
  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await axios.get(`${BASE_URL}/api/users/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && res.data.user.profilePicture) {
          setProfilePicture(res.data.user.profilePicture);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <nav className="fixed py-6 px-10 top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">

      <div className="container mx-auto flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          key="logo"
        >
          <Link href="/" className="flex items-center gap-2">
            <img src="/biyaya.png" alt="Pawfect" className="h-12" />
          </Link>
        </motion.div>

        <ul className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.li 
                  key={item.href}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="relative px-1 py-2 text-gray-800 hover:text-gray-600 transition-colors duration-200 group"
                    onClick={() => setActiveTab(item.href)}
                  >
                    <span
                      className={`${isActive ? "font-medium text-orange-500" : ""}`}
                    >
                      {item.label}
                    </span>
                    <motion.span 
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500"
                      initial={false}
                      animate={{ scaleX: isActive ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.li>
              );
            })}
        </ul>

        <div className="flex items-center gap-5">
          {/* FAQs icon */}
          <Link
            href="/faqs"
            className="text-gray-600 hover:text-orange-500 transition-colors"
          >
            <i className="bi bi-question-circle text-lg"></i>
          </Link>

          {/* Search Icon */}
          <div className="relative group">
            <button className="text-gray-600 hover:text-orange-500 transition-colors">
              <i className="bi bi-search text-lg"></i>
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Search pets..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <i className="bi bi-search text-gray-400 text-sm"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile picture */}
          <Link href="/profile" className="relative">
            {profilePicture ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-500/20 hover:border-orange-500/50 transition-all duration-300">
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/20 hover:border-orange-500/50 transition-all duration-300">
                <i className="bi bi-person text-orange-500"></i>
              </div>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
