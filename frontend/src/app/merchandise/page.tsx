"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";

export default function Merchandise() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    setIsAuthenticated(!!token);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
            <Loader />
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center pt-36 pb-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-block relative mb-4">
              <span className="absolute -top-3 -left-6 w-12 h-12 rounded-full bg-orange-100 opacity-70"></span>
              <span className="absolute -bottom-3 -right-6 w-10 h-10 rounded-full bg-blue-100 opacity-70"></span>
              <h1 className="relative text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600">
                Merchandise
              </h1>
            </div>
            <p className="text-gray-600 max-w-lg mx-auto mb-8">
              Support Biyaya by purchasing official merchandise! Every item you
              buy helps rescued animals and supports the sanctuary.
            </p>
          </motion.div>
        </section>

        {/* Featured Products (static sample cards that link to Shopee) */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">
            Featured Items
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Biyaya T-Shirt", img: "/t-shirt.png" },
              { title: "Eco Tote Bag", img: "/tote-bag.png" },
              { title: "Sticker Pack", img: "/stickers-.png" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                {/* Image container - different treatment for stickers only */}
                <div className="w-full h-80 bg-gray-50 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className={`w-full h-full ${
                      item.title === "Sticker Pack"
                        ? "object-scale-down"
                        : "object-cover"
                    }`}
                  />
                </div>
                <div className="p-6 text-center flex-grow flex flex-col justify-between">
                  <h3 className="font-semibold mb-4 text-xl">{item.title}</h3>
                  <a
                    href="https://shopee.ph/biyayaanimalcaremerchandise"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition text-lg font-medium"
                  >
                    Shop Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Support Us Section */}
        <section className="bg-orange-50 py-16 px-6">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Buy Biyaya Merch?
          </h2>
          <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3 text-center">
            <div>
              <h3 className="font-semibold mb-2">🐾 Helps Animals</h3>
              <p className="text-gray-600">
                Proceeds support rescued and sheltered animals at Biyaya.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🌱 Eco-Friendly</h3>
              <p className="text-gray-600">
                We promote sustainable and cruelty-free products.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💖 Spread Awareness</h3>
              <p className="text-gray-600">
                Wearing merch helps share Biyaya's mission everywhere you go.
              </p>
            </div>
          </div>
        </section>

        {isAuthenticated ? <AuthNavigation /> : <Navigation />}
      </main>
      {/* Floating About Button */}
      <Link
        href="/about"
        className="fixed bottom-8 right-8 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-40"
      >
        <i className="bi bi-info-circle text-xl"></i>
      </Link>
      <Footer />
    </>
  );
}
