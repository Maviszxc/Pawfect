"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useAnimation } from "framer-motion";

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface FloatingBotProps {
  animationData?: any;
  width?: number;
  height?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const FloatingBot: React.FC<FloatingBotProps> = ({
  animationData,
  width = 150,
  height = 150,
  loop = true,
  autoplay = true,
  className = "",
  style = {},
}) => {
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Handle click on the bot
  const handleBotClick = () => {
    setMessage("Hello! Do you need help finding your pet?");

    // Hide message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  useEffect(() => {
    // Create a flag to track if the component is mounted
    let isMounted = true;

    // Determine if we should use left or right side of the screen
    const useSide = Math.random() > 0.5 ? "left" : "right";

    // Set margins to keep the bot away from the center content
    const sideMargin = 150; // Distance from the edge
    const sideWidth = 150; // Width of the side area

    // Calculate starting position - either on left or right side
    let startX;
    if (useSide === "left") {
      startX = sideMargin + Math.random() * sideWidth;
    } else {
      startX =
        window.innerWidth - width - sideMargin - Math.random() * sideWidth;
    }

    // Random starting height but avoid the middle section
    const middleStart = window.innerHeight * 0.3; // Top 30% of screen
    const middleEnd = window.innerHeight * 0.7; // Bottom 30% of screen

    let startY;
    if (Math.random() > 0.5) {
      // Top section
      startY = Math.random() * middleStart;
    } else {
      // Bottom section
      startY =
        middleEnd + Math.random() * (window.innerHeight - middleEnd - height);
    }

    // Set initial position
    controls.set({
      x: startX,
      y: startY,
    });

    // Start floating animation
    const floatAnimation = async () => {
      // Only run animation if component is still mounted
      while (isMounted) {
        // Generate destination that stays on the same side
        let destX;
        if (useSide === "left") {
          destX = sideMargin + Math.random() * sideWidth;
        } else {
          destX =
            window.innerWidth - width - sideMargin - Math.random() * sideWidth;
        }

        // Generate destination Y that avoids the middle section
        let destY;
        if (Math.random() > 0.5) {
          // Top section
          destY = Math.random() * middleStart;
        } else {
          // Bottom section
          destY =
            middleEnd +
            Math.random() * (window.innerHeight - middleEnd - height);
        }

        // Only animate if component is still mounted
        if (isMounted) {
          try {
            // Animate to the destination with a very gentle floating effect
            await controls.start({
              x: destX,
              y: destY,
              transition: {
                type: "spring",
                stiffness: 20, // Lower stiffness for gentler movement
                damping: 30, // Higher damping for smoother movement
                duration: 5 + Math.random() * 3, // Longer duration (5-8 seconds)
              },
            });
          } catch (error) {
            // Handle any animation errors silently
            console.error("Animation error:", error);
          }

          // Longer pause between movements
          await new Promise(
            (resolve) =>
              isMounted && setTimeout(resolve, 2000 + Math.random() * 3000) // 2-5 second pause
          );
        }
      }
    };

    // Start the animation after a short delay to ensure component is mounted
    const animationTimeout = setTimeout(() => {
      floatAnimation();
    }, 100);

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && isMounted) {
        const { x, y } = containerRef.current.getBoundingClientRect();

        // If out of bounds after resize, reposition
        if (
          x < 0 ||
          x > window.innerWidth - width ||
          y < 0 ||
          y > window.innerHeight - height
        ) {
          // Reposition to the same side
          let newX;
          if (useSide === "left") {
            newX = sideMargin + Math.random() * sideWidth;
          } else {
            newX =
              window.innerWidth -
              width -
              sideMargin -
              Math.random() * sideWidth;
          }

          // Random Y position avoiding middle
          let newY;
          if (Math.random() > 0.5) {
            // Top section
            newY = Math.random() * middleStart;
          } else {
            // Bottom section
            newY =
              middleEnd +
              Math.random() * (window.innerHeight - middleEnd - height);
          }

          controls.set({
            x: newX,
            y: newY,
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(animationTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [controls, width, height]);

  return (
    <motion.div
      ref={containerRef}
      animate={controls}
      drag
      dragMomentum={false}
      whileDrag={{ scale: 1.1 }}
      className={`fixed z-50 ${className} cursor-grab active:cursor-grabbing pointer-events-auto`}
      style={style}
      onClick={handleBotClick}
    >
      {message && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-md text-sm whitespace-nowrap z-50 pointer-events-auto">
          {message}
        </div>
      )}
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          style={{ width, height }}
        />
      ) : (
        <div
          className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full shadow-lg shadow-pink-500 hover:shadow-xl hover:scale-105 transition-all duration-300"
          style={{ width, height }}
        />
      )}
    </motion.div>
  );
};

export default FloatingBot;
