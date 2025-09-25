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
  imageUrl?: string; // Added to handle pet images separately
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
  age: string;
  gender: string;
  image?: string;
  images?: Array<{ url: string; public_id: string; format: string }> | string[];
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
        "🐾 **Welcome to PetMatch!** \n\nHi there! I'm your pet matching assistant. I can help you find the perfect pet companion based on your preferences. \n\nWould you like to start the matching quiz?",
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
      question: "🐕🐈 What type of pet are you looking for?",
      options: [
        { text: "Dog", value: "dog" },
        { text: "Cat", value: "cat" },
      ],
    },
    {
      question: "🏃‍♂️ What's your activity level?",
      options: [
        { text: "Very active", value: "high" },
        { text: "Moderately active", value: "medium" },
        { text: "Not very active", value: "low" },
      ],
    },
    {
      question: "⏰ How much time can you spend with your pet daily?",
      options: [
        { text: "A lot (4+ hours)", value: "high" },
        { text: "Moderate (2-4 hours)", value: "medium" },
        { text: "Limited (less than 2 hours)", value: "low" },
      ],
    },
    {
      question: "😊 Do you prefer a pet that is:",
      options: [
        { text: "Playful and energetic", value: "energetic" },
        { text: "Calm and relaxed", value: "calm" },
        { text: "Balanced temperament", value: "balanced" },
      ],
    },
    {
      question: "🐶🐱 Do you have other pets at home?",
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
            "❌ **Sorry, I encountered an error**\n\nPlease try again or ask a different question.",
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
            "❌ **Sorry, I encountered an error**\n\nPlease try again with your question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }

    // Hide FAQ buttons after selection
    setShowFaqButtons(false);
  };

  // Process message with Gemini AI - Updated to handle more natural responses
  const processWithGemini = async (message: string): Promise<string> => {
    try {
      // In a real application, call your backend API which then calls Gemini API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("adoption process") ||
        lowerMessage.includes("how to adopt")
      ) {
        return "**Our Adoption Process:**\n\n1. **Browse Available Pets** - View our pets online or visit our shelter\n2. **Submit Application** - Fill out our adoption form\n3. **Meet & Greet** - Schedule time with your potential pet\n4. **Home Check** - Optional visit to ensure a good fit\n5. **Finalize Adoption** - Complete paperwork and pay fees\n6. **Take Home** - Welcome your new family member!\n\nThe process typically takes 3-7 days. We're here to help every step of the way! 🐾";
      } else if (
        lowerMessage.includes("fee") ||
        lowerMessage.includes("cost") ||
        lowerMessage.includes("price")
      ) {
        return "**Adoption Fees:**\n\n• **Cats/Kittens**: $75 - $150\n• **Dogs/Puppies**: $150 - $300\n• **Small Animals**: $25 - $75\n\n💰 *Fees include:*\n- Spay/neuter surgery\n- Initial vaccinations\n- Microchipping\n- Health check-up\n- Deworming treatment\n\nWe offer discounts for seniors and multiple pet adoptions!";
      } else if (lowerMessage.includes("insurance")) {
        return "**Pet Insurance Options:**\n\nWe partner with several insurance providers to offer:\n\n• **Basic Coverage**: $20-30/month - Accident protection\n• **Comprehensive**: $40-60/month - Illness + accidents\n• **Wellness Plans**: $15-25/month - Preventive care\n\n🏥 *Most plans cover:*\n- Emergency visits\n- Surgeries\n- Medications\n- Specialist care\n\nLet me know if you'd like specific provider recommendations!";
      } else if (
        lowerMessage.includes("prepare") ||
        lowerMessage.includes("home") ||
        lowerMessage.includes("supplies")
      ) {
        return "**Preparing Your Home:**\n\n**Essentials Checklist:**\n\n🐕 **For Dogs:**\n- Food and water bowls\n- Quality dog food\n- Collar with ID tags\n- Leash and harness\n- Comfortable bed\n- Chew toys\n- Grooming supplies\n- Crate (if crate training)\n\n🐈 **For Cats:**\n- Litter box and litter\n- Scratching post\n- Food and water bowls\n- Quality cat food\n- Cozy bed\n- Interactive toys\n- Carrier\n\n**Pet-proofing Tips:**\n- Secure electrical cords\n- Remove toxic plants\n- Store chemicals safely\n- Create a safe space\n- Baby gates if needed";
      } else if (
        lowerMessage.includes("vaccination") ||
        lowerMessage.includes("vaccine") ||
        lowerMessage.includes("shots")
      ) {
        return "**Vaccination Information:**\n\nAll our pets receive age-appropriate vaccinations:\n\n🐶 **Dogs:**\n- Rabies\n- DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus)\n- Bordetella (Kennel Cough)\n- Leptospirosis\n\n🐱 **Cats:**\n- Rabies\n- FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)\n- Feline Leukemia (FeLV)\n\n📋 *We provide:*\n- Complete medical records\n- Vaccination certificates\n- Spay/neuter documentation\n- Microchip information\n\nAll pets are vet-checked before adoption!";
      } else if (
        lowerMessage.includes("hello") ||
        lowerMessage.includes("hi") ||
        lowerMessage.includes("hey")
      ) {
        return "Hello! 👋 I'm your Pet Matching Assistant! \n\nI can help you:\n• Find your perfect pet companion 🐕🐈\n• Answer adoption questions ❓\n• Guide you through our process 📋\n• Provide pet care information 📚\n\nHow can I help you today?";
      } else if (lowerMessage.includes("thank")) {
        return "You're very welcome! 😊 I'm happy to help. If you have any other questions about pet adoption, care, or our available pets, just let me know! 🐾";
      } else if (
        lowerMessage.includes("quiz") ||
        lowerMessage.includes("match") ||
        lowerMessage.includes("start over")
      ) {
        handleStartOver();
        return "🔄 **Starting Over**\n\nLet's begin the matching quiz to find your perfect pet companion!";
      }

      return "I'm here to help you find your perfect pet companion! 🐕🐈\n\nI can:\n• Help you take our matching quiz to find compatible pets\n• Answer questions about adoption processes and fees\n• Provide information on pet care and preparation\n• Tell you about our available pets\n\nWhat would you like to know? You can also type 'quiz' to start our matching process!";
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
          "📋 **How It Works:**\n\nI'll ask you 5 simple questions about your:\n• Preferred pet type 🐕🐈\n• Activity level 🏃‍♂️\n• Available time ⏰\n• Temperament preference 😊\n• Current pets 🐶🐱\n\nBased on your answers, I'll match you with pets from our database that would be a perfect fit for your lifestyle!\n\nReady to find your new best friend?",
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
          "No problem! 😊 Feel free to chat with me anytime you're ready to find your perfect pet companion. I'm here to help with any questions! 🐾",
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
            "✨ **Searching our database...** \n\nI'm analyzing your preferences to find the perfect furry friend for you! This might take a moment.",
        },
      ]);

      // Build query parameters from quiz answers
      const queryParams = new URLSearchParams();

      const petType = quizAnswers["🐕🐈 What type of pet are you looking for?"];
      if (petType) queryParams.append("type", petType);

      const activityLevel = quizAnswers["🏃‍♂️ What's your activity level?"];
      if (activityLevel) queryParams.append("activityLevel", activityLevel);

      const timeAvailable =
        quizAnswers["⏰ How much time can you spend with your pet daily?"];
      if (timeAvailable) queryParams.append("timeAvailable", timeAvailable);

      const temperament = quizAnswers["😊 Do you prefer a pet that is:"];
      if (temperament) queryParams.append("temperament", temperament);

      const otherPets = quizAnswers["🐶🐱 Do you have other pets at home?"];
      if (otherPets) queryParams.append("otherPets", otherPets);

      // Call the matching endpoint
      const response = await axiosInstance.get(
        `${BASE_URL}/api/pets/match?${queryParams.toString()}`
      );

      if (response.data.success && response.data.pets.length > 0) {
        const pets = response.data.pets;
        setMatchedPets(pets);
        setMatchedPet(pets[0]);

        // Get the first valid image URL
        const getPetImage = (pet: PetMatch) => {
          if (pet.images && pet.images.length > 0 && pet.images[0]) {
            // Check if it's an object with url property (from Cloudinary)
            if (typeof pet.images[0] === "object" && "url" in pet.images[0]) {
              return pet.images[0].url;
            }
            // Check if it's a base64 string or URL
            if (
              typeof pet.images[0] === "string" &&
              pet.images[0].startsWith("data:image")
            ) {
              return pet.images[0];
            }
            if (typeof pet.images[0] === "string") {
              return `${BASE_URL}${pet.images[0]}`;
            }
          }
          if (pet.image) {
            if (pet.image.startsWith("data:image")) {
              return pet.image;
            }
            return `${BASE_URL}${pet.image}`;
          }
          return null;
        };

        const petImage = getPetImage(pets[0]);

        // Create a message with the pet info
        const matchMessage = `🎉 **Perfect Match Found!** \n\nI found ${
          pets.length
        } amazing pet${
          pets.length > 1 ? "s" : ""
        } that match your preferences!\n\n**Meet ${pets[0].name}**\n⭐ ${
          pets[0].age
        } ${pets[0].gender.toLowerCase()} ${pets[0].breed}\n\n${
          pets[0].description
        }`;

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: matchMessage,
            imageUrl: petImage || undefined,
          },
        ]);

        // Add follow-up options
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 3).toString(),
            role: "assistant",
            content: "**What would you like to do next?**",
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
              "🐾 **No Perfect Matches Found**\n\nI couldn't find any pets that exactly match your preferences right now. \n\nWould you like to:\n• Try different criteria\n• Browse all available pets\n• Check back later when we have new arrivals",
            options: ["Start over", "Browse all pets", "End chat"],
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
            "❌ **Oops! Something went wrong**\n\nI encountered an error while searching for pets. Please try again in a moment.",
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
      const currentIndex = matchedPets.findIndex(
        (pet) => pet._id === matchedPet?._id
      );
      const nextIndex = (currentIndex + 1) % matchedPets.length;
      const nextPet = matchedPets[nextIndex];

      // Get the first valid image URL
      const getPetImage = (pet: PetMatch) => {
        if (pet.images && pet.images.length > 0 && pet.images[0]) {
          // Check if it's an object with url property (from Cloudinary)
          if (typeof pet.images[0] === "object" && "url" in pet.images[0]) {
            return pet.images[0].url;
          }
          // Check if it's a base64 string or URL
          if (
            typeof pet.images[0] === "string" &&
            pet.images[0].startsWith("data:image")
          ) {
            return pet.images[0];
          }
          if (typeof pet.images[0] === "string") {
            return `${BASE_URL}${pet.images[0]}`;
          }
        }
        if (pet.image) {
          if (pet.image.startsWith("data:image")) {
            return pet.image;
          }
          return `${BASE_URL}${pet.image}`;
        }
        return null;
      };

      const nextImage = getPetImage(nextPet);

      setMatchedPet(nextPet);

      const matchMessage = `🐾 **Another Great Match!** \n\n**Meet ${
        nextPet.name
      }**\n⭐ ${nextPet.age} ${nextPet.gender.toLowerCase()} ${
        nextPet.breed
      }\n\n${nextPet.description}`;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: matchMessage,
          imageUrl: nextImage || undefined,
        },
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "**What would you like to do next?**",
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

  // Handle "Browse all pets" option
  const handleBrowseAllPets = () => {
    router.push("/pets");
  };

  // Handle "Start over" option
  const handleStartOver = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "🐾 **Welcome to PetMatch!** \n\nHi there! I'm your pet matching assistant. I can help you find the perfect pet companion based on your preferences. \n\nWould you like to start the matching quiz?",
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
    } else if (option === "Browse all pets") {
      handleBrowseAllPets();
    } else if (option === "End chat") {
      onClose();
    } else {
      handleOptionSelect(option);
    }
  };

  // Add CSS for markdown content
  useEffect(() => {
    // Add a style tag for markdown content
    const style = document.createElement("style");
    style.innerHTML = `
      .markdown-content {
        line-height: 1.6;
      }
      .markdown-content strong {
        color: #fbbf24;
      }
      .markdown-content ul, .markdown-content ol {
        margin-left: 1.5rem;
        margin-bottom: 1rem;
      }
      .markdown-content li {
        margin-bottom: 0.5rem;
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
                    {/* Pet image inside the chat bubble */}
                    {message.imageUrl && (
                      <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg mt-3">
                        {message.imageUrl.startsWith("data:image") ? (
                          <img
                            src={message.imageUrl}
                            alt="Pet image"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={message.imageUrl}
                            alt="Pet image"
                            width={192}
                            height={192}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
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
                        className="mr-2 mb-2 border-gray-700 text-white bg-[#303846] hover:bg-[#3E4C5E] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:scale-105"
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
                  className="cursor-pointer hover:bg-[#3A3B3C] border-gray-700 text-gray-300 hover:text-white transition-colors duration-200"
                  onClick={() => handleFaqClick(question)}
                >
                  {question}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-gray-800 bg-[#242526] rounded-b-xl">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFaqButtons}
              className="text-gray-400 hover:bg-gray-700 rounded-full"
              aria-label="Toggle FAQ questions"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-[#3A3B3C] border-none text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 rounded-full"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={isLoading || inputValue.trim() === ""}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 hover:scale-105"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add sparkle animation styles */}
      <style jsx>{`
        .sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #fff;
          border-radius: 50%;
          pointer-events: none;
          animation: sparkle 1.5s ease-out forwards;
          box-shadow: 0 0 8px 2px #3b82f6;
        }
        @keyframes sparkle {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
