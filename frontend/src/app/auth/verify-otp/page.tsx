"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import Loader from "@/components/Loader";
import Navigation from "@/components/Navigation";
import AuthNavigation from "@/components/authNavigation";
import Link from "next/link";
import { toast } from "react-toastify";

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function OtpVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔍 Check if user already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      const accessToken = localStorage.getItem("accessToken");
      setIsAuthenticated(!!accessToken);

      // Validate email before making API call
      if (!email || !isValidEmail(email)) {
        setCheckingStatus(false);
        if (email && !isValidEmail(email)) {
          toast.error("Invalid email address");
        }
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/api/users/check-verified?email=${encodeURIComponent(email)}`
        );

        if (response.data.success) {
          toast.info("Account already verified. Logging you in...");

          const signupToken = localStorage.getItem("signupToken");

          if (signupToken) {
            localStorage.setItem("accessToken", signupToken);
            setTimeout(() => router.push("/dashboard"), 1500);
          } else {
            const autoLogin = await axiosInstance.post(
              "/api/users/auto-login",
              { email }
            );
            if (autoLogin.data.accessToken) {
              localStorage.setItem("accessToken", autoLogin.data.accessToken);
              setTimeout(() => router.push("/dashboard"), 1500);
            } else {
              toast.info("Please log in manually.");
              setTimeout(() => router.push("/auth/login"), 1500);
            }
          }
        } else {
          setCheckingStatus(false);
        }
      } catch (err: any) {
        // Only show error toast if it's not a 400 error (validation error)
        if (err.response?.status !== 400) {
          console.error("Error checking verification status:", err);
        }
        setCheckingStatus(false);
      }
    };

    setOtp("");
    setResendTimer(0);
    checkVerificationStatus();
  }, [email, router]);

  // 🕒 Resend OTP timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // ✅ Verify OTP
  const handleVerify = async () => {
    if (!isValidEmail(email)) {
      toast.error("Invalid email address");
      return;
    }

    if (loading || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/users/verify-otp", {
        email,
        otp,
      });

      if (res.data.success) {
        toast.success("Account verified successfully!");
        setTimeout(() => router.push("/auth/login"), 1500);
      } else {
        toast.error(res.data.message || "Failed to verify OTP");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Resend OTP
  const handleResendOtp = async () => {
    if (!isValidEmail(email)) {
      toast.error("Invalid email address");
      return;
    }

    if (resendTimer > 0) return;
    setResendTimer(120);

    try {
      const res = await axiosInstance.post("/api/users/resend-otp", { email });
      if (res.data.success) {
        toast.success("A new OTP has been sent to your email.");
      } else {
        toast.error(res.data.message || "Failed to resend OTP.");
      }
    } catch {
      toast.error("Failed to resend OTP. Try again later.");
      setResendTimer(0);
    }
  };

  // 🌀 Loading state while checking status
  if (checkingStatus) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Loader />
        <p className="mt-4 text-black">Checking verification status...</p>
      </main>
    );
  }

  // Show error if no valid email
  if (!email || !isValidEmail(email)) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="shadow-lg border border-gray-200 backdrop-blur-lg rounded-3xl p-8 md:p-12 w-full max-w-lg relative bg-white/90"
        >
          <div className="mb-8 flex items-center gap-3 justify-center">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logors.png" alt="Biyaya" className="h-10" />
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-black mb-2">Invalid Link</h2>
          <p className="text-black mb-6">
            The verification link is invalid or incomplete. Please check your
            email or sign up again.
          </p>

          <Button
            onClick={() => router.push("/auth/signup")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg rounded-xl transition-all duration-300 font-medium"
          >
            Go to Sign Up
          </Button>
        </motion.div>

        <div className="fixed bottom-0 left-0 right-0">
          <Navigation />
        </div>
      </main>
    );
  }

  // 🖥️ Main OTP UI
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="shadow-lg border border-gray-200 backdrop-blur-lg rounded-3xl p-8 md:p-12 w-full max-w-lg relative bg-white/90"
      >
        <button
          onClick={() => router.back()}
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

        <h2 className="text-3xl font-bold text-black mb-2">Verify Code</h2>
        <p className="text-black mb-6">
          Enter the 6-digit code sent to {email}
        </p>

        <Input
          type="text"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
          }
          maxLength={6}
          placeholder="Enter OTP"
          className="border border-gray-300 focus:border-orange-500 transition-colors bg-white/10 text-black placeholder:text-gray-500 w-full text-center text-lg tracking-widest py-6 rounded-xl"
        />

        <Button
          onClick={handleVerify}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg mt-6 rounded-xl transition-all duration-300 font-medium"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <p className="text-black text-sm mt-4 text-center">
          Didn't receive the code?{" "}
          <button
            onClick={handleResendOtp}
            className="text-black/70 hover:text-orange-500 transition-colors"
            disabled={resendTimer > 0}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
          </button>
        </p>
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0">
        {isAuthenticated ? <AuthNavigation /> : <Navigation />}
      </div>
    </main>
  );
}

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center p-10 text-gray-600">
            <Loader />
            <p className="mt-4">Loading verification...</p>
          </div>
        </div>
      }
    >
      <OtpVerificationContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
