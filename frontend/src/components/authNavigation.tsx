"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Video, PawPrint } from "lucide-react";
import { BASE_URL } from "@/utils/constants";

interface NavItem {
  label: string;
  href: string;
}

interface Adoption {
  _id: string;
  pet: {
    _id: string;
    name: string;
    type: string;
    breed: string;
    age: string;
    gender: string;
    images: { url: string }[];
    description: string;
  };
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  fullname: string;
  email: string;
  phone: string;
  address: string;
  message: string;
  adminMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Adoption", href: "/adoption" },
  { label: "Articles", href: "/articles" },
  { label: "Merchandise", href: "/merchandise" },
  { label: "Live", href: "/live" },
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
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [showAdoptionsDropdown, setShowAdoptionsDropdown] =
    useState<boolean>(false);
  const [adoptionsLoading, setAdoptionsLoading] = useState<boolean>(false);

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
          // Fetch user adoptions after authentication
          fetchUserAdoptions(token);
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

  const fetchUserAdoptions = async (token: string) => {
    try {
      setAdoptionsLoading(true);

      if (!BASE_URL || !token) {
        setAdoptions([]);
        return;
      }

      // Try /my endpoint first
      const res = await axios.get(`${BASE_URL}/api/adoptions/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (res.data && res.data.success && Array.isArray(res.data.adoptions)) {
        setAdoptions(formatAdoptionData(res.data.adoptions));
        return;
      } else {
        throw new Error("Invalid /my endpoint response");
      }
    } catch (err: any) {
      // Fallback to /user endpoint
      try {
        const res = await axios.get(`${BASE_URL}/api/adoptions/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });

        if (res.data && res.data.success && Array.isArray(res.data.adoptions)) {
          setAdoptions(formatAdoptionData(res.data.adoptions));
          return;
        } else {
          setAdoptions([]);
        }
      } catch (fallbackErr: any) {
        setAdoptions([]);
      }
    } finally {
      setAdoptionsLoading(false);
    }
  };

  const formatAdoptionData = (adoptions: any[]): Adoption[] => {
    if (!adoptions || !Array.isArray(adoptions)) {
      return [];
    }

    return adoptions.map((adoption, index) => {
      let petData = adoption.pet;

      if (!petData || typeof petData === "string") {
        petData = {
          _id: adoption.pet || `unknown-pet-${index}`,
          name: "Unknown Pet",
          type: "Pet",
          breed: "Unknown Breed",
          age: "Unknown",
          gender: "Unknown",
          images: [],
          description: "No description available",
        };
      }

      return {
        _id: adoption._id || `temp-${Date.now()}-${index}`,
        pet: {
          _id: petData._id || "unknown",
          name: petData.name || "Unknown Pet",
          type: petData.type || "Pet",
          breed: petData.breed || "Mixed Breed",
          age: petData.age || "Unknown",
          gender: petData.gender || "Unknown",
          images: petData.images || [],
          description: petData.description || "No description available",
        },
        status: adoption.status || "Pending",
        fullname: adoption.fullname || "Unknown",
        email: adoption.email || "Unknown",
        phone: adoption.phone || "Not provided",
        address: adoption.address || "Not provided",
        message: adoption.message || "No message provided",
        adminMessage: adoption.adminMessage,
        createdAt: adoption.createdAt || new Date().toISOString(),
        updatedAt: adoption.updatedAt || new Date().toISOString(),
      };
    });
  };

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

  const handlePetClick = (petId: string) => {
    setShowAdoptionsDropdown(false);
    setMobileMenuOpen(false);
    router.push(`/pet?id=${petId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-green-600";
      case "Rejected":
        return "text-red-600";
      case "Completed":
        return "text-blue-600";
      case "Pending":
      default:
        return "text-yellow-600";
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
                  <span
                    className={isActive ? "font-medium text-orange-500" : ""}
                  >
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
          {/* My Adoptions Dropdown */}
          {isAuthenticated && (
            <div className="relative group">
              <button
                className="relative text-gray-600 hover:text-orange-500 transition-colors p-2"
                aria-label="My Adoptions"
                onClick={() => setShowAdoptionsDropdown(!showAdoptionsDropdown)}
              >
                <PawPrint size={20} />
                {adoptions.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {adoptions.length}
                  </span>
                )}
              </button>

              {/* Adoptions Dropdown */}
              {showAdoptionsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <PawPrint size={16} />
                      My Adoption Applications
                      {adoptions.length > 0 && (
                        <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                          {adoptions.length}
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {adoptionsLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="text-gray-500 text-sm mt-2">Loading...</p>
                      </div>
                    ) : adoptions.length === 0 ? (
                      <div className="p-6 text-center">
                        <PawPrint
                          className="mx-auto text-gray-300 mb-2"
                          size={32}
                        />
                        <p className="text-gray-500 text-sm">
                          No adoption applications yet
                        </p>
                        <button
                          onClick={() => {
                            setShowAdoptionsDropdown(false);
                            router.push("/adoption");
                          }}
                          className="mt-3 text-orange-500 text-sm hover:text-orange-600"
                        >
                          Browse Pets
                        </button>
                      </div>
                    ) : (
                      <div className="p-2">
                        {adoptions.slice(0, 5).map((adoption) => (
                          <motion.div
                            key={adoption._id}
                            whileHover={{ scale: 1.02 }}
                            className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-orange-100 transition-all mb-2"
                            onClick={() => handlePetClick(adoption.pet._id)}
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={
                                  adoption.pet.images[0]?.url ||
                                  "/placeholder-pet.jpg"
                                }
                                alt={adoption.pet.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder-pet.jpg";
                                  e.currentTarget.onerror = null;
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">
                                    {adoption.pet.name}
                                  </h4>
                                  <span
                                    className={`text-xs font-medium ${getStatusColor(
                                      adoption.status
                                    )} flex-shrink-0 ml-2`}
                                  >
                                    {adoption.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {adoption.pet.breed} • {adoption.pet.age}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Applied:{" "}
                                  {new Date(
                                    adoption.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {adoptions.length > 5 && (
                          <button
                            onClick={() => {
                              setShowAdoptionsDropdown(false);
                              router.push("/profile");
                            }}
                            className="w-full text-center text-orange-500 text-sm py-2 hover:text-orange-600 transition-colors"
                          >
                            View all {adoptions.length} applications
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

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

            {/* My Adoptions in Mobile Menu */}
            {isAuthenticated && (
              <motion.li whileTap={{ scale: 0.98 }} className="my-1">
                <button
                  className="w-full text-left py-2 px-3 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/profile");
                  }}
                >
                  <PawPrint size={16} className="text-orange-500" />
                  <span>My Adoptions</span>
                  {adoptions.length > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {adoptions.length}
                    </span>
                  )}
                </button>
              </motion.li>
            )}

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
