"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "./ui/button";

// Dynamically import FloatingBot with SSR disabled
const FloatingBot = dynamic(() => import("./FloatingBot"), { ssr: false });

interface FloatingBotDemoProps {
  count?: number;
  width?: number;
  height?: number;
  autoLoad?: boolean;
}

const FloatingBotDemo: React.FC<FloatingBotDemoProps> = ({
  count = 1, // Default to just one bot
  width = 150, // Larger size
  height = 150, // Larger size
  autoLoad = true,
}) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(autoLoad);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Load the paw animation from the public folder
    fetch("/paw-animation.json")
      .then((response) => response.json())
      .then((data) => {
        setAnimationData(data);
      })
      .catch((error) => {
        console.error("Error loading paw animation:", error);
      });
  }, []);

  // Create a single floating bot with custom movement
  const renderBot = () => {
    if (!isMounted || !showAnimation || !animationData) return null;

    return (
      <FloatingBot
        key="single-bot"
        animationData={animationData}
        width={width}
        height={height}
        style={{
          opacity: 0.85,
        }}
      />
    );
  };

  // Don't render anything during SSR
  if (!isMounted) return null;

  return (
    <div className="floating-bot-container">
      {renderBot()}
      {!autoLoad && (
        <Button
          onClick={() => setShowAnimation(!showAnimation)}
          className="fixed bottom-4 right-4 z-50"
          variant="outline"
        >
          {showAnimation ? "Hide Animation" : "Show Animation"}
        </Button>
      )}
    </div>
  );
};

export default FloatingBotDemo;
