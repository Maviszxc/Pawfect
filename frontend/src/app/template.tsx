"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Loader from "@/components/Loader";

export default function Template({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef(pathname);
  const prevSearchParamsRef = useRef(searchParams);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to detect actual loading conditions
  const shouldShowLoader = () => {
    // Check for slow network
    if (typeof window !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (
        connection &&
        (connection.effectiveType === "2g" ||
          connection.effectiveType === "slow-2g" ||
          connection.saveData)
      ) {
        return true;
      }
    }
    return false;
  };

  // Monitor for fetch requests and compilation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLoadStart = () => setIsLoading(true);
    const handleLoadComplete = () => {
      // Use a small delay to prevent flickering
      setTimeout(() => setIsLoading(false), 300);
    };

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      // Only show loader for data fetching operations
      handleLoadStart();
      return originalFetch.apply(this, args).finally(() => {
        handleLoadComplete();
      });
    };

    // Listen for console messages about compilation in development
let originalConsoleLog: typeof console.log;
    if (process.env.NODE_ENV === "development") {
      originalConsoleLog = console.log;
      console.log = function (...args) {
        const message = args.join(" ").toLowerCase();
        if (
          message.includes("compiling") ||
          message.includes("building") ||
          message.includes("loading")
        ) {
          handleLoadStart();
        } else if (
          message.includes("compiled successfully") ||
          message.includes("built successfully")
        ) {
          handleLoadComplete();
        }
        return originalConsoleLog.apply(this, args);
      };
    }

    return () => {
      // Cleanup
      window.fetch = originalFetch;
      if (process.env.NODE_ENV === "development") {
        console.log = originalConsoleLog;
      }
    };
  }, []);

  return (
    <>
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white z-[9999]">
          <div className="flex flex-col items-center">
            <Loader />
            <h2 className="mt-4 text-xl font-semibold text-orange-500">
              Loading...
            </h2>
          </div>
        </div>
      )}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        {children}
      </div>
    </>
  );
}

function originalConsoleLog(...data: any[]): void {
  throw new Error("Function not implemented.");
}
