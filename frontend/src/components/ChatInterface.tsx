"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, X, MessageSquare, User } from "lucide-react";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
import { BASE_URL } from "@/utils/constants";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  options?: string[];
}

interface QuizOption {
  text: string;
  value: string;
}

interface PetMatch {
  _id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  gender: string;
  image?: string;
  images?: string[];
  description: string;
  adoptionStatus: string;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

// FAQ questions for quick access
const faqQuestions = [
  "How does the adoption process work?",
  "What are the adoption fees?",
  "Do you offer pet insurance?",
  "How do I prepare my home for a new pet?",
  "What vaccinations do your pets have?",
];

// AI Assistant profile information
const assistantProfile = {
  name: "Pet Assistant",
  avatar: "/logows.png",
  description:
    "AI-powered pet matching assistant to help you find your perfect companion.",
};

// Default user profile
const defaultUserProfile = {
  name: "Guest User",
  avatar: "/placeholder-user.png",
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi there! I'm your pet matching assistant. I can help you find the perfect pet companion based on your preferences. Would you like to start the matching quiz?",
      options: ["Yes, let's start", "Tell me more first"],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [matchedPet, setMatchedPet] = useState<PetMatch | null>(null);
  const [matchedPets, setMatchedPets] = useState<PetMatch[]>([]);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [showFaqButtons, setShowFaqButtons] = useState(false);
  const [sparkles, setSparkles] = useState<
    { id: number; left: number; top: number }[]
  >([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Quiz questions with multiple-choice options
  const quizQuestions = [
    {
      question: "What type of pet are you looking for?",
      options: [
        { text: "Dog", value: "dog" },
        { text: "Cat", value: "cat" },
      ],
    },
    {
      question: "What's your activity level?",
      options: [
        { text: "Very active", value: "high" },
        { text: "Moderately active", value: "medium" },
        { text: "Not very active", value: "low" },
      ],
    },
    {
      question: "How much time can you spend with your pet daily?",
      options: [
        { text: "A lot (4+ hours)", value: "high" },
        { text: "Moderate (2-4 hours)", value: "medium" },
        { text: "Limited (less than 2 hours)", value: "low" },
      ],
    },
    {
      question: "Do you prefer a pet that is:",
      options: [
        { text: "Playful and energetic", value: "energetic" },
        { text: "Calm and relaxed", value: "calm" },
        { text: "Balanced temperament", value: "balanced" },
      ],
    },
    {
      question: "Do you have other pets at home?",
      options: [
        { text: "Yes, dogs", value: "dogs" },
        { text: "Yes, cats", value: "cats" },
        { text: "Yes, both dogs and cats", value: "both" },
        { text: "No other pets", value: "none" },
      ],
    },
  ];

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if user is authenticated and update profile
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await axiosInstance.get(
            `${BASE_URL}/api/users/current-user`
          );
          if (response.data.success) {
            const user = response.data.user;
            setUserProfile({
              name: user.name || "User",
              avatar: user.profilePicture || defaultUserProfile.avatar,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    checkAuth();
  }, []);

  // Create sparkle effect
  const createSparkles = () => {
    if (!chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Create 3-5 sparkles at random positions
    const newSparkles: { id: number; left: number; top: number }[] = [];
    const sparkleCount = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < sparkleCount; i++) {
      const left = Math.random() * containerRect.width;
      const top = Math.random() * containerRect.height;
      newSparkles.push({
        id: Date.now() + i,
        left,
        top,
      });
    }

    setSparkles((prev) => [...prev, ...newSparkles]);

    // Remove sparkles after animation completes
    setTimeout(() => {
      setSparkles((prev) =>
        prev.filter((sparkle) => !newSparkles.some((s) => s.id === sparkle.id))
      );
    }, 1500);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create sparkle effect when sending message
    createSparkles();

    try {
      // Process the message with Gemini AI
      const response = await processWithGemini(userMessage.content);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
        },
      ]);

      // Create sparkle effect when receiving response
      createSparkles();
    } catch (error) {
      console.error("Error processing message with Gemini:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again or ask a different question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle FAQ buttons display
  const toggleFaqButtons = () => {
    setShowFaqButtons(!showFaqButtons);
  };

  // Handle FAQ button click
  const handleFaqClick = async (question: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    // Create sparkle effect when clicking FAQ
    createSparkles();

    try {
      // Process with Gemini AI
      const response = await processWithGemini(question);

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
        },
      ]);

      // Create sparkle effect when receiving response
      createSparkles();
    } catch (error) {
      console.error("Error processing FAQ with Gemini:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error answering your question. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }

    // Hide FAQ buttons after selection
    setShowFaqButtons(false);
  };

  // Process message with Gemini AI
  const processWithGemini = async (message: string): Promise<string> => {
    try {
      // In a real application, you should call your own backend API
      // which then calls the Gemini API with your secure API key
      // This prevents exposing your API key in the frontend

      // For demonstration purposes, we'll simulate a response
      // Replace this with an actual API call to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate different responses based on input
      if (message.toLowerCase().includes("adoption process")) {
        return "Our adoption process involves: 1) Finding a pet you're interested in, 2) Filling out an application, 3) Meeting the pet, and 4) Finalizing the adoption with a small fee. The entire process usually takes 3-5 days.";
      } else if (
        message.toLowerCase().includes("fee") ||
        message.toLowerCase().includes("cost")
      ) {
        return "Our adoption fees help cover the cost of vaccinations, spay/neuter procedures, and general care. Fees typically range from $50 to $300 depending on the pet's age and breed.";
      } else if (message.toLowerCase().includes("insurance")) {
        return "We partner with several pet insurance providers and can help you get set up with coverage. Many new owners find this helpful for unexpected veterinary costs.";
      } else if (
        message.toLowerCase().includes("prepare") ||
        message.toLowerCase().includes("home")
      ) {
        return "To prepare your home for a new pet, you'll need: food and water bowls, a comfortable bed, appropriate toys, grooming supplies, and a safe space for them to adjust. We can provide a complete checklist!";
      } else if (message.toLowerCase().includes("vaccination")) {
        return "All our pets are up-to-date on core vaccinations appropriate for their age and species. This typically includes rabies, distemper, and other essential vaccines. We provide complete medical records at adoption.";
      } else if (
        message.toLowerCase().includes("hello") ||
        message.toLowerCase().includes("hi")
      ) {
        return "Hello! I'm here to help you find your perfect pet companion. How can I assist you today?";
      }

      return "I'm a pet matching assistant designed to help you find your perfect companion. I can answer questions about pet adoption, help you through our matching quiz, or tell you more about our available pets. How can I help you?";
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  };

  // Handle option selection
  const handleOptionSelect = async (option: string) => {
    // Add user's selection to messages
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: option,
    };
    setMessages((prev) => [...prev, userMessage]);

    // If user wants to start the quiz
    if (option === "Yes, let's start" && currentQuizStep === 0) {
      // Start the quiz
      startQuiz();
      return;
    }

    // If user wants more info first
    if (option === "Tell me more first") {
      const infoMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'll ask you a series of questions about your preferences and lifestyle. Based on your answers, I'll match you with pets from our database that would be a good fit for you. Ready to start?",
        options: ["Yes, let's start", "No thanks"],
      };
      setMessages((prev) => [...prev, infoMessage]);
      return;
    }

    // If user selects "No thanks"
    if (option === "No thanks") {
      const goodbyeMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "No problem! Feel free to chat with me anytime you're ready to find your perfect pet companion.",
      };
      setMessages((prev) => [...prev, goodbyeMessage]);
      return;
    }

    // Handle quiz option selection
    if (currentQuizStep > 0 && currentQuizStep <= quizQuestions.length) {
      const currentQuestion = quizQuestions[currentQuizStep - 1];
      const selectedOption = currentQuestion.options.find(
        (opt) => opt.text === option
      );

      if (selectedOption) {
        // Save the answer
        setQuizAnswers((prev) => ({
          ...prev,
          [currentQuestion.question]: selectedOption.value,
        }));

        // Move to next question or finish quiz
        if (currentQuizStep < quizQuestions.length) {
          // Show next question
          showNextQuizQuestion();
        } else {
          // Quiz completed, find matching pet
          await findMatchingPet();
        }
      }
    }
  };

  // Start the quiz
  const startQuiz = () => {
    setCurrentQuizStep(1); // Start with first question

    // Show first question
    const firstQuestion = quizQuestions[0];
    const questionMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: firstQuestion.question,
      options: firstQuestion.options.map((opt) => opt.text),
    };

    setMessages((prev) => [...prev, questionMessage]);
  };

