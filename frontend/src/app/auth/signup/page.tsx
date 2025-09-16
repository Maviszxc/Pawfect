"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
// console imports removed
import { toast } from "react-toastify";

export default function SignUp() {
  const router = useRouter();
  // Using react-consoleify directly
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
          toast.info("Email is already used. Please login.");
          setIsLoading(true);

          setTimeout(() => {
            setIsLoading(false);
            router.push("/auth/login");
          }, 3000);
        }
      } catch (error) {
        // Check if this is a 400 error with "User not found" message
        // This is expected for new signups and should not be treated as an error
        if (
          (error as any).response &&
          (error as any).response?.status === 400 &&
          (error as any).response?.data?.message === "User not found"
        ) {
          console.log("New user signup - email not found in system");
          // Continue with signup process - this is expected for new users
        } else {
          console.error("Error checking verification:", error);
        }
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
    <main className="min-h-screen bg-white flex items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="shadow-lg border border-gray-200 backdrop-blur-lg rounded-3xl p-8 md:p-12 w-full max-w-lg relative bg-white/90"
      >
        <button
          onClick={() => router.back()}
          className="bi-arrow-left absolute left-8 top-8 text-black hover:font-semibold transition-colors flex items-center gap-2"
        >
          <span>Back</span>
        </button>

        <div className="mb-8 flex items-center gap-3 justify-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logors.png" alt="Biyaya" className="h-10" />
          </Link>
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
                className="border border-gray-300 focus:border-orange-500 transition-colors bg-white/10 text-black placeholder:text-gray-500 rounded-xl py-6"
                required
              />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="border border-gray-300 focus:border-orange-500 transition-colors bg-white/10 text-black placeholder:text-gray-500 rounded-xl py-6"
                required
              />
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="bg-white/10 border-gray-300 focus:border-orange-500 text-black placeholder:text-gray-500 rounded-xl py-6"
                required
              />
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg rounded-xl transition-all duration-300 font-medium"
              >
                Sign Up
              </Button>
            </form>

            <p className="mt-8 text-center text-black">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-orange-500 hover:text-orange-600 font-medium relative group"
              >
                Log In
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
