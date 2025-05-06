"use client";

import React, { useEffect, useState } from "react";
import Loader from "./Loader";

export default function GlobalLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide loader when window is fully loaded
    const handleLoad = () => {
      setTimeout(() => setIsLoading(false), 500);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white z-[9999]">
      <div className="flex flex-col items-center">
        <Loader />
        <h2 className="mt-4 text-xl font-semibold text-orange-500">
          Compiling...
        </h2>
      </div>
    </div>
  );
}
