"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
  href: "/auth/login",
  bgColor: "",
};

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed mb-11 top-6 left-1/2 mr-auto -translate-x-1/2  bg-black backdrop-blur-lg rounded-full px-8 py-3 shadow-lg flex items-center justify-between w-[90%] max-w-[800px]">
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
                    } transform transition-transform  duration-200 group-hover:scale-110 ${
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
      <div className="ml-auto">
        <Link
          href={profileItem.href}
          className="relative flex flex-col items-center group"
        >
          <span className="relative">
            {pathname === profileItem.href && (
              <motion.span
                layoutId="bubble"
                className="absolute -inset-1 rounded-full -z-10 shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                profileItem.bgColor
              } transform transition-transform bg-gray-300 duration-200 group-hover:scale-110 ${
                pathname === profileItem.href ? "scale-100" : ""
              }`}
            >
              <div className="flex items-center gap-6 pl-5 pr-3 bg-white mr-10 rounded-3xl p-2 shadow-md">
                <i className={`${profileItem.icon} text-2xl text-black`}></i>
                <span className="font-semibold">LOGIN</span>
              </div>
            </div>
          </span>
        </Link>
      </div>
    </nav>
  );
}
