"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "./ui/button";

// Dynamically import FloatingBot with SSR disabled
const FloatingBot = dynamic(() => import("./FloatingBot"), { ssr: false });
// Dynamically import ChatInterface with SSR disabled
const ChatInterface = dynamic(() => import("./ChatInterface"), { ssr: false });
// Dynamically import BotTutorial with SSR disabled
const BotTutorial = dynamic(() => import("./BotTutorial"), { ssr: false });

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
  const [showChat, setShowChat] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [botPosition, setBotPosition] = useState({ x: 0, y: 0 });

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

  // Check for first-time user - runs on mount and when storage changes
  useEffect(() => {
    const checkFirstTimeUser = () => {
      const tutorialCompleted = localStorage.getItem("biyaya_bot_tutorial_completed");
      const accessToken = localStorage.getItem("accessToken");

      console.log("🎓 Tutorial Check:", {
        hasToken: !!accessToken,
        tutorialCompleted: tutorialCompleted,
        willShowTutorial: !!(accessToken && !tutorialCompleted)
      });

      // Show tutorial only if user is authenticated and hasn't seen it before
      if (accessToken && !tutorialCompleted) {
        console.log("✅ Showing tutorial in 1.5s...");
        setIsFirstTimeUser(true);
        // Show tutorial after a short delay for better UX
        setTimeout(() => {
          setShowTutorial(true);
          setShowAnimation(true); // Keep bot visible during tutorial
        }, 1500);
      } else {
        console.log("❌ Tutorial not shown:", {
          reason: !accessToken ? "Not logged in" : "Tutorial already completed"
        });
      }
    };

    checkFirstTimeUser();

    // Listen for storage changes (e.g., when user logs in)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" && e.newValue) {
        console.log("🔑 Access token detected, checking tutorial...");
        checkFirstTimeUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Handle bot click to open chat
  const handleBotClick = () => {
    // Don't allow clicking during tutorial
    if (showTutorial) return;
    
    setShowChat(true);
    setShowAnimation(false);
  };

  // Handle chat close
  const handleChatClose = () => {
    setShowChat(false);
    setShowAnimation(true);
  };

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem("biyaya_bot_tutorial_completed", "true");
    // Auto-open chat after tutorial
    setTimeout(() => {
      setShowChat(true);
      setShowAnimation(false);
    }, 500);
  };

  // Handle tutorial skip
  const handleTutorialSkip = () => {
    setShowTutorial(false);
    localStorage.setItem("biyaya_bot_tutorial_completed", "true");
  };

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
          opacity: 100,
          cursor: showTutorial ? 'default' : 'pointer',
          position: 'relative',
          zIndex: showTutorial ? 9998 : 'auto', // Higher z-index during tutorial
        }}
        onClick={handleBotClick}
        onPositionChange={setBotPosition}
      />
    );
  };

  // Don't render anything during SSR
  if (!isMounted) return null;

  return (
    <div className="floating-bot-container">
      {renderBot()}
      
      {/* Tutorial Overlay - Shows for first-time authenticated users */}
      {showTutorial && (
        <BotTutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          botPosition={botPosition}
          botSize={{ width, height }}
        />
      )}
      
      {/* Chat Interface */}
      {showChat && !showTutorial && (
        <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
          <ChatInterface onClose={handleChatClose} isFirstTime={isFirstTimeUser} />
        </div>
      )}
      
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
