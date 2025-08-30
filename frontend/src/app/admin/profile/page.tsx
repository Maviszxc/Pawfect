"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosInstance";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import Loader from "@/components/Loader";

interface User {
  _id: string;
  fullname: string;
  email: string;
  profilePicture?: string;
  isAdmin: boolean;
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ fullname: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/users/current-user");
      if (res.data && res.data.user) {
        setUser(res.data.user);
        setForm({
          fullname: res.data.user.fullname,
          email: res.data.user.email,
        });
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put("/api/users/update-user", {
        fullname: form.fullname,
      });
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminAuthWrapper>
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
          <Loader />
        </div>
      </AdminAuthWrapper>
    );
  }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Card className="w-full max-w-md rounded-2xl shadow bg-white">
          <CardContent className="p-8 flex flex-col items-center">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage
                src={user?.profilePicture || "/placeholder-user.png"}
              />
              <AvatarFallback>{user?.fullname?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="text-xl font-bold text-[#0a1629] mb-1">
              {user?.fullname}
            </div>
            <div className="text-sm text-gray-500 mb-4">{user?.email}</div>
            <div className="mb-6">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  user?.isAdmin
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-gray-50 text-gray-700 border-green-200"
                }`}
              >
                {user?.isAdmin ? "Admin" : "User"}
              </span>
            </div>
            {editMode ? (
              <form
                onSubmit={handleSave}
                className="w-full flex flex-col gap-4"
              >
                <Input
                  value={form.fullname}
                  onChange={(e) =>
                    setForm({ ...form, fullname: e.target.value })
                  }
                  placeholder="Full Name"
                  required
                />
                <Input value={form.email} disabled placeholder="Email" />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-500 text-white"
                    disabled={saving}
                  >
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                className="bg-orange-500 text-white w-full"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminAuthWrapper>
  );
}
