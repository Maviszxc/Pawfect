"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axios from "axios";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { BASE_URL } from "@/utils/constants";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Edit,
  Lock,
  Camera,
  ArrowLeft,
  LogOut,
  Trash2,
  Settings,
  PawPrint,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  MapPin,
  Phone,
  MessageSquare,
  Calendar,
  Save,
  X,
} from "lucide-react";

interface Adoption {
  _id: string;
  pet: {
    _id: string;
    name: string;
    type: string;
    breed: string;
    age: string;
    gender: string;
    images: { url: string }[];
    description: string;
  };
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  fullname: string;
  email: string;
  phone: string;
  address: string;
  message: string;
  adminMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  fullname: string;
  email: string;
  password: string;
  newEmail: string;
  profilePicture: string;
  isAdmin: boolean;
}

type AdoptionStatus = "All" | "Pending" | "Approved" | "Rejected" | "Completed";

export default function Profile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    fullname: "",
    email: "",
    password: "",
    newEmail: "",
    profilePicture: "",
    isAdmin: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [tempFormData, setTempFormData] = useState<UserData>({
    fullname: "",
    email: "",
    password: "",
    newEmail: "",
    profilePicture: "",
    isAdmin: false,
  });
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [view, setView] = useState<
    | "main"
    | "account"
    | "verifyEmail"
    | "verifyPassword"
    | "updateEmail"
    | "updatePassword"
    | "settings"
  >("main");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [sidebarView, setSidebarView] = useState<"profile" | "adoptions">(
    "profile"
  );
  const [refreshingAdoptions, setRefreshingAdoptions] = useState(false);
  const [adoptionStatusFilter, setAdoptionStatusFilter] =
    useState<AdoptionStatus>("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    if (!token) {
      router.push("/auth/login");
    } else {
      fetchUserData(token);
      fetchUserAdoptions(token);
    }
  }, [router]);

  const fetchUserAdoptions = async (token: string) => {
    try {
      setRefreshingAdoptions(true);

      if (!BASE_URL) {
        toast.error("API URL not configured");
        setAdoptions([]);
        setRefreshingAdoptions(false);
        setIsLoading(false);
        return;
      }
      if (!token) {
        toast.error("Authentication required. Please log in.");
        setAdoptions([]);
        setRefreshingAdoptions(false);
        setIsLoading(false);
        router.push("/auth/login");
        return;
      }

      const res = await axios.get(`${BASE_URL}/api/adoptions/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (res.data && res.data.success && Array.isArray(res.data.adoptions)) {
        setAdoptions(formatAdoptionData(res.data.adoptions));
        if (res.data.adoptions.length > 0) {
          toast.success(
            `Found ${res.data.adoptions.length} adoption application(s)`
          );
        }
        return;
      } else {
        setAdoptions([]);
        throw new Error("Invalid /my endpoint response");
      }
    } catch (err: any) {
      try {
        const res = await axios.get(`${BASE_URL}/api/adoptions/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });

        if (res.data && res.data.success && Array.isArray(res.data.adoptions)) {
          setAdoptions(formatAdoptionData(res.data.adoptions));
          if (res.data.adoptions.length > 0) {
            toast.success(
              `Found ${res.data.adoptions.length} adoption application(s)`
            );
          }
          return;
        } else {
          setAdoptions([]);
        }
      } catch (fallbackErr: any) {
        if (
          fallbackErr.response?.status !== 404 &&
          fallbackErr.code !== "ECONNREFUSED"
        ) {
          toast.error(
            "Could not load adoption applications. Please try again later."
          );
        }
        setAdoptions([]);
      }
    } finally {
      setRefreshingAdoptions(false);
      setIsLoading(false);
    }
  };

  const formatAdoptionData = (adoptions: any[]): Adoption[] => {
    if (!adoptions || !Array.isArray(adoptions)) {
      console.warn("⚠️ No adoptions array received:", adoptions);
      return [];
    }

    console.log("🔄 Formatting adoptions:", adoptions.length);

    return adoptions.map((adoption, index) => {
      let petData = adoption.pet;

      if (!petData || typeof petData === "string") {
        petData = {
          _id: adoption.pet || `unknown-pet-${index}`,
          name: "Unknown Pet",
          type: "Pet",
          breed: "Unknown Breed",
          age: "Unknown",
          gender: "Unknown",
          images: [],
          description: "No description available",
        };
      }

      return {
        _id: adoption._id || `temp-${Date.now()}-${index}`,
        pet: {
          _id: petData._id || "unknown",
          name: petData.name || "Unknown Pet",
          type: petData.type || "Pet",
          breed: petData.breed || "Mixed Breed",
          age: petData.age || "Unknown",
          gender: petData.gender || "Unknown",
          images: petData.images || [],
          description: petData.description || "No description available",
        },
        status: adoption.status || "Pending",
        fullname: adoption.fullname || "Unknown",
        email: adoption.email || "Unknown",
        phone: adoption.phone || "Not provided",
        address: adoption.address || "Not provided",
        message: adoption.message || "No message provided",
        adminMessage: adoption.adminMessage,
        createdAt: adoption.createdAt || new Date().toISOString(),
        updatedAt: adoption.updatedAt || new Date().toISOString(),
      };
    });
  };

  const fetchUserData = async (token: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/users/current-user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const user = res.data.user;
        setFormData({
          fullname: user.fullname,
          email: user.email,
          password: "",
          newEmail: "",
          profilePicture: user.profilePicture || "",
          isAdmin: user.isAdmin || false,
        });
        setTempFormData({
          fullname: user.fullname,
          email: user.email,
          password: "",
          newEmail: "",
          profilePicture: user.profilePicture || "",
          isAdmin: user.isAdmin || false,
        });
      }
    } catch (err) {
      toast.error("Error fetching user data. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFormData({ ...tempFormData, [e.target.name]: e.target.value });
  };

  const handleEditMode = () => {
    setTempFormData(formData);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setTempFormData(formData);
    setEditMode(false);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        { fullname: tempFormData.fullname },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (res.data.success) {
        setFormData(tempFormData);
        setEditMode(false);
        toast.success("Profile updated successfully.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtpForEmail = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/users/send-otp-for-email`, {
        email: formData.email,
      });
      if (res.data.success) {
        setIsOtpSent(true);
        setIsOtpVerified(false);
        setOtp("");
        toast.info("OTP sent to your email. Please enter the OTP to proceed.");
        setView("verifyEmail");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtpForPassword = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/users/send-otp-for-password`,
        {
          email: formData.email,
        }
      );
      if (res.data.success) {
        setIsOtpSent(true);
        setIsOtpVerified(false);
        setOtp("");
        toast.info("OTP sent to your email. Please enter the OTP to proceed.");
        setView("verifyPassword");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpForEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp.length < 6) {
      toast.error("Please enter a valid OTP");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/users/verify-otp`, {
        email: formData.email,
        otp: otp,
      });

      if (res.data.success) {
        setIsOtpVerified(true);
        setVerifiedOtp(otp);
        toast.success("OTP verified successfully");
        setView("updateEmail");
      } else {
        toast.error(res.data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      toast.error("Invalid OTP or verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpForPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp.length < 6) {
      toast.error("Please enter a valid OTP");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/users/verify-otp`, {
        email: formData.email,
        otp: otp,
      });

      if (res.data.success) {
        setIsOtpVerified(true);
        setVerifiedOtp(otp);
        toast.success("OTP verified successfully");
        setView("updatePassword");
      } else {
        toast.error(res.data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      toast.error("Invalid OTP or verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOtpVerified) {
      toast.error("Please verify your OTP first");
      setView("verifyEmail");
      return;
    }

    if (!tempFormData.newEmail || tempFormData.newEmail.trim() === "") {
      toast.error("Please enter your new email address");
      return;
    }

    setIsLoading(true);
    try {
      // Use 'email' as the key for new email, not 'newEmail'
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        {
          email: tempFormData.newEmail.trim(),
          otp: verifiedOtp,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("Email updated successfully.");
        setOtp("");
        setVerifiedOtp("");
        setIsOtpVerified(false);
        setView("main");
        setFormData((prev) => ({
          ...prev,
          email: tempFormData.newEmail,
          newEmail: "",
        }));
        setTempFormData((prev) => ({
          ...prev,
          email: tempFormData.newEmail,
          newEmail: "",
        }));
      }
    } catch (err: any) {
      if (err.response) {
        toast.error(
          err.response.data.message ||
            err.response.data.error ||
            "Something went wrong. Please try again."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOtpVerified) {
      toast.error("Please verify your OTP first");
      setView("verifyPassword");
      return;
    }

    if (!tempFormData.password) {
      toast.error("Please enter your new password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        {
          password: tempFormData.password,
          otp: verifiedOtp,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (res.data.success) {
        toast.success("Password updated successfully.");
        setOtp("");
        setVerifiedOtp("");
        setIsOtpVerified(false);
        setFormData((prev) => ({ ...prev, password: "" }));
        setTempFormData((prev) => ({ ...prev, password: "" }));
        setView("main");
      }
    } catch (err: any) {
      if (err.response) {
        toast.error(
          err.response.data.message ||
            err.response.data.error ||
            "Something went wrong. Please try again."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.includes("image")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${BASE_URL}/api/users/upload-profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("Profile picture updated successfully");
        setFormData((prev) => ({
          ...prev,
          profilePicture: res.data.profilePicture,
        }));
        setTempFormData((prev) => ({
          ...prev,
          profilePicture: res.data.profilePicture,
        }));
      }
    } catch (err) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await axios.delete(`${BASE_URL}/api/users/delete-account`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (res.data.success) {
        localStorage.removeItem("accessToken");
        window.location.href = "/";
        toast.success("Account deleted successfully.");
      }
    } catch (err) {
      console.error("Something went wrong. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/dashboard");
    toast.success("Logged out successfully.");
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleResendOtp = () => {
    if (view === "verifyEmail") {
      handleSendOtpForEmail();
    } else if (view === "verifyPassword") {
      handleSendOtpForPassword();
    }
  };

  const handleRefreshAdoptions = () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUserAdoptions(token);
    }
  };

  const handlePetClick = (petId: string) => {
    router.push(`/pet?id=${petId}`);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "Approved":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "Rejected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      case "Completed":
        return {
          icon: CheckCircle2,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      case "Pending":
      default:
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
    }
  };
  const getFilteredAdoptions = () => {
    if (adoptionStatusFilter === "All") {
      return adoptions;
    }
    return adoptions.filter(
      (adoption) => adoption.status === adoptionStatusFilter
    );
  };

  const getStatusCount = (status: AdoptionStatus) => {
    if (status === "All") {
      return adoptions.length;
    }
    return adoptions.filter((adoption) => adoption.status === status).length;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  if (isLoading && view === "main") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex pt-20 sm:pt-28 pb-20 sm:pb-32 flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white shadow-lg rounded-xl sm:rounded-2xl p-0 w-full max-w-5xl relative overflow-hidden"
        >
          {view !== "main" ? (
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={() => setView("main")}
                  className="text-gray-500 hover:text-orange-500 transition-colors"
                  aria-label="Back to profile"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 mx-auto">
                  {view === "account"
                    ? "Edit Name"
                    : view === "verifyEmail"
                    ? "Verify Email"
                    : view === "verifyPassword"
                    ? "Verify Password"
                    : view === "updateEmail"
                    ? "Update Email"
                    : view === "settings"
                    ? "Settings"
                    : "Update Password"}
                </h2>
                <div className="w-5"></div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader />
                </div>
              ) : view === "account" ? (
                <form className="space-y-6" onSubmit={handleSaveChanges}>
                  <div className="space-y-2">
                    <label
                      htmlFor="fullname"
                      className="text-sm text-gray-600 font-medium"
                    >
                      Full Name
                    </label>
                    <Input
                      id="fullname"
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="rounded-lg sm:rounded-xl py-5 sm:py-6 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 sm:py-6 rounded-lg sm:rounded-xl transition-colors"
                  >
                    Update Name
                  </Button>
                </form>
              ) : view === "settings" ? (
                <div className="space-y-6">
                  <p className="text-gray-600 mb-6">
                    Manage your account settings and preferences.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Account
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Delete your account and all associated data.
                      </p>
                      <Button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 py-3 px-4 flex items-center gap-2 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                        <span>Delete Account</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : view === "verifyEmail" || view === "verifyPassword" ? (
                <form
                  className="space-y-6"
                  onSubmit={
                    view === "verifyEmail"
                      ? handleVerifyOtpForEmail
                      : handleVerifyOtpForPassword
                  }
                >
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-2">
                      Enter the 6-digit code sent to
                    </p>
                    <p className="text-gray-800 font-medium">
                      {formData.email}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center tracking-widest text-lg py-6 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl transition-colors"
                  >
                    Verify Code
                  </Button>
                  <p className="text-center text-sm">
                    <button
                      type="button"
                      className="text-orange-500 hover:text-orange-700 transition-colors"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                    >
                      Didn't receive the code? Resend
                    </button>
                  </p>
                </form>
              ) : view === "updateEmail" ? (
                <form className="space-y-6" onSubmit={handleUpdateEmail}>
                  <div className="space-y-2">
                    <label
                      htmlFor="newEmail"
                      className="text-sm text-gray-600 font-medium"
                    >
                      New Email Address
                    </label>
                    <Input
                      id="newEmail"
                      type="email"
                      name="newEmail"
                      value={tempFormData.newEmail}
                      onChange={handleChange}
                      placeholder="Enter your new email"
                      className="rounded-xl py-6 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl transition-colors"
                  >
                    Update Email
                  </Button>
                </form>
              ) : view === "updatePassword" ? (
                <form className="space-y-6" onSubmit={handleUpdatePassword}>
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm text-gray-600 font-medium"
                    >
                      New Password
                    </label>
                    <PasswordInput
                      id="password"
                      name="password"
                      value={tempFormData.password}
                      onChange={handleChange}
                      placeholder="Enter your new password"
                      className="rounded-xl py-6 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl transition-colors"
                  >
                    Update Password
                  </Button>
                </form>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Profile Header */}
              <div className="bg-white border-b border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-md overflow-hidden bg-white flex items-center justify-center border-2 border-gray-100">
                        {formData.profilePicture ? (
                          <img
                            src={formData.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/150";
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : (
                          <User className="text-gray-300" size={48} />
                        )}
                      </div>
                      <button
                        onClick={triggerFileInput}
                        className="absolute bottom-0 right-0 bg-white shadow-md text-orange-500 rounded-full p-2 hover:bg-orange-50 transition-colors border border-gray-200"
                        disabled={uploadingImage}
                        aria-label="Upload profile picture"
                      >
                        {uploadingImage ? (
                          <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Camera size={14} />
                        )}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-xl text-center mb-1">
                      {formData.fullname}
                    </h3>
                    <p className="text-gray-500 text-sm text-center mb-2">
                      {formData.email}
                    </p>
                    <button
                      onClick={triggerFileInput}
                      className="text-xs text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                    >
                      {uploadingImage
                        ? "Uploading..."
                        : "Change profile picture"}
                    </button>
                    {formData.isAdmin && (
                      <Button
                        className="mt-3 bg-orange-500 hover:bg-orange-600 text-white text-xs flex items-center gap-2"
                        size="sm"
                        onClick={() =>
                          window.open("/admin/dashboard", "_blank")
                        }
                      >
                        <Shield size={14} />
                        <span>Admin Dashboard</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-gray-200 bg-white">
                <div className="flex justify-evenly px-4 sm:px-8">
                  <button
                    onClick={() => setSidebarView("profile")}
                    className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors border-b-2 ${
                      sidebarView === "profile"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <User size={14} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => setSidebarView("adoptions")}
                    className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors border-b-2 ${
                      sidebarView === "adoptions"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <PawPrint size={14} />
                    <span>My Adoptions</span>
                    {adoptions.length > 0 && (
                      <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {adoptions.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 sm:p-6 md:p-8">
                {sidebarView === "profile" ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Personal Information
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {/* Full Name Field - Direct Editing */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-orange-50 p-2 rounded-full flex-shrink-0">
                              <User className="text-orange-500" size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500 mb-0.5">
                                Full Name
                              </p>
                              {editMode ? (
                                <Input
                                  type="text"
                                  name="fullname"
                                  value={tempFormData.fullname}
                                  onChange={handleChange}
                                  className="bg-white border-gray-300"
                                  placeholder="Enter your full name"
                                />
                              ) : (
                                <p className="text-base text-gray-900 font-medium truncate">
                                  {formData.fullname}
                                </p>
                              )}
                            </div>
                          </div>
                          {!editMode && (
                            <button
                              onClick={handleEditMode}
                              className="p-2 text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0 ml-2"
                              aria-label="Edit name"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </div>

                        {/* Email Field - OTP Required */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-orange-50 p-2 rounded-full flex-shrink-0">
                              <Mail className="text-orange-500" size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500 mb-0.5">
                                Email Address
                              </p>
                              <p className="text-base text-gray-900 font-medium truncate">
                                {formData.email}
                              </p>
                              {editMode && (
                                <p className="text-xs text-orange-500 mt-1">
                                  Email changes require OTP verification
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleSendOtpForEmail}
                            className="p-2 text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0 ml-2"
                            aria-label="Edit email"
                          >
                            <Edit size={16} />
                          </button>
                        </div>

                        {/* Password Field - OTP Required */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="bg-orange-50 p-2 rounded-full flex-shrink-0">
                              <Lock className="text-orange-500" size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500 mb-0.5">
                                Password
                              </p>
                              <p className="text-base text-gray-900 font-medium">
                                ••••••••
                              </p>
                              {editMode && (
                                <p className="text-xs text-orange-500 mt-1">
                                  Password changes require OTP verification
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleSendOtpForPassword}
                            className="p-2 text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0 ml-2"
                            aria-label="Edit password"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Save Changes Button (for edit mode) */}
                      {editMode && (
                        <div className="mt-6 flex gap-3 justify-end">
                          <Button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 text-white"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveChanges}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        My Adoption Applications
                      </h3>
                      <Button
                        onClick={handleRefreshAdoptions}
                        disabled={refreshingAdoptions}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2"
                        size="sm"
                      >
                        <RefreshCw
                          size={14}
                          className={refreshingAdoptions ? "animate-spin" : ""}
                        />
                        <span>Refresh</span>
                      </Button>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-gray-200 pb-4">
                        {(
                          [
                            "All",
                            "Pending",
                            "Approved",
                            "Rejected",
                            "Completed",
                          ] as AdoptionStatus[]
                        ).map((status) => (
                          <button
                            key={status}
                            onClick={() => setAdoptionStatusFilter(status)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              adoptionStatusFilter === status
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {status === "All" && <PawPrint size={16} />}
                            {status === "Pending" && <Clock size={16} />}
                            {status === "Approved" && (
                              <CheckCircle2 size={16} />
                            )}
                            {status === "Rejected" && <XCircle size={16} />}
                            {status === "Completed" && (
                              <CheckCircle2 size={16} />
                            )}
                            <span>{status}</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                adoptionStatusFilter === status
                                  ? "bg-white text-orange-500"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {getStatusCount(status)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {refreshingAdoptions ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Loader />
                        <p className="text-gray-500 text-sm mt-4">
                          Loading your applications...
                        </p>
                      </div>
                    ) : getFilteredAdoptions().length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <PawPrint
                          className="mx-auto text-gray-300 mb-3"
                          size={48}
                        />
                        <h4 className="text-gray-700 font-medium mb-2">
                          {adoptionStatusFilter === "All"
                            ? "No Adoption Applications Yet"
                            : `No ${adoptionStatusFilter} Applications`}
                        </h4>
                        <p className="text-gray-500 text-sm mb-6">
                          {adoptionStatusFilter === "All"
                            ? "You haven't submitted any adoption applications. Start your journey to find your perfect companion!"
                            : `You don't have any ${adoptionStatusFilter.toLowerCase()} adoption applications at the moment.`}
                        </p>
                        {adoptionStatusFilter !== "All" && (
                          <Button
                            onClick={() => setAdoptionStatusFilter("All")}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 mr-3"
                          >
                            View All Applications
                          </Button>
                        )}
                        <Button
                          onClick={() => router.push("/adoption")}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Browse Available Pets
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getFilteredAdoptions().map((adoption) => {
                          const StatusIcon = getStatusInfo(
                            adoption.status
                          ).icon;
                          const statusColor = getStatusInfo(
                            adoption.status
                          ).color;
                          const statusBgColor = getStatusInfo(
                            adoption.status
                          ).bgColor;
                          const statusBorderColor = getStatusInfo(
                            adoption.status
                          ).borderColor;

                          return (
                            <motion.div
                              key={adoption._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`bg-white border-2 ${statusBorderColor} rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group relative`}
                              onClick={() => handlePetClick(adoption.pet._id)}
                            >
                              <div className="flex flex-col sm:flex-row gap-4">
                                {/* Pet Image */}
                                <div className="flex-shrink-0">
                                  <img
                                    src={
                                      adoption.pet?.images?.[0]?.url ||
                                      "/placeholder-pet.jpg"
                                    }
                                    alt={adoption.pet?.name}
                                    className="w-full sm:w-28 h-28 rounded-lg object-cover group-hover:opacity-90 transition-opacity"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "/placeholder-pet.jpg";
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                </div>

                                {/* Adoption Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-orange-600 transition-colors">
                                        {adoption.pet?.name}
                                      </h4>
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                          🐾 {adoption.pet?.type}
                                        </span>
                                        <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                          {adoption.pet?.breed}
                                        </span>
                                        <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                          {adoption.pet?.age}
                                        </span>
                                        <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                          {adoption.pet?.gender}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col items-start sm:items-end gap-2">
                                      <div
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusBgColor} ${statusColor}`}
                                      >
                                        <StatusIcon size={16} />
                                        <span>{adoption.status}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar size={12} />
                                        <span>
                                          {new Date(
                                            adoption.createdAt
                                          ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Application Information */}
                                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="flex items-start gap-2">
                                        <Phone
                                          size={16}
                                          className="text-gray-400 mt-0.5 flex-shrink-0"
                                        />
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Phone
                                          </p>
                                          <p className="text-sm text-gray-900 font-medium">
                                            {adoption.phone}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <MapPin
                                          size={16}
                                          className="text-gray-400 mt-0.5 flex-shrink-0"
                                        />
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Address
                                          </p>
                                          <p className="text-sm text-gray-900 font-medium line-clamp-1">
                                            {adoption.address}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                      <MessageSquare
                                        size={16}
                                        className="text-gray-400 mt-0.5 flex-shrink-0"
                                      />
                                      <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">
                                          Your Message
                                        </p>
                                        <p className="text-sm text-gray-700 line-clamp-2">
                                          {adoption.message}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Admin Message */}
                                  {adoption.adminMessage && (
                                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 rounded p-3">
                                      <div className="flex items-start gap-2">
                                        <Shield
                                          size={16}
                                          className="text-blue-600 mt-0.5 flex-shrink-0"
                                        />
                                        <div>
                                          <p className="text-xs text-blue-700 font-semibold mb-1">
                                            Admin Message
                                          </p>
                                          <p className="text-sm text-blue-900">
                                            {adoption.adminMessage}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Status Messages */}
                                  {adoption.status === "Approved" && (
                                    <div className="mt-3 bg-green-50 border-l-4 border-green-400 rounded p-3">
                                      <div className="flex items-start gap-2">
                                        <CheckCircle2
                                          size={16}
                                          className="text-green-600 mt-0.5 flex-shrink-0"
                                        />
                                        <p className="text-sm text-green-800 font-medium">
                                          🎉 Congratulations! Your application
                                          has been approved. Please check your
                                          email for next steps to complete the
                                          adoption process.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {adoption.status === "Completed" && (
                                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 rounded p-3">
                                      <div className="flex items-start gap-2">
                                        <CheckCircle2
                                          size={16}
                                          className="text-blue-600 mt-0.5 flex-shrink-0"
                                        />
                                        <p className="text-sm text-blue-800 font-medium">
                                          🏠 Adoption Completed! Thank you for
                                          giving {adoption.pet?.name} a loving
                                          home!
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {adoption.status === "Rejected" && (
                                    <div className="mt-3 bg-red-50 border-l-4 border-red-400 rounded p-3">
                                      <div className="flex items-start gap-2">
                                        <XCircle
                                          size={16}
                                          className="text-red-600 mt-0.5 flex-shrink-0"
                                        />
                                        <p className="text-sm text-red-800">
                                          We're sorry, your application wasn't
                                          approved at this time. Feel free to
                                          apply for other pets or contact us for
                                          more information.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {adoption.status === "Pending" && (
                                    <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 rounded p-3">
                                      <div className="flex items-start gap-2">
                                        <Clock
                                          size={16}
                                          className="text-yellow-600 mt-0.5 flex-shrink-0"
                                        />
                                        <p className="text-sm text-yellow-800">
                                          ⏳ Your application is being reviewed
                                          by our admin team. We'll notify you
                                          via email once a decision is made.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Click indicator overlay */}
                              <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-orange-200 transition-colors pointer-events-none"></div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings and Logout - Bottom Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setView("settings")}
                      className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      aria-label="Settings"
                    >
                      <Settings size={20} />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {isAuthenticated ? <AuthNavigation /> : <Navigation />}

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Delete Account
              </h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. All your data will be permanently
                removed.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-5 rounded-xl transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-5 rounded-xl transition-colors"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
