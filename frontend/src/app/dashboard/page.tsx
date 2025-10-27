"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { Button } from "@/components/ui/dynamic-button";
import { Skeleton } from "@/components/ui/dynamic-skeleton";
import { motion } from "framer-motion";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import Loader from "@/components/Loader";
import DonateModal from "@/components/DonateModal";
import ContactModal from "@/components/ContactModal";
import { useVideoStream } from "@/context/VideoStreamContext";
import { Video, Calendar, Clock, Users, Play } from "lucide-react";
import { toast } from "react-toastify";
import Footer from "@/components/Footer";

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

interface Schedule {
  _id: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  createdBy: {
    fullname: string;
    email: string;
  };
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [featuredPets, setFeaturedPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"local" | "international">(
    "local"
  );
  const [donationForm, setDonationForm] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    amount: "",
    donationFor: "general",
    receiveUpdates: false,
    notRobot: false,
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { adminStream, isAdminStreaming, viewerCount } = useVideoStream();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);

    // Fetch featured pets
    const fetchPets = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/pets?limit=3`);
        if (response.data.success) {
          setFeaturedPets((response.data.pets || []).slice(0, 3)); // Only 3 pets
        }
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch upcoming schedules
    const fetchSchedules = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/schedules/upcoming`);
        if (response.data.success) {
          setSchedules(response.data.schedules.slice(0, 3)); // Show only 3 upcoming
        }
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        setSchedulesLoading(false);
      }
    };

    fetchPets();
    fetchSchedules();
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && adminStream) {
      videoRef.current.srcObject = adminStream;
    }
  }, [adminStream]);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${BASE_URL}/api/donations`, {
        name: donationForm.name,
        email: donationForm.email,
        mobileNumber: donationForm.mobileNumber,
        amount: donationForm.amount,
        donationFor: donationForm.donationFor,
        donationType: activeTab, // "local" or "international"
        receiveUpdates: donationForm.receiveUpdates,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Thank you for your donation!");
        setShowDonateModal(false);
        setDonationForm({
          name: "",
          mobileNumber: "",
          email: "",
          amount: "",
          donationFor: "general",
          receiveUpdates: false,
          notRobot: false,
        });
      } else {
        toast.error(response.data.message || "Failed to process donation");
      }
    } catch (error: any) {
      console.error("Error submitting donation:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit donation. Please try again."
      );
    }
  };

  return (
    <main className="min-h-screen pt-5 bg-white">
      {/* Donate Modal */}
      <DonateModal
        showDonateModal={showDonateModal}
        setShowDonateModal={setShowDonateModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        donationForm={donationForm}
        setDonationForm={setDonationForm}
        handleDonationSubmit={handleDonationSubmit}
      />

      {/* Contact Modal */}
      <ContactModal
        showContactModal={showContactModal}
        setShowContactModal={setShowContactModal}
      />

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

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                onClick={() => setShowDonateModal(true)}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all duration-300"
              >
                <i className="bi bi-heart-fill"></i>
                <span>Donate</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-8 py-6 text-lg border-2 border-orange-500/20 hover:bg-orange-500/5 flex items-center gap-2 transition-all duration-300"
                onClick={() => setShowContactModal(true)}
              >
                <i className="bi bi-info-circle"></i>
                <span>Get in Touch</span>
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

       {/* Live Stream Section */}
        <section className="mb-32 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-6 py-2 bg-red-500/10 rounded-full text-red-500 font-medium mb-4"
              >
                <Video className="w-4 h-4" />
                <span>Live Stream</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-foreground mb-4"
              >
                Watch Our Pets Live
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-muted-foreground max-w-2xl mb-12"
              >
                Join our live streams to see our adorable pets in action and interact with our community.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Live Stream Preview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg border border-orange-500/10 overflow-hidden"
              >
                <div className="relative aspect-video bg-black">
                  {isAdminStreaming && adminStream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
                        <Users className="w-4 h-4" />
                        <span>{viewerCount}</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <Video className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium mb-2">Stream is Offline</p>
                      <p className="text-sm text-gray-400">Check the schedule below for upcoming streams</p>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Pet Adoption Live Stream</h3>
                  <p className="text-gray-600 mb-4">
                    {isAdminStreaming
                      ? "Join us now to see our adorable pets looking for their forever homes!"
                      : "We're currently offline. Check back during scheduled times or view our upcoming schedule."}
                  </p>
                  <Button 
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.info("Please login to join the live stream");
                        router.push("/auth/login");
                      } else {
                        router.push("/live");
                      }
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isAdminStreaming ? "Join Live Stream" : "Go to Live Page"}
                  </Button>
                </div>
              </motion.div>

              {/* Upcoming Schedules */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg border border-orange-500/10 p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-semibold">Upcoming Streams</h3>
                </div>

                <div className="space-y-4">
                  {schedulesLoading ? (
                    [...Array(3)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))
                  ) : schedules.length > 0 ? (
                    schedules.map((schedule) => {
                      const scheduleDate = new Date(schedule.scheduledDate);
                      const isLive = schedule.status === "live";

                      return (
                        <div
                          key={schedule._id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isLive
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 hover:border-orange-500/30"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{schedule.title}</h4>
                            {isLive && (
                              <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{schedule.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{scheduleDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{schedule.duration} min</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No upcoming streams scheduled</p>
                      <p className="text-xs mt-1">Check back later for updates</p>
                    </div>
                  )}
                </div>

                {schedules.length > 0 && (
                  <Link href="/live" className="block mt-6">
                    <Button variant="outline" className="w-full rounded-xl border-2 border-orange-500/20 hover:bg-orange-500/5">
                      View All Schedules
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </section>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <style jsx global>{`
          :root {
            --d: 700ms;
            --e: cubic-bezier(0.19, 1, 0.22, 1);
          }

          .card-hover {
            position: relative;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
            padding: 1rem;
            width: 100%;
            min-height: 350px;
            text-align: center;
            color: whitesmoke;
            background-color: whitesmoke;
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1),
              0 2px 2px rgba(0, 0, 0, 0.1), 0 4px 4px rgba(0, 0, 0, 0.1),
              0 8px 8px rgba(0, 0, 0, 0.1), 0 16px 16px rgba(0, 0, 0, 0.1);
            border-radius: 1rem;
          }

          .card-hover:before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 110%;
            background-size: cover;
            background-position: center;
            transition: transform calc(var(--d) * 1.5) var(--e);
            pointer-events: none;
          }

          .card-hover:after {
            content: "";
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200%;
            pointer-events: none;
            background-image: linear-gradient(
              to bottom,
              hsla(0, 0%, 0%, 0) 0%,
              hsla(0, 0%, 0%, 0.009) 11.7%,
              hsla(0, 0%, 0%, 0.034) 22.1%,
              hsla(0, 0%, 0%, 0.072) 31.2%,
              hsla(0, 0%, 0%, 0.123) 39.4%,
              hsla(0, 0%, 0%, 0.182) 46.6%,
              hsla(0, 0%, 0%, 0.249) 53.1%,
              hsla(0, 0%, 0%, 0.32) 58.9%,
              hsla(0, 0%, 0%, 0.394) 64.3%,
              hsla(0, 0%, 0%, 0.468) 69.3%,
              hsla(0, 0%, 0%, 0.54) 74.1%,
              hsla(0, 0%, 0%, 0.607) 78.8%,
              hsla(0, 0%, 0%, 0.668) 83.6%,
              hsla(0, 0%, 0%, 0.721) 88.7%,
              hsla(0, 0%, 0%, 0.762) 94.1%,
              hsla(0, 0%, 0%, 0.79) 100%
            );
            transform: translateY(-50%);
            transition: transform calc(var(--d) * 2) var(--e);
          }

          .card-hover:nth-of-type(1):before {
            background-image: url(https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80);
          }

          .card-hover:nth-of-type(2):before {
            background-image: url(https://images.unsplash.com/photo-1601758177266-bc599de87707?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80);
          }

          .card-hover:nth-of-type(3):before {
            background-image: url(https://media.post.rvohealth.io/wp-content/uploads/sites/3/2020/02/322868_1100-732x549.jpg);
          }

          .card-content {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 1rem;
            transition: transform var(--d) var(--e);
            z-index: 1;
          }

          .card-hover:hover .card-content {
            transform: translateY(0);
          }

          .card-hover .card-content > * + * {
            margin-top: 1rem;
          }

          .card-title {
            font-size: 1.3rem;
            font-weight: bold;
            line-height: 1.2;
          }

          .card-copy {
            font-size: 1.125rem;
            font-style: italic;
            line-height: 1.35;
          }

          .card-icon-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 4rem;
            height: 4rem;
            margin-bottom: 1rem;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.2);
          }

          .card-icon {
            font-size: 2rem;
            color: white;
          }

          .card-hover .card-content {
            transform: translateY(calc(100% - 4.5rem));
          }

          .card-hover:hover:before {
            transform: scale(1.1);
          }

          .card-hover:hover:after {
            transform: translateY(0);
          }
        `}</style>
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
              className="card-hover"
            >
              <div className="card-content">
                <div className="card-icon-wrapper">
                  <i className={`${stat.icon} card-icon`}></i>
                </div>
                <h3 className="card-title text-white">{stat.number}</h3>
                <p className="text-lg font-semibold text-white mb-2">
                  {stat.label}
                </p>
                <p className="card-copy text-white/80">{stat.description}</p>
              </div>
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
                featuredPets.slice(0, 3).map((pet, index) => (
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
                          (pet as any).images &&
                          Array.isArray((pet as any).images) &&
                          (pet as any).images.length > 0 &&
                          (pet as any).images[0]?.url
                            ? (pet as any).images[0].url
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

            {/* Show "View all available pets" button below the grid */}
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
            </motion.div>
          </div>
        </section>

       
      
      </div>
      <Footer/>

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
