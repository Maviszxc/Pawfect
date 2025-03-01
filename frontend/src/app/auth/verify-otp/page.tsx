"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OtpPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    setOtp("");
    setResendTimer(0);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (loading || otp.length !== 6) return;
    setLoading(true);

    try {
      console.log("Sending request with:", { email, otp }); 
      const response = await axiosInstance.post("/api/users/verify-otp", {
        email,
        otp,
      });
      console.log("Server response:", response.data); 
      if (response.data.success) {
        toast.success("Account verified! Logging in...");
        router.push("/auth/login");
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      console.error("Error response:", error.response); 
      console.log("Error details:", error.response?.data); 
      toast.error(
        error.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendTimer(120);

    try {
      const response = await axiosInstance.post("/api/users/resend-otp", {
        email,
      });
      if (response.data.success) {
        toast.success("A new OTP has been sent to your email.");
      } else {
        toast.error(response.data.message);
      }
    } catch {
      toast.error("Failed to resend OTP. Try again later.");
      setResendTimer(0);
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

        <h2 className="text-3xl font-bold text-black mb-2">Verify Code</h2>
        <p className="text-black mb-6">
          Enter the 6-digit code sent to your email
        </p>

        <Input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          placeholder="Enter OTP"
          className="bg-white/10 border-black/20 focus:border-black text-black placeholder:text-black-200 w-full text-center text-lg tracking-widest py-4"
        />

        <Button
          onClick={handleVerify}
          className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg mt-6"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <p className="text-black text-sm mt-4 text-center">
          Didn't receive the code?{" "}
          <button
            onClick={handleResendOtp}
            className="text-black hover:font-semibold"
            disabled={resendTimer > 0}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
          </button>
        </p>
      </motion.div>
    </main>
  );
};

export default OtpPage;
