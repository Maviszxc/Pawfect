"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";

// Dynamically import FloatingBotDemo with SSR disabled
const FloatingBotDemo = dynamic(() => import("@/components/FloatingBotDemo"), {
  ssr: false,
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [featuredPets, setFeaturedPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);

    // Fetch featured pets
    const fetchPets = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/pets?limit=3`);
        if (response.data.success) {
          setFeaturedPets(response.data.pets || []);
        }
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  return (
    <main className="min-h-screen pt-5 bg-white">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-b from-background to-background/95">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        {/* Floating Bot Animation */}
        <div className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none">
          <FloatingBotDemo count={1} width={180} height={180} />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 h-24 w-24 rounded-full bg-orange-500/5 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 h-16 w-16 rounded-full bg-orange-500/5 blur-2xl"></div>

        {/* Main Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-6 py-2 bg-orange-500/10 rounded-full text-orange-500 font-medium mb-6"
            >
              <i className="bi bi-heart-fill text-sm"></i>
              <span>Find Your Perfect Match</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight"
            >
              Discover Your <br />
              <span className="text-orange-500">Furever</span> Friend
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground mb-8 max-w-2xl lg:max-w-xl"
            >
              Connect with loving pets waiting for their forever homes. Start
              your journey of companionship today.
            </motion.p>

            {/* Search bar removed and moved to navbar */}

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/adoption">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all duration-300"
                >
                  <i className="bi bi-search-heart"></i>
                  <span>Browse Pets</span>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-8 py-6 text-lg border-2 border-orange-500/20 hover:bg-orange-500/5 flex items-center gap-2 transition-all duration-300"
              >
                <i className="bi bi-info-circle"></i>
                <span>How It Works</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Content - Image */}
          <motion.div
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 max-w-[90%] mx-auto">
              <img
                src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80"
                alt="Happy pets"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Floating Stats Card */}
            <motion.div
              className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-orange-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <i className="bi bi-heart-fill text-2xl text-orange-500"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Successfully Adopted
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    1,000+ Pets
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Decorative Paw Prints */}
            <div className="absolute -top-10 -right-10 text-orange-500/20 text-4xl">
              <i className="bi bi-paw-fill"></i>
            </div>
            <div className="absolute top-1/4 -right-6 text-orange-500/20 text-2xl">
              <i className="bi bi-paw-fill"></i>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 py-24 relative"
        >
          {[
            {
              icon: "bi-house-heart",
              number: "150+",
              label: "Partner Shelters",
              description:
                "Trusted shelters and rescue centers across the country",
            },
            {
              icon: "bi-heart",
              number: "1000+",
              label: "Pets Adopted",
              description: "Happy pets finding their forever homes",
            },
            {
              icon: "bi-headset",
              number: "24/7",
              label: "Support Available",
              description: "Round-the-clock assistance for pet parents",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-white shadow-lg p-8 rounded-xl border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors duration-300"></div>
              <div className="h-16 w-16 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors duration-300">
                <i className={`${stat.icon} text-2xl text-orange-500`}></i>
              </div>
              <h3 className="text-4xl font-bold text-foreground mb-3">
                {stat.number}
              </h3>
              <p className="text-lg font-semibold text-foreground/90 mb-2">
                {stat.label}
              </p>
              <p className="text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* Featured Companions */}
        <section className="mb-32 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-6 py-2 bg-orange-500/10 rounded-full text-orange-500 font-medium mb-4"
              >
                <i className="bi bi-heart-fill text-sm"></i>
                <span>Meet Our Friends</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-foreground mb-4"
              >
                Featured Companions
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-muted-foreground max-w-2xl mb-12"
              >
                These adorable pets are looking for their forever homes. Each
                one has a unique personality and lots of love to give.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                // Loading skeletons
                [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-lg border border-orange-500/10"
                  >
                    <Skeleton className="h-56 w-full rounded-xl mb-5" />
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))
              ) : featuredPets.length > 0 ? (
                featuredPets.map((pet, index) => (
                  <motion.div
                    key={String(index)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className="bg-white p-6 rounded-xl shadow-lg border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 group overflow-hidden"
                  >
                    <div className="h-56 rounded-xl mb-5 relative overflow-hidden group-hover:shadow-md transition-all duration-300">
                      <img
                        src={
                          (pet as any).images && (pet as any).images.length > 0
                            ? (pet as any).images[0]
                            : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80"
                        }
                        alt={(pet as any).name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-orange-500">
                        <i className="bi-emoji-smile text-xl"></i>
                      </div>
                      <div className="absolute bottom-4 left-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium">
                        {(pet as any).type}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-1">
                      {(pet as any).name}
                    </h3>
                    <div className="flex items-center text-gray-500 mb-3">
                      <i className="bi bi-clock text-orange-500/70 mr-1.5"></i>
                      <span>{(pet as any).age} years</span>
                    </div>
                    <div className="flex items-center text-gray-500 mb-4">
                      <i className="bi bi-geo-alt text-orange-500/70 mr-1.5"></i>
                      <span>{(pet as any).breed}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="px-3 py-1 bg-orange-500/5 text-orange-500/80 rounded-full text-sm font-medium">
                        {(pet as any).gender}
                      </span>
                      <span className="px-3 py-1 bg-orange-500/5 text-orange-500/80 rounded-full text-sm font-medium">
                        {(pet as any).adoptionStatus}
                      </span>
                    </div>
                    <Link
                      href={`/pet?id=${(pet as any)._id}`}
                      className="block"
                    >
                      <button className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 flex items-center justify-center gap-2">
                        <span>View Details</span>
                      </button>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 text-center py-10">
                  <p className="text-gray-500">
                    No pets available at the moment. Check back soon!
                  </p>
                </div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                href="/adoption"
                className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors duration-200 font-medium"
              >
                <span>View all available pets</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-32 py-24 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-6 py-2 bg-orange-500/10 rounded-full text-orange-500 font-medium mb-4"
              >
                <i className="bi bi-check2-circle text-sm"></i>
                <span>Our Commitment</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-foreground mb-4"
              >
                Why Choose Pawfect
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-muted-foreground max-w-2xl mb-12"
              >
                We're dedicated to making the adoption process as smooth as
                possible, connecting loving pets with their perfect forever
                homes.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "bi-check2-all",
                  title: "Easy Adoption Process",
                  description:
                    "Simple and straightforward steps to bring your new friend home.",
                },
                {
                  icon: "bi-shield-check",
                  title: "Verified Partners",
                  description:
                    "We work with trusted shelters and rescue organizations.",
                },
                {
                  icon: "bi-headset",
                  title: "Post-Adoption Support",
                  description:
                    "Guidance and resources to ensure a smooth transition.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white p-8 rounded-xl shadow-lg border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 group"
                >
                  <div className="h-14 w-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:bg-orange-500/20 transition-colors duration-300">
                    <i className={`${item.icon} text-2xl text-orange-500`}></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 flex justify-center"
            >
              <Link
                href="/adoption"
                className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors duration-200"
              >
                <span className="font-medium">
                  Learn more about our adoption process
                </span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </motion.div>
          </div>
        </section>
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
