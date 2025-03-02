"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axios from "axios";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import { BASE_URL } from "@/utils/constants";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUser, FaEnvelope, FaEdit, FaLock, FaCamera } from "react-icons/fa";

export default function Profile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    newEmail: "",
    profilePicture: "",
  });
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [view, setView] = useState<
    | "main"
    | "account"
    | "verifyEmail"
    | "verifyPassword"
    | "updateEmail"
    | "updatePassword"
  >("main");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    if (!token) {
      router.push("/auth/login");
    } else {
      fetchUserData(token);
    }
  }, [router]);

 const fetchUserData = async (token: string) => {
   try {
     const res = await axios.get(`${BASE_URL}/api/users/current-user`, {
       headers: { Authorization: `Bearer ${token}` },
     });
     if (res.data.success) {
       const user = res.data.user;
       console.log(
         "Profile picture from server:",
         user.profilePicture
           ? user.profilePicture.substring(0, 50) + "..."
           : "None"
       );
       setFormData({
         fullname: user.fullname,
         email: user.email,
         password: "",
         newEmail: "",
         profilePicture: user.profilePicture || "",
       });
     }
   } catch (err) {
     console.error("Error fetching user data:", err);
     toast.error("Something went wrong. Please try again.");
   }
 };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        {
          fullname: formData.fullname,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (res.data.success) {
        toast.success("Name updated successfully.");
        setView("main");
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
        toast.success(
          "OTP sent to your email. Please enter the OTP to proceed."
        );
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
        toast.success(
          "OTP sent to your email. Please enter the OTP to proceed."
        );
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

    setView("updateEmail");
    setIsLoading(false);
    toast.success("Please enter your new email address");
  };

  const handleVerifyOtpForPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp.length < 6) {
      toast.error("Please enter a valid OTP");
      setIsLoading(false);
      return;
    }

    setView("updatePassword");
    setIsLoading(false);
    toast.success("Please enter your new password");
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        {
          email: formData.newEmail,
          otp: otp,
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
        setView("main");
        setFormData((prev) => ({
          ...prev,
          email: formData.newEmail,
          newEmail: "",
        }));
      }
    } catch (err) {
      toast.error("Invalid OTP or something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        {
          password: formData.password,
          otp: otp,
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
        setFormData((prev) => ({ ...prev, password: "" }));
        setView("main");
      }
    } catch (err) {
      toast.error("Invalid OTP or something went wrong. Please try again.");
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
      toast.error("Something went wrong. Please try again.");
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

  return (
    <main className="min-h-screen bg-white flex pt-36 pb-40 flex-col items-center justify-center">
      {/* <ToastContainer /> */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="outline outline-1 outline-black/40 backdrop-blur-lg rounded-3xl p-8 md:p-12 w-full max-w-lg relative"
      >
        <h2 className="text-3xl font-bold text-black mb-2 text-center">
          Profile
        </h2>
        <p className="text-black text-center mb-4">
          Manage your account details
        </p>

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full outline outline-1 outline-black/40 overflow-hidden bg-gray-200 flex items-center justify-center">
              {formData.profilePicture ? (
                <img
                  src={formData.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log(
                      "Image failed to load:",
                      formData.profilePicture.substring(0, 50) + "..."
                    );
                    e.currentTarget.src = "https://via.placeholder.com/96";
                    e.currentTarget.onerror = null;
                  }}
                />
              ) : (
                <FaUser className="text-gray-400" size={40} />
              )}
            </div>
            <button
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 bg-gray-600 text-white rounded-full p-2 hover:bg-orange-500 transition-colors"
              disabled={uploadingImage}
              aria-label="Upload profile picture"
            >
              {uploadingImage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FaCamera size={14} />
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
          <p className="text-sm text-gray-500">
            {uploadingImage
              ? "Uploading..."
              : "Click to upload profile picture"}
          </p>
        </div>

        {/* User Info Display Section with Icons and Edit Buttons */}
        {formData.fullname && formData.email && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaUser className="text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Name</p>
                    <p className="text-black font-medium">
                      {formData.fullname}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setView("account")}
                  className="p-2 text-gray-600 hover:text-orange-500"
                  aria-label="Edit name"
                >
                  <FaEdit size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaEnvelope className="text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <p className="text-black font-medium">{formData.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSendOtpForEmail}
                  className="p-2 text-gray-600 hover:text-orange-500"
                  aria-label="Edit email"
                >
                  <FaEdit size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaLock className="text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Password
                    </p>
                    <p className="text-black font-medium">••••••••</p>
                  </div>
                </div>
                <button
                  onClick={handleSendOtpForPassword}
                  className="p-2 text-gray-600 hover:text-orange-500"
                  aria-label="Edit password"
                >
                  <FaEdit size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader />
            <p className="text-black mt-4">Processing your request...</p>
          </div>
        ) : view === "main" ? (
          <div className="space-y-6">
            <Button
              onClick={handleLogout}
              className="w-full bg-gray-500 hover:bg-gray-700 text-white py-6 text-lg"
            >
              Logout
            </Button>
          </div>
        ) : view === "account" ? (
          <form className="space-y-6" onSubmit={handleUpdateName}>
            <Input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Update Name
            </Button>
            <Button
              onClick={() => setView("main")}
              className="w-full bg-gray-500 hover:bg-gray-700 text-white py-6 text-lg"
            >
              Back
            </Button>
          </form>
        ) : view === "verifyEmail" ? (
          <form className="space-y-6" onSubmit={handleVerifyOtpForEmail}>
            <p className="text-black text-center mb-4">
              Enter the OTP sent to your email to verify your identity
            </p>
            <Input
              type="text"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Verify OTP
            </Button>
            <Button
              onClick={() => setView("main")}
              className="w-full bg-gray-500 hover:bg-gray-700 text-white py-6 text-lg"
            >
              Back
            </Button>
          </form>
        ) : view === "verifyPassword" ? (
          <form className="space-y-6" onSubmit={handleVerifyOtpForPassword}>
            <p className="text-black text-center mb-4">
              Enter the OTP sent to your email to verify your identity
            </p>
            <Input
              type="text"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Verify OTP
            </Button>
            <Button
              onClick={() => setView("main")}
              className="w-full bg-gray-500 hover:bg-gray-700 text-white py-6 text-lg"
            >
              Back
            </Button>
          </form>
        ) : view === "updateEmail" ? (
          <form className="space-y-6" onSubmit={handleUpdateEmail}>
            <p className="text-black text-center mb-4">
              Enter your new email address
            </p>
            <Input
              type="email"
              name="newEmail"
              value={formData.newEmail}
              onChange={handleChange}
              placeholder="New Email Address"
              required
            />
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Update Email
            </Button>
            <Button
              onClick={() => setView("main")}
              className="w-full bg-gray-500 hover:bg-gray-700 text-white py-6 text-lg"
            >
              Cancel
            </Button>
          </form>
        ) : view === "updatePassword" ? (
          <form className="space-y-6" onSubmit={handleUpdatePassword}>
            <p className="text-black text-center mb-4">
              Enter your new password
            </p>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="New Password"
              required
            />
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Update Password
            </Button>
            <Button
              onClick={() => setView("main")}
              className="w-full bg-gray-500 hover:bg-gray-700 text-white py-6 text-lg"
            >
              Cancel
            </Button>
          </form>
        ) : null}
        <Button
          onClick={() => setShowDeleteConfirmation(true)}
          className="mt-4 bg-red-500 hover:bg-red-700 text-white py-4 w-full"
        >
          Delete Account
        </Button>
      </motion.div>
      {isAuthenticated ? <AuthNavigation /> : <Navigation />}

      {showDeleteConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                onClick={() => setShowDeleteConfirmation(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white py-2 px-4 rounded"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
