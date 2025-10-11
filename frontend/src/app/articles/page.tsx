"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";

export default function Articles() {
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
    <><main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
              Articles
            </h1>
          </div>
          <p className="text-gray-600 max-w-lg mx-auto mb-8">
            Discover helpful guides, stories, and resources about animal care,
            rescue stories, and how you can make a difference.
          </p>
        </motion.div>
      </section>

      {/* Featured Articles Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">
          Featured Articles
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Advancing a Nation: Biyaya's Drive Towards a #StrayFreeRabiesFreePhilippines2035",
              description: "See how your support transforms lives every day",
              img: "/article-cover.jpg",
              link: "https://www.biyaya.ph/post/advancing-a-nation-biyayas-heartfelt-drive-towards-a-strayfreerabiesfreephilippines2035",
            },
            {
              title: "Your Impact in Action: A Day at Biyaya Animal Sanctuary",
              description: "Looking ahead with Dr. Joden Sumeldan",
              img: "/article-cover3.jpeg",
              link: "https://www.biyaya.ph/post/your-impact-in-action-a-day-at-biyaya-animal-sanctuary",
            },
            {
              title: "Meet Rina Ortiz: The Heart and Mind Behind Biyaya Animal Care",
              description: "Discover the inspiring story of our founder",
              img: "/article-cover2.jpeg",
              link: "https://www.biyaya.ph/post/a-life-devoted-to-animal-welfare---get-to-know-biyayas-president",
            },
          ].map((article, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
            >
              {/* Article Image - Consistent format for all images */}
              <div className="w-full h-48 bg-gray-50 overflow-hidden">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-full object-cover" />
              </div>
              <div className="p-6 text-center flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold mb-3 text-xl">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{article.description}</p>
                </div>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition font-medium"
                >
                  Read More
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="bg-orange-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-center mb-8">
            More Content Coming Soon!
          </h2>
          <div className="max-w-2xl mx-auto text-gray-600">
            <p className="mb-6">
              We're working hard to bring you more educational content, rescue
              updates, and helpful resources for animal lovers and caregivers.
            </p>
            <div className="grid gap-6 md:grid-cols-2 text-center">
              <div>
                <h3 className="font-semibold mb-2">📚 Educational Guides</h3>
                <p className="text-gray-600">
                  Learn about animal behavior, health, and care
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">❤️ Rescue Updates</h3>
                <p className="text-gray-600">
                  Follow the journeys of animals we rescue
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16">
        <a
          href="https://www.biyaya.ph/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-orange-500 to-blue-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
        >
          Explore More on Biyaya.ph
        </a>
      </section>

      {/* Floating About Button */}
      <Link
        href="/about"
        className="fixed bottom-8 right-8 w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-40"
      >
        <i className="bi bi-info-circle text-xl"></i>
      </Link>

      {isAuthenticated ? <AuthNavigation /> : <Navigation />}
    </main><Footer /></>
  );
}
