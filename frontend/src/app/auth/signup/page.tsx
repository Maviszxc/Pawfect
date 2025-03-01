"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    const checkUserVerification = async () => {
      try {
        const response = await axiosInstance.get(
          `${BASE_URL}/api/users/check-verified?email=${formData.email}`
        );
        if (!response.data.error) {
          toast.success("Email is already used. Please login.");
          setIsLoading(true);

          setTimeout(() => {
            setIsLoading(false);
            router.push("/auth/login");
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking verification:", error);
      }
    };

    if (formData.email) {
      checkUserVerification();
    }
  }, [formData.email, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/users/createAccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("OTP sent to your email. Please verify your account.");
        router.push(`/auth/verify-otp?email=${formData.email}`);
      } else {
        toast.error(data.message || "Sign-up failed. Try again.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader />
            <p className="text-black mt-4">
              {loadingMessage || "Signing you up..."}
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-black mb-2">
              Create Account
            </h2>
            <p className="text-black mb-8">
              Join our community of pet lovers today
            </p>

            <form className="space-y-6" onSubmit={handleSignUp}>
              <Input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Full Name"
                className="bg-white/10 border-black/20 focus:border-black text-black placeholder:text-black-200"
                required
              />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="bg-white/10 border-black/20 focus:border-black text-black placeholder:text-black-200"
                required
              />
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="bg-white/10 border-black/20 focus:border-black text-black placeholder:text-black-200"
                required
              />
              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/80 text-white py-6 text-lg"
              >
                Sign Up
              </Button>
            </form>

            <p className="mt-8 text-center text-black">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-black hover:font-semibold"
              >
                Log In
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
