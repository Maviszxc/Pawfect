"use client";

import { useEffect, useRef } from "react";
import { useVideoStream } from "@/context/VideoStreamContext";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";

export default function LiveStatusNotifier() {
  const { isAdminStreaming } = useVideoStream();
  const previousStatusRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Show toast when admin goes live (transition from false to true)
    if (isAdminStreaming && !previousStatusRef.current) {
      // Don't show notification if on admin live page
      const isOnAdminLivePage = pathname === "/admin/live";
      
      if (!isOnAdminLivePage) {
        // Different notification based on current page
        const isOnUserLivePage = pathname === "/live";
        
        if (isOnUserLivePage) {
          // Simple notification for users already on live page
          toast.success("🔴 Admin is now LIVE! Click 'Join Stream' to watch.", {
            position: "top-center",
            autoClose: 5000,
          });
        } else {
          // Full notification with button for users on other pages
          toast.success(
            <div className="flex flex-col gap-2">
              <div className="font-semibold">🔴 Admin is now LIVE!</div>
              <button
                onClick={() => {
                  router.push("/live");
                  toast.dismiss();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Watch Now
              </button>
            </div>,
            {
              position: "top-center",
              autoClose: 10000,
              closeOnClick: false,
              draggable: false,
            }
          );
        }
      }
    }

    // Update the ref to track the current status
    previousStatusRef.current = isAdminStreaming;
  }, [isAdminStreaming, pathname, router]);

  return null; // This component doesn't render anything
}
