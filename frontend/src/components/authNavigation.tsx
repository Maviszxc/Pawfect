"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Video } from "lucide-react";
import { BASE_URL } from "@/utils/constants";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Adoption", href: "/adoption" },
  { label: "Articles", href: "/articles" },
  { label: "Merchandise", href: "/merchandise" },
  { label: "Live", href: "/pet/live" },
];

export default function AuthNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const res = await axios.get(`${BASE_URL}/api/users/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setIsAuthenticated(true);
          if (res.data.user.profilePicture) {
            setProfilePicture(res.data.user.profilePicture);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleNavItemClick = (href: string) => {
    if (href === "/pet/live" && !isAuthenticated) {
      router.push("/login");
      return;
    }

    setActiveTab(href);
    setMobileMenuOpen(false);
    router.push(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed py-4 sm:py-6 px-4 sm:px-10 top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          key="logo"
        >
          <Link href="/" className="flex items-center gap-2">
            <img src="/biyaya.png" alt="Biyaya" className="h-12" />
          </Link>
        </motion.div>

        <ul className="hidden md:flex items-center space-x-4 lg:space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <motion.li
                key={item.href}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <button
                  className="relative px-1 py-2 text-gray-800 hover:text-orange-600 transition-colors duration-200 group flex items-center gap-1"
                  onClick={() => handleNavItemClick(item.href)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label === "Live" && (
                    <Video className="w-4 h-4 text-red-500" />
                  )}
                  <span className={isActive ? "font-medium text-orange-500" : ""}>
                    {item.label}
                  </span>
                  <span
                    className={`
                      absolute bottom-0 left-0 w-full h-0.5 bg-orange-500
                      transition-transform duration-300 origin-left
                      ${isActive ? "scale-x-100" : "scale-x-0"}
                      group-hover:scale-x-100
                    `}
                  />
                </button>
              </motion.li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-600 hover:text-orange-500 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* FAQs icon */}
          <Link
            href="/faqs"
            className="text-gray-600 hover:text-orange-500 transition-colors hidden sm:block"
            aria-label="FAQs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Link>

          {/* Search Icon
          <div className="relative group">
            <button
              className="text-gray-600 hover:text-orange-500 transition-colors"
              aria-label="Search"
              onClick={() => document.getElementById("search-input")?.focus()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <input
                      id="search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Search pets..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div> */}

          {/* Profile picture */}
          {isLoading ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 animate-pulse"></div>
          ) : (
            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              className="relative"
              aria-label={isAuthenticated ? "Profile" : "Login"}
            >
              {profilePicture ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-orange-500/20 hover:border-orange-500/50 transition-all duration-300">
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/20 hover:border-orange-500/50 transition-all duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ul className="py-3 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.li
                  key={item.href}
                  whileTap={{ scale: 0.98 }}
                  className="my-1"
                >
                  <button
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 ${
                      isActive
                        ? "bg-orange-50 text-orange-500"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleNavItemClick(item.href)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label === "Live" && (
                      <Video className="w-4 h-4 text-red-500" />
                    )}
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    )}
                  </button>
                </motion.li>
              );
            })}
            <li className="mt-3 pt-3 border-t border-gray-100">
              <Link
                href="/faqs"
                className=" sm:hidden py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                FAQs
              </Link>
            </li>
          </ul>
        </motion.div>
      )}
    </nav>
  );
}
  