  // Show next quiz question
  const showNextQuizQuestion = () => {
    setCurrentQuizStep((prev) => prev + 1);

    const nextQuestion = quizQuestions[currentQuizStep];
    const questionMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: nextQuestion.question,
      options: nextQuestion.options.map((opt) => opt.text),
    };

    setMessages((prev) => [...prev, questionMessage]);
  };

  const findMatchingPet = async () => {
    setIsLoading(true);

    try {
      // Add processing message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Thanks for your answers! I'm finding the perfect pet match for you...",
        },
      ]);

      // Build query parameters from quiz answers
      const queryParams = new URLSearchParams();

      const petType = quizAnswers["What type of pet are you looking for?"];
      if (petType) queryParams.append("type", petType);

      const activityLevel = quizAnswers["What's your activity level?"];
      if (activityLevel) queryParams.append("activityLevel", activityLevel);

      const timeAvailable =
        quizAnswers["How much time can you spend with your pet daily?"];
      if (timeAvailable) queryParams.append("timeAvailable", timeAvailable);

      const temperament = quizAnswers["Do you prefer a pet that is:"];
      if (temperament) queryParams.append("temperament", temperament);

      const otherPets = quizAnswers["Do you have other pets at home?"];
      if (otherPets) queryParams.append("otherPets", otherPets);

      // Call the new matching endpoint
      const response = await axiosInstance.get(
        `${BASE_URL}/api/pets/match?${queryParams.toString()}`
      );

      if (response.data.success && response.data.pets.length > 0) {
        const pets = response.data.pets;
        setMatchedPets(pets);
        setMatchedPet(pets[0]);

        // Show the match result
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: `I found ${pets.length} perfect match${
              pets.length > 1 ? "es" : ""
            } for you! Meet ${pets[0].name}, a ${
              pets[0].age
            } year old ${pets[0].gender.toLowerCase()} ${pets[0].breed}.\n\n${
              pets[0].description
            }\n\n![${pets[0].name}](${pets[0].images && pets[0].images.length > 0 ? pets[0].images[0] : ''})`,
          },
        ]);

        // Add follow-up options
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            role: "assistant",
            content: "What would you like to do next?",
            options: [
              "View pet details",
              "See more matches",
              "Start over",
              "End chat",
            ],
          },
        ]);
      } else {
        // No pets found
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content:
              "I couldn't find any pets that match your preferences right now. Would you like to try different criteria or check back later?",
            options: ["Start over", "End chat"],
          },
        ]);
      }
    } catch (error) {
      console.error("Error finding matching pet:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error while searching for pets. Please try again.",
          options: ["Start over", "End chat"],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "View pet details" option
  const handleViewPetDetails = () => {
    if (matchedPet) {
      router.push(`/pet?id=${matchedPet._id}`);
    }
  };

  // Handle "See more matches" option
  const handleSeeMoreMatches = () => {
    if (matchedPets.length > 1) {
      // Show next pet in the list
      const currentIndex = matchedPets.findIndex(
        (pet) => pet._id === matchedPet?._id
      );
      const nextIndex = (currentIndex + 1) % matchedPets.length;
      const nextPet = matchedPets[nextIndex];

      setMatchedPet(nextPet);

      // Update message with next pet
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Here's another great match: ${nextPet.name}, a ${
            nextPet.age
          } year old ${nextPet.gender.toLowerCase()} ${nextPet.breed}.\n\n${
            nextPet.description
          }`,
        },
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "What would you like to do next?",
          options: [
            "View pet details",
            "See more matches",
            "Start over",
            "End chat",
          ],
        },
      ]);
    }
  };

  // Handle "Start over" option
  const handleStartOver = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi there! I'm your pet matching assistant. I can help you find the perfect pet companion based on your preferences. Would you like to start the matching quiz?",
        options: ["Yes, let's start", "Tell me more first"],
      },
    ]);
    setCurrentQuizStep(0);
    setQuizAnswers({});
    setMatchedPet(null);
    setMatchedPets([]);
  };

  // Handle option click
  const handleOptionClick = (option: string) => {
    if (option === "View pet details") {
      handleViewPetDetails();
    } else if (option === "See more matches") {
      handleSeeMoreMatches();
    } else if (option === "Start over") {
      handleStartOver();
    } else if (option === "End chat") {
      onClose();
    } else {
      handleOptionSelect(option);
    }
  };

  // Add CSS for markdown content
  useEffect(() => {
    // Add a style tag for markdown images
    const style = document.createElement('style');
    style.innerHTML = `
      .markdown-content img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 8px 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-end pr-20 pb-4"
      style={{ pointerEvents: "auto" }}
      onClick={(e) => {
        // Close modal when clicking outside the chat box
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[#18191A] rounded-xl shadow-xl w-full max-w-md h-[80vh] flex flex-col transform transition-all duration-300 ease-in-out scale-100 opacity-100 relative z-[10000] m-4"
        style={{
          animation: "modalFadeIn 0.3s ease-out",
          pointerEvents: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat header with AI Profile */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#18191A] text-white rounded-t-xl">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 border-2 border-blue-500">
              <AvatarImage src={assistantProfile.avatar} alt="AI Assistant" />
              <AvatarFallback className="bg-blue-700 text-white">
                AI
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-lg">Pet Assistant</h3>
                <span className="ml-2 bg-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                  ✓
                </span>
              </div>
              <p className="text-xs text-gray-400">Active</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-800 rounded-full"
              aria-label="Minimize dialog"
            >
              <span className="h-5 w-5">—</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-800 rounded-full"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 relative z-[10001] bg-[#18191A]"
          tabIndex={0}
          role="log"
          aria-live="polite"
          style={{
            pointerEvents: "auto",
            backgroundImage:
              "radial-gradient(circle at center, rgba(30, 41, 59, 0.2) 0%, rgba(0, 0, 0, 0) 70%)",
          }}
        >
          {/* Sparkle effects */}
          {sparkles.map((sparkle) => (
            <div
              key={sparkle.id}
              className="sparkle"
              style={{
                left: `${sparkle.left}px`,
                top: `${sparkle.top}px`,
              }}
            />
          ))}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={`flex items-start gap-2 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarImage
                        src={assistantProfile.avatar}
                        alt="AI Assistant"
                      />
                      <AvatarFallback className="bg-orange-300 text-orange-800">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarImage
                        src={userProfile.avatar}
                        alt={userProfile.name}
                      />
                      <AvatarFallback className="bg-orange-200 text-orange-800">
                        {userProfile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`inline-block rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-[#303846] text-white"
                        : "bg-[#303030] text-white"
                    }`}
                  >
                    <div className="whitespace-pre-line markdown-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Options buttons - placed below the message */}
                {message.options && (
                  <div
                    className={`mt-2 flex flex-wrap pl-8 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.options.map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className="mr-2 mb-2 border-gray-700 text-white bg-[#303846] hover:bg-[#3E4C5E] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center pl-9 space-x-2">
              <div
                className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          )}
        </div>

        {/* FAQ Buttons */}
        {showFaqButtons && (
          <div className="px-4 py-2 border-t border-gray-800 bg-[#242526]">
            <div className="flex flex-wrap gap-2">
              {faqQuestions.map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-[#3A3B3C] border-gray-700 text-gray-300"
                  onClick={() => handleFaqClick(question)}
                >
                  {question}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Chat input with user profile */}
        <div
          className="p-4 border-b rounded-b-xl border-gray-800 relative z-[10001] bg-[#242526]"
          style={{ pointerEvents: "auto" }}
        >
          {/* Input field and send button */}
          <div className="flex items-center">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about pets..."
                className="w-full bg-[#3A3B3C] border-none text-white placeholder-gray-400 rounded-full pr-12 focus:ring-1 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
                aria-label="Message input"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center p-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-105"
                  disabled={isLoading || inputValue.trim() === ""}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-gray-400 hover:text-blue-500"
                onClick={toggleFaqButtons}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                <span className="text-xs">FAQs</span>
              </Button>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500">1:11 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
