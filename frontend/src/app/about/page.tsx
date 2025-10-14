"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";

export default function About() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    setIsAuthenticated(!!token);
  }, []);

  const stats = [
    { number: "500+", label: "Animals Rescued" },
    { number: "1000+", label: "Successful Adoptions" },
    { number: "50+", label: "Active Volunteers" },
    { number: "5", label: "Years of Service" },
  ];

  const values = [
    {
      icon: "❤️",
      title: "Compassion",
      description: "We treat every animal with the love and care they deserve",
    },
    {
      icon: "🤝",
      title: "Community",
      description: "Working together to create a better world for animals",
    },
    {
      icon: "🌱",
      title: "Sustainability",
      description: "Building long-term solutions for animal welfare",
    },
    {
      icon: "🔬",
      title: "Excellence",
      description: "Providing the highest standard of care and service",
    },
  ];

  const teamMembers = [
    {
      name: "Rina Ortiz",
      role: "Founder & President",
      description:
        "The heart and mind behind Biyaya Animal Care. Rina's passion for animal welfare has been the driving force behind our organization since its inception.",
      image: "./rina.png",
    },
    {
      name: "Our Veterinary Partners",
      role: "Medical Care Team",
      description:
        "A network of dedicated veterinary professionals who provide comprehensive medical care, spay/neuter services, and emergency treatment for all our rescued animals.",
      image: "./vet.png",
    },
    {
      name: "Our Dedicated Team",
      role: "Volunteers & Staff",
      description:
        "A group of compassionate individuals working tirelessly to make a difference in the lives of animals every day through rescue, rehabilitation, and adoption services.",
      image: "./staff.jpg",
    },
  ];

  const quickLinks = [
    { label: "Visit Us", href: "/visit" },
    { label: "Contact Us", href: "/contact" },
    { label: "Work With Us", href: "/careers" },
    { label: "Collaborate With Us", href: "/partnerships" },
    { label: "Answer Our Forms", href: "/forms" },
    { label: "Follow Us", href: "/social" },
  ];

  return (
    <><main className="min-h-screen ">
          {loading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
                  <Loader />
              </div>
          )}

          {/* Hero Section */}
          <section className="relative pt-32 pb-20 px-6 text-center ">
              <div className="max-w-4xl mx-auto">
                  <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                  >
                      <div className="inline-block relative mb-6">
                          <span className="absolute -top-4 -left-8 w-16 h-16 rounded-full bg-orange-100 opacity-60 animate-pulse"></span>
                          <span className="absolute -bottom-4 -right-8 w-14 h-14 rounded-full bg-blue-100 opacity-60 animate-pulse delay-1000"></span>
                          <h1 className="relative text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-4">
                              About Biyaya
                          </h1>
                      </div>
                      <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
                          We are a non-profit animal welfare organization dedicated to
                          rescuing, rehabilitating, and rehoming animals in need across the
                          Philippines.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Link
                              href="/adoption"
                              className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          >
                              Meet Our Animals
                          </Link>
                          <Link
                              href="/articles"
                              className="px-8 py-3 text-lg font-semibold text-orange-500 border border-orange-500 rounded-full hover:bg-orange-50 transition-all duration-300"
                          >
                              Read Our Stories
                          </Link>
                      </div>
                  </motion.div>
              </div>
          </section>

          {/* Quick Links Bar */}
          <section className="bg-white border-b border-gray-200">
              <div className="max-w-6xl mx-auto px-6 py-4">
                  <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                      {quickLinks.map((link, index) => (
                          <motion.div
                              key={link.href}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                          >
                              <Link
                                  href={link.href}
                                  className="text-gray-700 hover:text-orange-500 font-medium text-sm transition-colors duration-200"
                              >
                                  {link.label}
                              </Link>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </section>

          {/* Brand Section */}
          <section className="py-12 m-5 rounded-2xl bg-gradient-to-r from-orange-500 to-blue-600">
              <div className="max-w-4xl mx-auto text-center px-6">
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                  >
                      <h2 className="text-2xl font-bold text-white mb-4">
                          Biyaya Animal Care | Biyaya Animal Sanctuary | Pawshoppe By Biyaya
                      </h2>
                      <Link
                          href="/donate"
                          className="inline-block px-8 py-3 text-lg font-bold text-orange-500 bg-white rounded-full hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
                      >
                          Donate
                      </Link>
                  </motion.div>
              </div>
          </section>

          {/* Stats Section */}
          <section className="py-16 bg-white">
              <div className="max-w-6xl mx-auto px-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                      {stats.map((stat, index) => (
                          <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="text-center"
                          >
                              <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-2">
                                  {stat.number}
                              </div>
                              <div className="text-gray-600 font-medium">{stat.label}</div>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </section>

          {/* Mission & Vision Section */}
          <section className="py-20 bg-gray-50">
              <div className="max-w-6xl mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-12">
                      <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden"
                      >
                          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-blue-600"></div>
                          <div className="text-4xl mb-4">🎯</div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-4">
                              Our Mission
                          </h2>
                          <p className="text-gray-600 text-lg leading-relaxed">
                              Biyaya Animal Sanctuary is devoted to providing compassionate
                              care, rescue, and rehabilitation for animals in need, while
                              promoting animal welfare through education, community
                              engagement, and sustainable solutions.
                          </p>
                      </motion.div>

                      <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden"
                      >
                          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-orange-500"></div>
                          <div className="text-4xl mb-4">🌟</div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-4">
                              Our Vision
                          </h2>
                          <p className="text-gray-600 text-lg leading-relaxed">
                              A Philippines where every stray animal finds compassion, care,
                              and a loving home. We envision communities where humans and
                              animals coexist in harmony, and animal welfare is a fundamental
                              value shared by all.
                          </p>
                      </motion.div>
                  </div>
              </div>
          </section>

          {/* Team Section */}
          <section className="py-20 bg-white">
              <div className="max-w-6xl mx-auto px-6">
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-16"
                  >
                      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-4">
                          Meet Our Team
                      </h2>
                      <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                          The passionate individuals behind Biyaya's mission to create a
                          better world for animals
                      </p>
                  </motion.div>

                  <div className="space-y-16">
                      {teamMembers.map((member, index) => (
                          <motion.div
                              key={member.name}
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.2 }}
                              className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 items-center bg-gradient-to-br from-orange-50 to-blue-50 rounded-3xl p-8 shadow-lg`}
                          >
                              {/* Team Member Image */}
                              <div className="lg:w-2/5">
                                  <div className="w-full h-64 rounded-2xl overflow-hidden shadow-lg">
                                      <img
                                          src={member.image}
                                          alt={member.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                              e.currentTarget.src = "/placeholder-team.jpg";
                                          }}
                                      />
                                  </div>
                              </div>

                              {/* Text Content */}
                              <div className="lg:w-3/5 text-center lg:text-left">
                                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                      {member.name}
                                  </h3>
                                  <p className="text-orange-500 text-xl font-semibold mb-4">
                                      {member.role}
                                  </p>
                                  <p className="text-gray-600 text-lg leading-relaxed">
                                      {member.description}
                                  </p>
                              </div>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </section>

          {/* Values Section */}
          <section className="py-20 ">
              <div className="max-w-6xl mx-auto px-6">
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mb-16"
                  >
                      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-4">
                          Our Values
                      </h2>
                      <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                          These core principles guide everything we do at Biyaya Animal Care
                      </p>
                  </motion.div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {values.map((value, index) => (
                          <motion.div
                              key={value.title}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="text-center p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-b from-white to-gray-50 border border-gray-100"
                          >
                              <div className="text-4xl mb-4">{value.icon}</div>
                              <h3 className="text-xl font-bold text-gray-800 mb-3">
                                  {value.title}
                              </h3>
                              <p className="text-gray-600 leading-relaxed">
                                  {value.description}
                              </p>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-orange-500 to-blue-600">
              <div className="max-w-4xl mx-auto text-center px-6">
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                  >
                      <h2 className="text-3xl font-bold text-white mb-6">
                          Join Us in Making a Difference
                      </h2>
                      <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
                          Whether through adoption, volunteering, or donations, your support
                          helps us continue our mission of creating a better world for
                          animals.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Link
                              href="/adoption"
                              className="px-8 py-3 text-lg font-semibold text-orange-500 bg-white rounded-full hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
                          >
                              Adopt a Friend
                          </Link>
                          <Link
                              href="/donate"
                              className="px-8 py-3 text-lg font-semibold text-white border border-white rounded-full hover:bg-white hover:text-orange-500 transition-all duration-300"
                          >
                              Donate Now
                          </Link>
                      </div>
                  </motion.div>
              </div>
          </section>

          {isAuthenticated ? <AuthNavigation /> : <Navigation />}
      </main>
      <Footer /></>
  );
}
