"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/api/users/send-otp-for-password",
        { email }
      );
      if (response.data.success) {
        toast.success("OTP sent to your email.");
        setIsOtpSent(true);
      } else {
        toast.error(response.data.message || "Failed to send OTP. Try again.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/api/users/reset-password", {
        email,
        otp,
        newPassword,
      });
      if (response.data.success) {
        toast.success("Password reset successfully. Please log in.");
        router.push("/auth/login");
      } else {
        toast.error(
          response.data.message || "Failed to reset password. Try again."
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="outline outline-1 outline-black/40 backdrop-blur-lg rounded-3xl p-8 md:p-12 w-full max-w-lg relative"
      >
        <button
          onClick={() => router.back()}
          className="bi-arrow-left absolute left-8 top-8 text-black hover:font-semibold transition-colors flex items-center gap-2"
        >
          <span>Back</span>
        </button>

        <div className="mb-8 flex items-center gap-3 justify-center">
          <div className="h-10 w-10 rounded-full bg-black" />
          <h1 className="text-2xl font-semibold text-black">Pawfect</h1>
        </div>

        <h2 className="text-3xl font-bold text-black mb-2">Forgot Password</h2>
        <p className="text-black mb-6">
          Enter your email to receive an OTP for password reset
        </p>

        {!isOtpSent ? (
          <>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="bg-white/10 border-black/20 focus:border-black text-black placeholder:text-black-200 w-full text-center text-lg py-4"
              required
            />
            <Button
              onClick={handleSendOtp}
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </>
        ) : (
          <>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="Enter OTP"
              className="bg-white/10 border-black/20 focus:border-black text-black placeholder:text-black-200 w-full text-center text-lg tracking-widest py-4"
              required
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="bg-white/10 border-black/20 focus:border-black text-black placeholder:text-black-200 w-full text-center text-lg py-4 mt-4"
              required
            />
            <Button
              onClick={handleResetPassword}
              className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </>
        )}
      </motion.div>
    </main>
  );
}
