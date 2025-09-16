"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Loader from "@/components/Loader";
import { BASE_URL } from "@/utils/constants";
import { toast } from "react-toastify";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        toast.success("Logged in successfully!");

        // Check if user is admin from the response data
        if (data.user && data.user.isAdmin) {
          // Redirect admin users to admin dashboard
          router.push("/admin/dashboard");
        } else {
          // Redirect regular users to user dashboard
          router.push("/dashboard");
        }
      } else {
        toast.error(data.message || "Login failed. Try again.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4 pt-24">
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="shadow-lg border border-gray-200 backdrop-blur-lg rounded-3xl p-8 md:p-12 w-full max-w-lg relative bg-white/90"
      >
        <button
          onClick={() => router.back()}
          className="absolute left-8 top-8 text-black hover:font-semibold transition-colors flex items-center gap-2"
        >
          <i className="bi-arrow-left text-xl"></i>
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
            <p className="text-black mt-4">Logging you in...</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-black mb-2">Welcome Back</h2>
            <p className="text-black mb-8">
              Continue your pet adoption journey
            </p>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="border border-gray-300 focus:border-orange-500 transition-colors bg-white/10 text-black placeholder:text-gray-500 rounded-xl py-6"
                  required
                />
              </div>
              <div>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="bg-white/10 focus:border-orange-500 border-gray-300 text-black placeholder:text-gray-500 rounded-xl py-6"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-black">
                  <input
                    type="checkbox"
                    className="rounded bg-black/10 border-black/20"
                  />
                  Remember me
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-gray-600 hover:text-orange-500 transition-colors duration-300"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg rounded-xl transition-all duration-300 font-medium"
              >
                Log In
              </Button>
            </form>

            <p className="mt-8 text-center text-black">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-orange-500 hover:text-orange-600 font-medium relative group"
              >
                Sign Up
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}
