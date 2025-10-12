// app/admin/schedules/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Clock, Trash2 } from "lucide-react";
import AdminAuthWrapper from "@/components/AdminAuthWrapper";
import { toast } from "react-toastify";

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    duration: 60,
  });

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/schedules/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setShowForm(false);
        setFormData({
          title: "",
          description: "",
          scheduledDate: "",
          duration: 60,
        });
        fetchSchedules();
        toast.success("Schedule created successfully!");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Error creating schedule");
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
        toast.success("Schedule deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Error deleting schedule");
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#0a1629]">
              Live Stream Schedules
            </h1>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Schedule
            </Button>
          </div>

          {showForm && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Create New Schedule
                </h2>
                <form onSubmit={createSchedule} className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                  <Input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Duration (minutes)"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value),
                      })
                    }
                    min="1"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Create Schedule
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6">
            {schedules.map((schedule: any) => (
              <Card key={schedule._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {schedule.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {schedule.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(
                            schedule.scheduledDate
                          ).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(
                            schedule.scheduledDate
                          ).toLocaleTimeString()}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            schedule.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : schedule.status === "live"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {schedule.status}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSchedule(schedule._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
