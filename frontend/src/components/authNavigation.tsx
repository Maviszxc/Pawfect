"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";

const navItems = [
  {
    icon: "bi-house-heart-fill",
    label: "Home",
    href: "/",
    bgColor: "",
  },
  {
    icon: "bi-heart-fill",
    label: "Favorites",
    href: "/favorites",
    bgColor: "",
  },
  {
    icon: "bi-hearts",
    label: "Adopt",
    href: "/adopt",
    bgColor: "",
  },
  {
    icon: "bi-chat-heart-fill",
    label: "Messages",
    href: "/messages",
    bgColor: "",
  },
  {
    icon: "bi-calendar2-fill",
    label: "Form",
    href: "/form",
    bgColor: "",
  },
];

const logoItem = {
  icon: "bi-circle-fill",
  label: "Logo",
  href: "/",
  bgColor: "",
};

const profileItem = {
  icon: "bi-person-heart",
  label: "Profile",
  href: "/profile",
  bgColor: "",
};

export default function AuthNavigation() {
  const pathname = usePathname();
  const [profilePicture, setProfilePicture] = useState("");
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
    <nav className="fixed mb-11 top-6 left-1/2 mr-auto -translate-x-1/2 bg-black backdrop-blur-lg rounded-full px-8 py-3 shadow-lg flex items-center justify-between w-[90%] max-w-[800px]">
      <ToastContainer />
      <div className="mr-auto">
        <Link
          href={logoItem.href}
          className="relative flex flex-col items-center group"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <i className={`${logoItem.icon} text-2xl text-white`}></i>
            {logoItem.label}
          </div>
        </Link>
      </div>
      <ul className="flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="relative flex flex-col items-center group"
              >
                <span className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="bubble"
                      className="absolute -inset-1 bg-grey-300 rounded-full -z-10 shadow-sm"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.bgColor
                    } transform transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "scale-110 bg-gray-500 animate-bounce" : ""
                    }`}
                  >
                    <i className={`${item.icon} text-2xl text-white`}></i>
                  </div>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="ml-auto relative flex flex-col items-center group">
        <Link
          href={profileItem.href}
          className="relative flex flex-col items-center group"
        >
          <span className="relative">
            {pathname === profileItem.href && (
              <motion.span
                layoutId="bubble"
                className="absolute -inset-1 bg-gray-500 rounded-full -z-10 shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                profileItem.bgColor
              } transform transition-transform duration-200 group-hover:scale-110 ${
                pathname === profileItem.href ? "scale-100" : ""
              }`}
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log("Profile image failed to load");
                    e.currentTarget.style.display = "none";
                    const icon = document.createElement("i");
                    icon.className = `${profileItem.icon} text-2xl text-white`;
                    e.currentTarget.parentElement?.appendChild(icon);
                  }}
                />
              ) : (
                <i className={`${profileItem.icon} text-2xl text-white`}></i>
              )}
            </div>
          </span>
        </Link>
      </div>
    </nav>
  );
}
