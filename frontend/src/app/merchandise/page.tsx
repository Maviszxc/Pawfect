"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Messages() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-block relative">
            <span className="absolute -top-3 -left-6 w-12 h-12 rounded-full bg-orange-100 opacity-70"></span>
            <span className="absolute -bottom-3 -right-6 w-10 h-10 rounded-full bg-blue-100 opacity-70"></span>
            <h1 className="relative text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-2">
              Merchandise
            </h1>
          </div>
          <p className="text-gray-500 max-w-md mx-auto">Coming Soon</p>
        </motion.div>
      </div>
      {/* Floating About Button */}
      <Link
        href="/about"
        className="fixed bottom-8 right-8 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-40"
      >
        <i className="bi bi-info-circle text-xl"></i>
      </Link>
      {isAuthenticated ? <AuthNavigation /> : <Navigation />}
    </main>
  );
}
