// app/admin/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axiosInstance from "@/lib/axiosInstance";
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
  Shield,
  BarChart3,
  Users,
  PawPrint,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  EyeIcon, // Added for user preview
} from "lucide-react";

interface UserProfile {
  _id: string;
  fullname: string;
  email: string;
  profilePicture?: string;
  isAdmin: boolean;
}

export default function AdminProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    newEmail: "",
    profilePicture: "",
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
  const [sidebarView, setSidebarView] = useState<"profile" | "admin">(
    "profile"
  );
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/api/users/current-user");
      const userData = response.data.user;
      setUser(userData);
      setFormData({
        fullname: userData.fullname,
        email: userData.email,
        password: "",
        newEmail: "",
        profilePicture: userData.profilePicture || "",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosInstance.put("/api/users/update-user", {
        fullname: formData.fullname,
      });
      if (response.data.success) {
        toast.success("Name updated successfully.");
        setView("main");
        fetchUserData(); // Refresh user data
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtpForEmail = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/api/users/send-otp-for-email",
        {
          email: formData.email,
        }
      );
      if (response.data.success) {
        setIsOtpSent(true);
        setIsOtpVerified(false);
        setOtp("");
        toast.info("OTP sent to your email. Please enter the OTP to proceed.");
        setView("verifyEmail");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtpForPassword = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/api/users/send-otp-for-password",
        {
          email: formData.email,
        }
      );
      if (response.data.success) {
        setIsOtpSent(true);
        setIsOtpVerified(false);
        setOtp("");
        toast.info("OTP sent to your email. Please enter the OTP to proceed.");
        setView("verifyPassword");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
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
      const response = await axiosInstance.post("/api/users/verify-otp", {
        email: formData.email,
        otp: otp,
      });

      if (response.data.success) {
        setIsOtpVerified(true);
        setVerifiedOtp(otp);
        toast.success("OTP verified successfully");
        setView("updateEmail");
      } else {
        toast.error(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Invalid OTP or verification failed. Please try again."
      );
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
      const response = await axiosInstance.post("/api/users/verify-otp", {
        email: formData.email,
        otp: otp,
      });

      if (response.data.success) {
        setIsOtpVerified(true);
        setVerifiedOtp(otp);
        toast.success("OTP verified successfully");
        setView("updatePassword");
      } else {
        toast.error(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Invalid OTP or verification failed. Please try again."
      );
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

    if (!formData.newEmail) {
      toast.error("Please enter your new email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.put("/api/users/update-user", {
        email: formData.newEmail,
        otp: verifiedOtp,
      });

      if (response.data.success) {
        toast.success("Email updated successfully.");
        setOtp("");
        setVerifiedOtp("");
        setIsOtpVerified(false);
        setView("main");
        fetchUserData(); // Refresh user data
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
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

    setIsLoading(true);
    try {
      const response = await axiosInstance.put("/api/users/update-user", {
        password: formData.password,
        otp: verifiedOtp,
      });
      if (response.data.success) {
        toast.success("Password updated successfully.");
        setOtp("");
        setVerifiedOtp("");
        setIsOtpVerified(false);
        setFormData((prev) => ({ ...prev, password: "" }));
        setView("main");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
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

      const response = await axiosInstance.post(
        "/api/users/upload-profile-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Profile picture updated successfully");
        fetchUserData(); // Refresh user data
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to upload image. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await axiosInstance.delete("/api/users/delete-account");
      if (response.data.success) {
        localStorage.removeItem("accessToken");
        window.location.href = "/";
        toast.success("Account deleted successfully.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/auth/login");
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

  // User Preview Function
  const handleUserPreview = () => {
    router.push("/profile");
  };

  // Animation variants
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

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex pt-5 pb-32 flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white shadow-lg rounded-2xl p-0 w-full max-w-6xl relative overflow-hidden"
        >
          {view !== "main" ? (
            <div className="p-6">
              {/* Header with back button for sub-views */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setView("main")}
                  className="text-gray-500 hover:text-orange-500 transition-colors"
                  aria-label="Back to profile"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-2xl font-semibold text-gray-800 mx-auto">
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
                <form className="space-y-6" onSubmit={handleUpdateName}>
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
                      className="rounded-xl py-6 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl transition-colors"
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
                      value={formData.newEmail}
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
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your new password"
                        className="rounded-xl py-6 bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
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
          ) : user ? (
            <div className="flex flex-col md:flex-row">
              {/* Left Column - Profile Picture */}
              <div className="md:w-1/4 bg-gray-50 p-6 rounded-l-2xl">
                <div className="sticky bottom-0 flex flex-col h-full">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                      <div className="w-28 h-28 rounded-full shadow-md overflow-hidden bg-white flex items-center justify-center border-2 border-white">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
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
                        className="absolute bottom-0 right-0 bg-white shadow-md text-orange-500 rounded-full p-2 hover:bg-orange-50 transition-colors"
                        disabled={uploadingImage}
                        aria-label="Upload profile picture"
                      >
                        {uploadingImage ? (
                          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
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
                    <h3 className="font-semibold text-gray-800 text-lg text-center">
                      {user.fullname}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2 text-center">
                      {user.email}
                    </p>
                    <p
                      className="text-xs text-gray-400 mb-6 text-center cursor-pointer hover:text-gray-600 transition-colors"
                      onClick={triggerFileInput}
                    >
                      {uploadingImage
                        ? "Uploading..."
                        : "Change profile picture"}
                    </p>

                    {/* Admin Badge */}
                    <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-medium mb-4 flex items-center gap-1">
                      <Shield size={12} />
                      Administrator
                    </div>

                    {/* User Preview Button */}
                    <Button
                      onClick={handleUserPreview}
                      variant="outline"
                      className="w-full mb-4 flex items-center gap-2 py-3 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <EyeIcon size={16} />
                      <span>User Preview</span>
                    </Button>

                    {/* Navigation Menu - At bottom of left column */}
                    <div className="mt-auto pt-12">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                            Admin Settings
                          </h4>
                          <button
                            onClick={() => setSidebarView("profile")}
                            className={`w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-700 font-medium ${
                              sidebarView === "profile" ? "bg-orange-50" : ""
                            }`}
                          >
                            <User className="text-orange-500" size={16} />
                            <span>Profile</span>
                          </button>
                          <button
                            onClick={() => setSidebarView("admin")}
                            className={`w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-700 font-medium ${
                              sidebarView === "admin" ? "bg-orange-50" : ""
                            }`}
                          >
                            <Shield className="text-orange-500" size={16} />
                            <span>Admin Tools</span>
                          </button>
                          <button
                            onClick={() => setView("settings")}
                            className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-700 font-medium"
                          >
                            <Settings className="text-orange-500" size={16} />
                            <span>Settings</span>
                          </button>
                          <div className="pt-4 mt-4 border-t border-gray-200">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-700 font-medium"
                            >
                              <LogOut className="text-gray-500" size={16} />
                              <span>Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Profile Information */}
              <div className="md:w-3/4 p-8">
                {sidebarView === "profile" ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Admin Profile
                    </h2>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Profile Information Card */}
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          Personal Information
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center">
                              <div className="bg-orange-50 p-2.5 rounded-full mr-4">
                                <User className="text-orange-500" size={18} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">
                                  Full Name
                                </p>
                                <p className="text-gray-800 font-medium">
                                  {user.fullname}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setView("account")}
                              className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
                              aria-label="Edit name"
                            >
                              <Edit size={16} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center">
                              <div className="bg-orange-50 p-2.5 rounded-full mr-4">
                                <Mail className="text-orange-500" size={18} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">
                                  Email Address
                                </p>
                                <p className="text-gray-800 font-medium">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleSendOtpForEmail}
                              className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
                              aria-label="Edit email"
                            >
                              <Edit size={16} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center">
                              <div className="bg-orange-50 p-2.5 rounded-full mr-4">
                                <Lock className="text-orange-500" size={18} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">
                                  Password
                                </p>
                                <p className="text-gray-800 font-medium">
                                  ••••••••
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleSendOtpForPassword}
                              className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
                              aria-label="Edit password"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Admin Information Section */}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                          Admin Information
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          You have administrator privileges with full access to
                          the system. Use the "User Preview" button to see how
                          the regular user interface looks.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-orange-50 p-4 rounded-xl text-center">
                            <Users
                              className="text-orange-500 mx-auto mb-2"
                              size={24}
                            />
                            <p className="text-sm text-gray-600">
                              User Management
                            </p>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-xl text-center">
                            <PawPrint
                              className="text-orange-500 mx-auto mb-2"
                              size={24}
                            />
                            <p className="text-sm text-gray-600">
                              Pet Management
                            </p>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-xl text-center">
                            <BarChart3
                              className="text-orange-500 mx-auto mb-2"
                              size={24}
                            />
                            <p className="text-sm text-gray-600">Analytics</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Admin Tools
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                          onClick={() => router.push("/admin/dashboard")}
                          className="p-6 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border-2 border-transparent transition-all text-left"
                        >
                          <BarChart3
                            className="text-orange-500 mb-3"
                            size={24}
                          />
                          <h3 className="font-semibold text-gray-800 mb-2">
                            Dashboard
                          </h3>
                          <p className="text-sm text-gray-600">
                            View system analytics and overview
                          </p>
                        </button>

                        <button
                          onClick={() => router.push("/admin/users")}
                          className="p-6 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border-2 border-transparent transition-all text-left"
                        >
                          <Users className="text-orange-500 mb-3" size={24} />
                          <h3 className="font-semibold text-gray-800 mb-2">
                            User Management
                          </h3>
                          <p className="text-sm text-gray-600">
                            Manage users and permissions
                          </p>
                        </button>

                        <button
                          onClick={() => router.push("/admin/pets")}
                          className="p-6 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border-2 border-transparent transition-all text-left"
                        >
                          <PawPrint
                            className="text-orange-500 mb-3"
                            size={24}
                          />
                          <h3 className="font-semibold text-gray-800 mb-2">
                            Pet Management
                          </h3>
                          <p className="text-sm text-gray-600">
                            Manage pets and adoptions
                          </p>
                        </button>

                        <button
                          onClick={() => router.push("/admin/adoptions")}
                          className="p-6 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border-2 border-transparent transition-all text-left"
                        >
                          <Shield className="text-orange-500 mb-3" size={24} />
                          <h3 className="font-semibold text-gray-800 mb-2">
                            Adoption Management
                          </h3>
                          <p className="text-sm text-gray-600">
                            Review and process adoptions
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
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
