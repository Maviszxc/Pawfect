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
  EyeIcon,
  Save,
  X,
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
  const [editMode, setEditMode] = useState(false);
  const [tempFormData, setTempFormData] = useState({
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
      setTempFormData({
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
      const response = await axiosInstance.put("/api/users/update-user", {
        fullname: tempFormData.fullname,
      });
      if (response.data.success) {
        setFormData(tempFormData);
        setEditMode(false);
        setUser((prev) =>
          prev ? { ...prev, fullname: tempFormData.fullname } : null
        );
        toast.success("Name updated successfully.");
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

  // Add this function to handle the name update in the account view
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosInstance.put("/api/users/update-user", {
        fullname: formData.fullname,
      });
      if (response.data.success) {
        setUser((prev) =>
          prev ? { ...prev, fullname: formData.fullname } : null
        );
        toast.success("Name updated successfully.");
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
        email: tempFormData.newEmail || formData.email,
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
      // Improved error logging for debugging
      if (error.response) {
        console.error("❌ API Error:", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.response?.data?.message,
        });
        toast.error(
          error.response.data?.message ||
            "Invalid OTP or verification failed. Please try again."
        );
      } else {
        console.error("❌ API Error:", error);
        toast.error("Invalid OTP or verification failed. Please try again.");
      }
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

    if (!tempFormData.newEmail) {
      toast.error("Please enter your new email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.put("/api/users/update-user", {
        email: tempFormData.newEmail,
        otp: verifiedOtp,
      });

      if (response.data.success) {
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
        setUser((prev) =>
          prev ? { ...prev, email: tempFormData.newEmail } : null
        );
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
        password: tempFormData.password,
        otp: verifiedOtp,
      });
      if (response.data.success) {
        toast.success("Password updated successfully.");
        setOtp("");
        setVerifiedOtp("");
        setIsOtpVerified(false);
        setFormData((prev) => ({ ...prev, password: "" }));
        setTempFormData((prev) => ({ ...prev, password: "" }));
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
    <main className="min-h-screen bg-gray-50 flex pb-8 flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white shadow-sm rounded-xl sm:rounded-2xl p-0 w-full max-w-7xl relative overflow-hidden"
        >
          {view !== "main" ? (
            <div className="p-4 sm:p-6">
              {/* Header with back button for sub-views */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={() => setView("main")}
                  className="text-gray-500 hover:text-orange-500 transition-colors"
                  aria-label="Back to profile"
                >
                  <ArrowLeft size={18} />
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
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={tempFormData.password}
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
            <div className="flex flex-col">
              {/* Top Section - Profile Picture & Info */}
              <div className="bg-white border-b border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col items-center">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-md overflow-hidden bg-white flex items-center justify-center border-2 border-gray-100">
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
                    <h3 className="font-semibold text-gray-900 text-lg sm:text-xl text-center mb-1">
                      {user.fullname}
                    </h3>
                    <p className="text-gray-500 text-sm text-center mb-2">
                      {user.email}
                    </p>
                    <button
                      onClick={triggerFileInput}
                      className="text-xs text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                    >
                      {uploadingImage
                        ? "Uploading..."
                        : "Change profile picture"}
                    </button>

                    {/* Admin Badge */}
                    <div className="mt-3 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                      <Shield size={12} />
                      Administrator
                    </div>

                    {/* User Preview Button */}
                    <Button
                      onClick={handleUserPreview}
                      variant="outline"
                      className="mt-3 flex items-center gap-2 text-sm border-orange-200 bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      size="sm"
                    >
                      <EyeIcon size={16} />
                      <span>User Preview</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-gray-200 bg-white">
                <div className="flex justify-evenly px-4 sm:px-8">
                  <button
                    onClick={() => setSidebarView("profile")}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-medium text-sm transition-colors border-b-2 ${
                      sidebarView === "profile"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <User size={14} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => setSidebarView("admin")}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-medium text-sm transition-colors border-b-2 ${
                      sidebarView === "admin"
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Shield size={14} />
                    <span>Admin Tools</span>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 sm:p-6 md:p-8">
                {sidebarView === "profile" ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
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
                                <p className="text-sm sm:text-base text-gray-900 font-medium truncate">
                                  {user.fullname}
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
                              <p className="text-sm sm:text-base text-gray-900 font-medium truncate">
                                {user.email}
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
                              <p className="text-sm sm:text-base text-gray-900 font-medium">
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
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                      Admin Tools
                    </h3>
                    <div className="space-y-3">
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

                {/* Settings and Logout - Bottom Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setView("settings")}
                        className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        aria-label="Settings"
                      >
                        <Settings size={20} />
                      </button>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
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
