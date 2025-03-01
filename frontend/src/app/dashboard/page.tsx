"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <main className="min-h-screen pt-[60] bg-white">

      {/* Hero Section */}
      <div className="relative h-screen">

        {/* Background Image */}
        <div
          className="absolute inset-0 m-11 h-5/6 rounded-[70] "
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 rounded-[70]" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
          <motion.section
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold text-white mb-6"
            >
              Find Your <span className="text-orange-500">Pawfect</span>
              <br />
              Companion
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            >
              Give a loving pet a forever home. Browse, adopt, and make a
              difference today!
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-gray-900 rounded-full px-8 py-6 text-lg"
              >
                Start Your Journey
              </Button>
            </motion.div>
          </motion.section>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 -mt-40 mb-32 relative"
        >
          {[
            { number: "150+", label: "Partner Shelters" },
            { number: "1000+", label: "Pets Adopted" },
            { number: "24/7", label: "Support Available" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg text-center"
            >
              <h3 className="text-3xl font-bold text-orange-400 mb-2">
                {stat.number}
              </h3>
              <p className="text-gray-600 mt-6">{stat.label}</p>
            </div>
          ))}
        </motion.section>

        {/* Featured Pets */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Companions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                image:
                  "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
                name: "Max",
                type: "Golden Retriever",
                age: "2 years",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
                name: "Luna",
                type: "Siamese Cat",
                age: "1 year",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1573865526739-10659fec78a5",
                name: "Bella",
                type: "Labrador",
                age: "3 years",
              },
            ].map((pet, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm group cursor-pointer"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{pet.name}</h3>
                  <p className="text-gray-600">{pet.type}</p>
                  <p className="text-gray-400 text-sm">{pet.age}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Why Choose Us */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Easy Adoption Process",
                description:
                  "Simple and straightforward steps to bring your new friend home.",
              },
              {
                title: "Verified Partners",
                description:
                  "We work with trusted shelters and rescue organizations.",
              },
              {
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
                className="bg-white p-8 rounded-2xl shadow-sm"
              >
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {isAuthenticated ? <AuthNavigation /> : <Navigation />}
    </main>
  );
}
