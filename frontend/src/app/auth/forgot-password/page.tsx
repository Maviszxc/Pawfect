"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";
// console imports removed

const handleApiError = (error: unknown): string => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return (
      axiosError.response?.data?.message || "Something went wrong. Try again."
    );
  }
  return "Something went wrong. Try again.";
};

export default function ForgotPassword() {
  const router = useRouter();
  // Using react-consoleify directly
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      console.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/api/users/send-otp-for-password",
        { email }
      );
      if (response.data.success) {
        console.log("OTP sent to your email.");
        setStep(2);
      } else {
        console.error(response.data.message || "Failed to send OTP. Try again.");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      console.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      console.error("Please enter the OTP");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Verifying OTP with:", { email, otp });
      const response = await axiosInstance.post("/api/users/verify-otp", {
        email,
        otp,
      });
      if (response.data.success) {
        console.log("OTP verified successfully.");
        setVerifiedOtp(otp);
        setIsOtpVerified(true);
        setStep(3);
      } else {
        console.error(response.data.message || "Invalid OTP. Try again.");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      console.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      console.error("Please enter a new password");
      return;
    }

    if (!isOtpVerified) {
      console.error("Please verify your OTP first");
      setStep(2);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/api/users/reset-password", {
        email,
        otp: verifiedOtp,
        newPassword,
      });

      if (response.data.success) {
        console.log("Password reset successfully. Please log in.");
        router.push("/auth/login");
      } else {
        console.error(response.data.message || "Failed to reset password. Try again.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      console.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="shadow-lg border border-gray-200 backdrop-blur-lg rounded-3xl p-8 md:p-12 w-full max-w-lg relative bg-white/90"
      >
        <button
          onClick={handleGoBack}
          className="absolute left-8 top-8 text-black hover:text-orange-500 transition-colors flex items-center gap-2"
        >
          <i className="bi-arrow-left text-xl"></i>
          <span>Back</span>
        </button>

        <div className="mb-8 flex items-center gap-3 justify-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logors.png" alt="Biyaya" className="h-10" />
          </Link>
        </div>

        <h2 className="text-3xl font-bold text-black mb-2">Reset Password</h2>

        {/* Step indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center">
            <div
              className={`h-3 w-3 rounded-full ${
                step >= 1 ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`h-1 w-6 ${
                step >= 2 ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`h-3 w-3 rounded-full ${
                step >= 2 ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`h-1 w-6 ${
                step >= 3 ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`h-3 w-3 rounded-full ${
                step >= 3 ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></div>
          </div>
        </div>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <>
            <p className="text-black mb-6">
              Enter your email to receive an OTP for password reset
            </p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="bg-white/10 border-gray-300 focus:border-orange-500 text-black placeholder:text-gray-500 w-full text-center text-lg py-6 rounded-xl"
              required
            />
            <Button
              onClick={handleSendOtp}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg mt-6 rounded-xl transition-all duration-300 font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <>
            <p className="text-black mb-6">Enter the OTP sent to your email</p>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="Enter OTP"
              className="bg-white/10 border-gray-300 focus:border-orange-500 text-black placeholder:text-gray-500 w-full text-center text-lg tracking-widest py-6 rounded-xl"
              required
            />
            <Button
              onClick={handleVerifyOtp}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg mt-6 rounded-xl transition-all duration-300 font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Verifying OTP..." : "Verify OTP"}
            </Button>
            <p className="text-center mt-4 text-sm">
              <button
                className="text-black/70 hover:text-orange-500 transition-colors"
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                Didn't receive the OTP? Resend
              </button>
            </p>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <>
            <p className="text-black mb-6">
              Create a new password for your account
            </p>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="bg-white/10 border-gray-300 focus:border-orange-500 text-black placeholder:text-gray-500 w-full text-center text-lg py-6 rounded-xl"
              required
            />
            <Button
              onClick={handleResetPassword}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg mt-6 rounded-xl transition-all duration-300 font-medium"
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
