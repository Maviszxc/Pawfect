"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Services",
    href: "/services",
  },
  {
    label: "Adoption",
    href: "/adoption",
  },
  {
    label: "Articles",
    href: "/articles",
  },
  {
    label: "Merchandise",
    href: "/merchandise",
  },
];

const logoItem = {
  label: "Biyaya",
  href: "/",
};

const profileItem = {
  label: "Login",
  href: "/auth/login",
};

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  
  // Set active tab based on pathname when component mounts
  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  return (
    <nav className="fixed py-6 px-10 top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto flex items-center justify-between">
        <Link href={logoItem.href} className="flex items-center gap-2">
          <img src="/biyaya.png" alt="Pawfect" className="h-12" />
        </Link>

        {/* Desktop Navigation */}
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
                  <span className={`${isActive ? "font-medium text-orange-500" : ""}`}>
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i
            className={`bi-${mobileMenuOpen ? "x-lg" : "list"} text-gray-800`}
          ></i>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white py-4 px-6 z-20 border-b border-gray-100">
            <ul className="flex flex-col space-y-4">
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
                      className="block py-2 relative group"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setActiveTab(item.href);
                      }}
                    >
                      <span
                        className={`${
                          isActive ? "font-medium text-orange-500" : "text-gray-800"
                        }`}
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
              <li className="pt-2">
                <Link
                  href={profileItem.href}
                  className="inline-block bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-xl transition-colors mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="font-medium text-white">
                    {profileItem.label}
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/faqs"
            className="text-gray-800 hover:text-orange-500 transition-colors"
          >
            <i className="bi bi-question-circle text-xl"></i>
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

          <Link
            href={profileItem.href}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded-xl transition-colors"
          >
            <span className="font-medium text-white">{profileItem.label}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
