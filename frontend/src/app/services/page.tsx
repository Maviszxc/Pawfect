"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Services() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
  }, []);

  const services = [
    {
      title: "Animal Rescue & Rehabilitation",
      description:
        "Rescue, medical care, and rehabilitation for abused, neglected, and homeless animals.",
      icon: "🐾",
    },
    {
      title: "Veterinary Services",
      description:
        "Complete veterinary care including check-ups, vaccinations, spay/neuter, and emergency treatments.",
      icon: "💉",
    },
    {
      title: "Adoption Programs",
      description:
        "Finding loving forever homes for rescued animals through our thorough adoption process.",
      icon: "🏠",
    },
    {
      title: "Animal Welfare Education",
      description:
        "Community education programs promoting responsible pet ownership and animal welfare.",
      icon: "📚",
    },
    {
      title: "Spay & Neuter Campaigns",
      description:
        "Affordable spay/neuter services to control pet population and prevent strays.",
      icon: "✂️",
    },
    {
      title: "Rabies Prevention",
      description:
        "Vaccination drives and education to support a #StrayFreeRabiesFreePhilippines by 2030.",
      icon: "🦠",
    },
  ];

  const branches = [
    {
      name: "Mandala Branch - Metro Manila",
      address: "312 Mandala Park, Shaw Boulevard, Pleasant Hills, Mandaluyong",
      phone: "+63 917 543 3444",
      description:
        "Our flagship 24/7 veterinary hospital offering comprehensive care for dogs and cats.",
      services: [
        "24/7 Dog and Cat Hospital",
        "Digital Radiography & Ultrasound",
        "Diagnostic Testing",
        "Dental Care",
        "Emergency Care (starting at ₱1,500)",
        "Behavioral Consultations",
      ],
    },
    {
      name: "Katarungan Branch - Mandaluyong",
      address: "873 Katarungan St., Mandaluyong City",
      phone: "+63 917 543 3444",
      description:
        "Known for affordable spay/neuter services and compassionate care for rescued animals.",
      services: [
        "Low-Cost Spay & Neuter",
        "Vaccinations",
        "Basic Veterinary Care",
        "Stray Animal Support",
        "Quick Recovery Procedures",
      ],
    },
    {
      name: "Rockwell Branch - Makati",
      address: "4th Floor, South Joya Loft Towers, Plaza Dr, Rockwell, Makati",
      phone: "+63 917 137 1157",
      description:
        "Our premium care center serving the Makati area with advanced veterinary services.",
      services: [
        "Complete Veterinary Care",
        "Preventive Medicine",
        "Orthopedic Surgery",
        "Soft Tissue Surgery",
        "Veterinary Dentistry",
      ],
    },
    {
      name: "Alfonso Branch - Cavite",
      address: "Perea St. Purok 4, Bgy. Palumlum, Alfonso, Cavite",
      phone: "+63 917 543 3444",
      description:
        "Serving the Cavite area with basic care and community outreach programs.",
      services: [
        "Basic Veterinary Care",
        "Vaccination Programs",
        "Community Education",
        "Affordable Treatments",
        "Spay & Neuter Services",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-block relative">
            <span className="absolute -top-3 -left-6 w-12 h-12 rounded-full bg-orange-100 opacity-70"></span>
            <span className="absolute -bottom-3 -right-6 w-10 h-10 rounded-full bg-blue-100 opacity-70"></span>
            <h1 className="relative text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-2">
              Our Services
            </h1>
          </div>
          <p className="text-gray-500 max-w-md mx-auto">
            At our animal care center, we're committed to the welfare of all
            animals through these comprehensive services.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="text-4xl">{service.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-700 font-medium mb-4">
            Working towards a better future for all animals through our
            #AlagangBiyaya campaign
          </p>
          <p className="text-orange-600 font-bold">
            #StrayFreeRabiesFreePhilippines by 2030
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Branches
          </h2>

          <p className="text-lg text-gray-600 mb-10 text-center max-w-3xl mx-auto">
            Visit any of our branches for quality veterinary care. We also offer
            mobile clinic services that travel to different communities for free
            spay/neuter events.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {branches.map((branch, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {branch.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-1">{branch.address}</p>
                  <p className="text-gray-600 mb-4">{branch.phone}</p>

                  <p className="text-gray-700 mb-4 italic">
                    {branch.description}
                  </p>

                  <h4 className="font-medium text-gray-800 mb-2">
                    Services Offered:
                  </h4>
                  <ul className="list-disc pl-5 text-gray-600">
                    {branch.services.map((service, i) => (
                      <li key={i}>{service}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
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
