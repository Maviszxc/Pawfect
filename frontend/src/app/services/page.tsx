"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaw,
  faSyringe,
  faHome,
  faBook,
  faCut,
  faVirus,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";

export default function Services() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    // If you have async data fetching, set loading true/false accordingly
  }, []);

  const services = [
    {
      title: "Animal Rescue & Rehabilitation",
      description:
        "Rescue, medical care, and rehabilitation<br/>for abused, neglected, and homeless animals.",
      icon: "🐾",
    },
    {
      title: "Veterinary Services",
      description:
        "Complete veterinary care including check-ups<br/>vaccinations, spay/neuter, and emergency treatments.",
      icon: "💉",
    },
    {
      title: "Adoption Programs",
      description:
        "Finding loving forever homes for rescued animals<br/>through our thorough adoption process.",
      icon: "🏠",
    },
    {
      title: "Animal Welfare Education",
      description:
        "Community education programs promoting<br/>responsible pet ownership and animal welfare.",
      icon: "📚",
    },
    {
      title: "Spay & Neuter Campaigns",
      description:
        "Affordable spay/neuter services to control<br/>pet population and prevent strays.",
      icon: "✂️",
    },
    {
      title: "Rabies Prevention",
      description:
        "Vaccination drives and education to support<br/>#StrayFreeRabiesFreePhilippines by 2030.",
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

  // Map service icons to FontAwesome icons
  const getServiceIcon = (icon: string) => {
    switch (icon) {
      case "🐾":
        return faPaw;
      case "💉":
        return faSyringe;
      case "🏠":
        return faHome;
      case "📚":
        return faBook;
      case "✂️":
        return faCut;
      case "🦠":
        return faVirus;
      default:
        return faPaw;
    }
  };

  // Service background images
  const serviceImages = [
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2064&q=80",
    "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2060&q=80",
    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1886&q=80",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white-50 to-white">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
          <Loader />
        </div>
      )}

      <style jsx global>{`
        .options {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          min-width: 700px;
          max-width: 1100px;
          width: calc(100% - 80px);
          height: 500px;
          margin: 0 auto;
        }

        @media screen and (max-width: 818px) {
          .options {
            min-width: 620px;
          }
          .options .option:nth-child(5) {
            display: none;
          }
        }

        @media screen and (max-width: 738px) {
          .options {
            min-width: 540px;
          }
          .options .option:nth-child(4) {
            display: none;
          }
        }

        @media screen and (max-width: 658px) {
          .options {
            min-width: 460px;
          }
          .options .option:nth-child(3) {
            display: none;
          }
        }

        @media screen and (max-width: 578px) {
          .options {
            min-width: 380px;
          }
          .options .option:nth-child(2) {
            display: none;
          }
        }

        .option {
          position: relative;
          overflow: hidden;
          min-width: 60px;
          margin: 10px;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95);
          flex-grow: 1;
          border-radius: 16px;
          box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .option.active {
          flex-grow: 10;
          transform: scale(1);
          max-width: 600px;
          margin: 0px;
          border-radius: 16px;
          background-size: cover;
          background-position: center;
        }

        .option.active .shadow {
          box-shadow: inset 0 -120px 120px -120px black,
            inset 0 -120px 120px -100px black;
        }

        .option.active .label {
          bottom: 20px;
          left: 20px;
        }

        .option.active .label .info > div {
          left: 0px;
          opacity: 1;
        }

        .option:not(.active) {
          flex-grow: 1;
          border-radius: 16px;
        }

        .option:not(.active) .shadow {
          bottom: -40px;
          box-shadow: inset 0 -120px 0px -120px black,
            inset 0 -120px 0px -100px black;
        }

        .option:not(.active) .label {
          bottom: 10px;
          left: 10px;
        }

        .option:not(.active) .label .info > div {
          left: 20px;
          opacity: 0;
        }

        .option .shadow {
          position: absolute;
          bottom: 0px;
          left: 0px;
          right: 0px;
          height: 500px;
          transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95);
        }

        .option .label {
          display: flex;
          position: absolute;
          right: 0px;
          height: 40px;
          transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95);
        }

        .option .label .icon {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          min-width: 40px;
          max-width: 40px;
          height: 40px;
          border-radius: 100%;
          background-color: white;
          color: var(--defaultBackground);
        }

        .option .label .info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-left: 10px;
          color: white;
          white-space: pre;
        }

        .option .label .info > div {
          position: relative;
          transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95),
            opacity 0.5s ease-out;
        }

        .option .label .info .main {
          font-weight: bold;
          font-size: 1.2rem;
        }

        .option .label .info .sub {
          transition-delay: 0.1s;
          max-width: 300px;
          line-height: 1.4;
          margin-top: 5px;
          white-space: normal;
        }

        .option.active .shadow {
          box-shadow: inset 0 -150px 150px -120px rgba(0, 0, 0, 0.9),
            inset 0 -150px 150px -100px rgba(0, 0, 0, 0.8);
        }

        .option.active .label {
          bottom: 40px;
          left: 20px;
          height: auto;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-block relative">
            <span className="absolute -top-3 -left-6 w-12 h-12 rounded-full bg-orange-100 opacity-70"></span>
            <span className="absolute -bottom-3 -right-6 w-10 h-10 rounded-full bg-blue-100 opacity-70"></span>
            <h1 className="relative text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-blue-600 mb-2">
              Our Services
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="options">
            {services.map((service, index) => (
              <div
                key={index}
                className={`option ${index === 0 ? "active" : ""}`}
                style={
                  {
                    backgroundImage: `url(${serviceImages[index]})`,
                    "--defaultBackground": index === 0 ? "#ED5565" : "#ED5565",
                  } as React.CSSProperties
                }
                onClick={(e) => {
                  // Remove active class from all options
                  document.querySelectorAll(".option").forEach((option) => {
                    option.classList.remove("active");
                  });
                  // Add active class to clicked option
                  e.currentTarget.classList.add("active");
                }}
              >
                <div className="shadow"></div>
                <div className="label">
                  <div className="icon">
                    <FontAwesomeIcon icon={getServiceIcon(service.icon)} />
                  </div>
                  <div className="info">
                    <div className="main">{service.title}</div>
                    <div
                      className="sub"
                      dangerouslySetInnerHTML={{ __html: service.description }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
      <Footer />

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
