"use client";

import React, { useState } from "react";
import { Heart, Zap, PawPrint, ArrowRight, X } from "lucide-react";
import { Button } from "./ui/button";

interface BotTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  botPosition: { x: number; y: number };
  botSize: { width: number; height: number };
}

const BotTutorial: React.FC<BotTutorialProps> = ({ onComplete, onSkip, botPosition, botSize }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to Biyaya! 🐾",
      description:
        "I'm your AI companion here to help you find the perfect Aspin or Puspin to adopt! Let me show you around.",
      icon: Heart,
      position: "center",
      highlight: null,
    },
    {
      title: "Click the Floating Paw",
      description:
        "See that adorable paw animation? Click it anytime to chat with me! I'm always here to help you.",
      icon: PawPrint,
      position: "bottom-right",
      highlight: "bot",
    },
    {
      title: "Smart Pet Matching",
      description:
        "I'll ask you a few questions about your lifestyle and preferences, then match you with pets that fit perfectly!",
      icon: Heart,
      position: "center",
      highlight: null,
    },
    {
      title: "Ask Me Anything!",
      description:
        "I can answer questions about Biyaya, our services, adoption process, and help you find your furry soulmate. Ready to start?",
      icon: Zap,
      position: "center",
      highlight: null,
    },
  ];

  const currentStepData = tutorialSteps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <>
      {/* Dark Overlay with Spotlight Effect */}
      <div className="fixed inset-0 z-[9997] bg-black/80 backdrop-blur-sm transition-all duration-500 pointer-events-none">
        {/* Spotlight effect for the bot - Enhanced visibility */}
        {currentStepData.highlight === "bot" && (
          <>
            {/* Large glowing spotlight */}
            <div 
              className="absolute w-[250px] h-[250px] rounded-full bg-gradient-to-r from-orange-400/50 to-yellow-400/50 blur-3xl animate-pulse"
              style={{ 
                left: `${botPosition.x + botSize.width / 2 - 125}px`, 
                top: `${botPosition.y + botSize.height / 2 - 125}px`,
                transition: 'left 0.1s ease-out, top 0.1s ease-out'
              }}
            />
            {/* Brighter center spotlight */}
            <div 
              className="absolute w-[200px] h-[200px] rounded-full bg-gradient-to-r from-orange-300/40 to-yellow-300/40 blur-2xl animate-pulse" 
              style={{ 
                left: `${botPosition.x + botSize.width / 2 - 100}px`, 
                top: `${botPosition.y + botSize.height / 2 - 100}px`,
                animationDelay: '0.3s',
                transition: 'left 0.1s ease-out, top 0.1s ease-out'
              }}
            />
            {/* Clear cutout area for bot visibility */}
            <div 
              className="absolute w-[180px] h-[180px] rounded-full bg-transparent border-4 border-orange-400/60 shadow-[0_0_60px_20px_rgba(251,146,60,0.4)]"
              style={{ 
                left: `${botPosition.x + botSize.width / 2 - 90}px`, 
                top: `${botPosition.y + botSize.height / 2 - 90}px`,
                transition: 'left 0.1s ease-out, top 0.1s ease-out'
              }}
            />
          </>
        )}

      </div>

      {/* Tutorial Card - Always Centered */}
      <div
        className="fixed z-[9998] bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform pointer-events-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          animation: "slideUp 0.5s ease-out",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer pointer-events-auto z-10"
          aria-label="Skip tutorial"
        >
          <X size={24} />
        </button>

        {/* Icon with Pulsing Ring */}
        <div className="flex justify-center mb-6 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white/20 rounded-full animate-ping" />
          </div>
          <div className="relative bg-white/20 backdrop-blur-sm p-6 rounded-full border-4 border-white/40 shadow-lg">
            <Icon className="text-white w-12 h-12 animate-bounce" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center text-white space-y-4">
          <h2 className="text-3xl font-bold drop-shadow-lg">
            {currentStepData.title}
          </h2>
          <p className="text-lg text-white/90 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-6 mb-4">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-white"
                  : index < currentStep
                  ? "w-2 bg-white/60"
                  : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6 pointer-events-auto">
          {currentStep > 0 && (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="outline"
              className="flex-1 bg-white/20 border-white/40 text-white hover:bg-white/30 backdrop-blur-sm cursor-pointer"
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            className="flex-1 bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg cursor-pointer"
          >
            {currentStep === tutorialSteps.length - 1 ? (
              "Let's Go!"
            ) : (
              <>
                Next <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center text-white/70 hover:text-white text-sm mt-4 transition-colors cursor-pointer pointer-events-auto"
        >
          Skip Tutorial
        </button>
      </div>

      {/* Pulsing Ring Highlight for Bot - Enhanced */}
      {currentStepData.highlight === "bot" && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${botPosition.x}px`,
            top: `${botPosition.y}px`,
            width: `${botSize.width}px`,
            height: `${botSize.height}px`,
            transition: 'left 0.1s ease-out, top 0.1s ease-out',
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Outer pulsing ring */}
            <div className="absolute inset-[-15px] border-4 border-orange-400 rounded-full animate-ping" />
            {/* Middle ring */}
            <div className="absolute inset-[-10px] border-4 border-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            {/* Inner ring */}
            <div className="absolute inset-[-5px] border-3 border-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            {/* Glowing effect */}
            <div className="absolute inset-[-15px] rounded-full shadow-[0_0_40px_10px_rgba(251,146,60,0.6)] animate-pulse" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default BotTutorial;
