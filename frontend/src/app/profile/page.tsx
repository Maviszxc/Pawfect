"use client";

import { useState, useEffect } from "react";
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

export default function Profile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [view, setView] = useState<
    "main" | "account" | "email" | "password" | "verifyEmail" | "verifyPassword"
  >("main");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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
        setFormData({
          fullname: user.fullname,
          email: user.email,
          password: "",
        });
      }
    } catch (err) {
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

  const handleVerifyOtpAndUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        {
          email: formData.email,
          otp,
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
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/users/update-user`,
        {
          password: formData.password,
          otp,
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
        setView("main");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center ">
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader />
            <p className="text-black mt-4">Processing your request...</p>
          </div>
        ) : view === "main" ? (
          <div className="space-y-6">
            <Button
              onClick={() => setView("account")}
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Account Information
            </Button>
            <Button
              onClick={handleSendOtpForEmail}
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Update Email
            </Button>
            <Button
              onClick={handleSendOtpForPassword}
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
            >
              Update Password
            </Button>
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
          <form className="space-y-6" onSubmit={handleVerifyOtpAndUpdateEmail}>
            <Input
              type="text"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
            <Input
              type="email"
              name="email"
              value={formData.email}
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
              Back
            </Button>
          </form>
        ) : view === "verifyPassword" ? (
          <form
            className="space-y-6"
            onSubmit={handleVerifyOtpAndUpdatePassword}
          >
            <Input
              type="text"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
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
              Back
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
