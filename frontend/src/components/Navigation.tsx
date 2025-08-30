"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

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
];

const profileItem = {
  label: "Login",
  href: "/auth/login",
};

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Set active tab based on pathname when component mounts
  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery.trim());
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed py-4 sm:py-6 px-4 sm:px-10 top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/biyaya.png" alt="Biyaya" className="h-12" />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center space-x-4 lg:space-x-8">
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
                    className={`${
                      isActive ? "font-medium text-orange-500" : ""
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
        </ul>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Mobile Menu Button */}
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

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/faqs"
              className="text-gray-600 hover:text-orange-500 transition-colors"
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

            {/* Search Icon */}
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
            </div>

            <Link
              href={profileItem.href}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-1 rounded-xl transition-colors"
            >
              <span className="font-medium text-white text-sm">
                {profileItem.label}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
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
                  <Link
                    href={item.href}
                    className={`w-full text-left py-2 px-3 rounded-lg flex items-center ${
                      isActive
                        ? "bg-orange-50 text-orange-500"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setActiveTab(item.href);
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    )}
                  </Link>
                </motion.li>
              );
            })}
            <li className="mt-3 pt-3 border-t border-gray-100">
              <Link
                href="/faqs"
                className="block py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2"
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
            <li className="mt-2">
              <Link
                href={profileItem.href}
                className="block w-full bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl transition-colors text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="font-medium text-white">
                  {profileItem.label}
                </span>
              </Link>
            </li>
          </ul>
        </motion.div>
      )}
    </nav>
  );
}
