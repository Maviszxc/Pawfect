"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, X, MessageSquare, User, Trash2 } from "lucide-react";
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
  isFirstTime?: boolean;
}

// FAQ questions for quick access - Biyaya specific
const faqQuestions = [
  "What is Biyaya Animal Care?",
  "Where are your branches?",
  "How can I adopt an Aspin or Puspin?",
  "What services do you offer?",
  "How can I support your mission?",
];

// AI Assistant profile information
const assistantProfile = {
  name: "Biyaya Assistant",
  avatar: "/logows.png",
  description:
    "Your guide to Biyaya Animal Care - helping you find your perfect Aspin or Puspin companion!",
};

// Default user profile
const defaultUserProfile = {
  name: "Guest User",
  avatar: "/placeholder-user.png",
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, isFirstTime = false }) => {
  const router = useRouter();
  
  // Different welcome messages for first-time vs returning users
  const getWelcomeMessage = () => {
    if (isFirstTime) {
      return {
        id: "welcome",
        role: "assistant" as const,
        content:
          "🎉 **Welcome to Biyaya!** \n\nI'm so excited to help you find your perfect furry companion! I just showed you around - now let's find your ideal Aspin or Puspin! \n\n✨ **Take our Pet Matching Quiz** to discover your perfect companion!\n\nReady to find your match?",
        options: ["🎯 Yes, start the quiz!", "Tell me about Biyaya first"],
      };
    }
    return {
      id: "welcome",
      role: "assistant" as const,
      content:
        "🐾 **Kumusta! Welcome back to Biyaya!** \n\nI'm your Biyaya Pet Assistant. I can help you learn about Biyaya Animal Care, our services, and find your perfect Aspin or Puspin companion! \n\n✨ **Take our Pet Matching Quiz** to find your perfect pet match!\n\nWould you like to start the quiz?",
      options: ["🎯 Yes, start the quiz!", "Tell me more first"],
    };
  };
  
  // Load saved chat data from localStorage or use defaults
  const loadChatData = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedChat = localStorage.getItem('biyaya_chat_data');
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        // Check if data is recent (within last 24 hours)
        const savedTime = parsed.timestamp || 0;
        const hoursSinceLastSave = (Date.now() - savedTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    }
    return null;
  };

  const savedData = loadChatData();

  const [messages, setMessages] = useState<ChatMessage[]>(
    savedData?.messages || [getWelcomeMessage()]
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuizStep, setCurrentQuizStep] = useState(savedData?.currentQuizStep || 0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>(
    savedData?.quizAnswers || {}
  );
  const [matchedPet, setMatchedPet] = useState<PetMatch | null>(savedData?.matchedPet || null);
  const [matchedPets, setMatchedPets] = useState<PetMatch[]>(savedData?.matchedPets || []);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [showFaqButtons, setShowFaqButtons] = useState(false);
  const [sparkles, setSparkles] = useState<
    { id: number; left: number; top: number }[]
  >([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Simplified quiz questions for better matching with limited pet database
  const quizQuestions = [
    {
      question: "🐕🐈 What type of pet are you looking for?",
      options: [
        { text: "Dog", value: "dog" },
        { text: "Cat", value: "cat" },
      ],
    },
    {
      question: "🏃‍♂️ What's your lifestyle like?",
      options: [
        { text: "Active - I love outdoor activities", value: "active" },
        { text: "Moderate - Regular walks and playtime", value: "moderate" },
        { text: "Relaxed - Prefer calm indoor time", value: "relaxed" },
      ],
    },
    {
      question: "🏠 What's your living space?",
      options: [
        { text: "House with yard", value: "house" },
        { text: "Apartment or small space", value: "apartment" },
        { text: "Any space works for me", value: "flexible" },
      ],
    },
    {
      question: "😊 What personality do you prefer?",
      options: [
        { text: "Playful and energetic", value: "playful" },
        { text: "Calm and gentle", value: "calm" },
        { text: "Friendly and social", value: "friendly" },
        { text: "Any personality is fine!", value: "any_personality" },
      ],
    },
    {
      question: "👶 Do you have a preference for age?",
      options: [
        { text: "Young and energetic", value: "young" },
        { text: "Adult and settled", value: "adult" },
        { text: "I'm open to any age!", value: "any_age" },
      ],
    },
  ];

  // Save chat data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const chatData = {
        messages,
        currentQuizStep,
        quizAnswers,
        matchedPet,
        matchedPets,
        timestamp: Date.now(),
      };
      localStorage.setItem('biyaya_chat_data', JSON.stringify(chatData));
    } catch (error) {
      console.error('Error saving chat data:', error);
    }
  }, [messages, currentQuizStep, quizAnswers, matchedPet, matchedPets]);

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

  // Process message with Gemini AI - Updated with Biyaya-specific information
  const processWithGemini = async (message: string): Promise<string> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const lowerMessage = message.toLowerCase();

      // Biyaya-specific responses
      if (
        lowerMessage.includes("biyaya") ||
        lowerMessage.includes("what is biyaya") ||
        lowerMessage.includes("about biyaya")
      ) {
        return "**About Biyaya Animal Care** 🐾\n\nBiyaya is a social enterprise transforming every support into hope for stray animals. We believe that compassion changes lives—not just for pets, but for the people and communities who care for them.\n\n**We offer:**\n• **Veterinary Hospital & Clinic Network** - Professional medical services from preventive care to emergency treatments\n• **Pawshoppe** - Premium pet essentials and services\n• **Animal Sanctuary** - Rescue and rehoming for abandoned pets, especially Aspins and Puspins\n\n**Our Mission:** Working towards a #StrayFreeRabiesFreePhilippines2035 🇵🇭";
      } else if (
        lowerMessage.includes("services") ||
        lowerMessage.includes("what do you offer")
      ) {
        return "**Biyaya Animal Care Services** 🏥\n\n• **Consultation** - Professional veterinary advice\n• **Surgery** - Advanced surgical procedures\n• **Spay & Neuter** - Low-cost kapon services\n• **Laboratory & Diagnostics** - Complete testing facilities\n• **Dental Care** - Dental prophylaxis packages\n• **Confinement Services** - 24/7 pet care\n\n**Special Programs:**\n✨ Low-cost Spay and Neuter\n✨ Dental Prophylaxis Packages\n✨ Standard Pet Wellness Packages\n\nVisit any of our 3 branches!";
      } else if (
        lowerMessage.includes("branch") ||
        lowerMessage.includes("location") ||
        lowerMessage.includes("where")
      ) {
        return "**Biyaya Branches** 📍\n\n🏥 **Mandala Pet Hospital**\n📞 0917-142-0171\n\n🏥 **Rockwell Pet Clinic**\n📞 0917-137-1157\n\n🏥 **Katarungan Spay and Neuter Clinic**\n📞 0917-543-3444\n\nVisit us for quality pet care!";
      } else if (
        lowerMessage.includes("adoption") ||
        lowerMessage.includes("adopt") ||
        lowerMessage.includes("rescue")
      ) {
        return "**Biyaya Animal Sanctuary - Adoption** 🏠\n\nWe give abandoned and neglected pets—especially **Aspins** (Filipino dogs) and **Puspins** (Filipino cats)—a second chance at life!\n\n**Adoption Process:**\n1. Browse available rescued pets\n2. Submit adoption application\n3. Meet your potential companion\n4. Home assessment (if needed)\n5. Complete adoption paperwork\n6. Welcome your new family member!\n\nEvery stray deserves a second chance. Be a Biyaya! 💛";
      } else if (
        lowerMessage.includes("aspin") ||
        lowerMessage.includes("puspin") ||
        lowerMessage.includes("filipino")
      ) {
        return "**Aspins & Puspins - Filipino Pride!** 🇵🇭\n\n**Aspins** (Asong Pinoy) - Filipino dogs\n• Resilient and adaptable\n• Loyal and intelligent\n• Perfect family companions\n• Low maintenance\n\n**Puspins** (Pusang Pinoy) - Filipino cats\n• Independent yet affectionate\n• Natural hunters\n• Hardy and healthy\n• Great for Filipino climate\n\nAt Biyaya, we're proud advocates for our local breeds. They deserve love too! 💕";
      } else if (
        lowerMessage.includes("spay") ||
        lowerMessage.includes("neuter") ||
        lowerMessage.includes("kapon")
      ) {
        return "**Low-Cost Kapon (Spay/Neuter)** ✂️\n\nBiyaya offers affordable spay and neuter services to help control pet population and improve pet health.\n\n**Benefits:**\n• Prevents unwanted litters\n• Reduces health risks\n• Improves behavior\n• Helps end animal homelessness\n\n**Visit our Katarungan Branch:**\n📞 0917-543-3444\n\nHelping create a #StrayFreePhilippines!";
      } else if (
        lowerMessage.includes("donate") ||
        lowerMessage.includes("donation") ||
        lowerMessage.includes("support")
      ) {
        return "**Support Biyaya's Mission** 💛\n\nYour compassion gives stray animals a chance for a better tomorrow!\n\n**Ways to Help:**\n• **Donate** - Support rescued animals\n• **Sponsor a Pet** - Cover medical costs\n• **Shop with Purpose** - Buy from Pawshoppe\n• **Volunteer** - Join our team\n• **Adopt** - Give a pet a forever home\n\nEvery contribution transforms lives. Be a Biyaya! 🐾";
      } else if (
        lowerMessage.includes("pawshoppe") ||
        lowerMessage.includes("shop") ||
        lowerMessage.includes("store")
      ) {
        return "**Pawshoppe by Biyaya** 🛍️\n\nYour one-stop shop for premium pet essentials!\n\n**We offer:**\n• Quality pet food\n• Toys and accessories\n• Grooming supplies\n• Health supplements\n• Pet care services\n\n**Shop with Purpose** - Every purchase supports our rescue mission and helps stray animals find hope! 💚";
      } else if (
        lowerMessage.includes("fur mom") ||
        lowerMessage.includes("fur parent") ||
        lowerMessage.includes("pet parent")
      ) {
        return "**Being a Fur Parent** 🐕🐈\n\n**Responsibilities:**\n• Provide nutritious food and clean water\n• Regular vet check-ups and vaccinations\n• Daily exercise and playtime\n• Grooming and hygiene\n• Love, patience, and training\n• Safe and comfortable home\n\n**Tips for Filipino Fur Parents:**\n✨ Consider Aspins/Puspins - they're adapted to our climate\n✨ Regular anti-tick/flea treatment (tropical weather)\n✨ Keep pets cool during summer\n✨ Spay/neuter to prevent overpopulation\n\nBiyaya is here to support your fur parenting journey!";
      } else if (
        lowerMessage.includes("hello") ||
        lowerMessage.includes("hi") ||
        lowerMessage.includes("hey") ||
        lowerMessage.includes("kumusta")
      ) {
        return "**Kumusta! 👋**\n\nI'm your Biyaya Pet Assistant! I can help you with:\n\n🐾 Information about Biyaya Animal Care\n🏥 Our veterinary services\n🏠 Pet adoption and rescue\n💉 Spay/neuter programs\n🛍️ Pawshoppe products\n💛 How to support our mission\n📍 Branch locations\n\nWhat would you like to know?";
      } else if (lowerMessage.includes("thank")) {
        return "Walang anuman! You're very welcome! 😊\n\nIf you have more questions about Biyaya, our services, or how to be a responsible fur parent, just ask! We're here to help. 🐾💛";
      } else if (
        lowerMessage.includes("quiz") ||
        lowerMessage.includes("match") ||
        lowerMessage.includes("start over")
      ) {
        handleStartOver();
        return "🔄 **Starting Pet Matching Quiz**\n\nLet's find your perfect companion from our rescued Aspins and Puspins!";
      }

      // Default response - guide users to relevant topics
      return "**I'm here to help!** 🐾\n\nI can answer questions about:\n\n• **Biyaya Animal Care** - Our mission and services\n• **Veterinary Services** - Consultations, surgery, spay/neuter\n• **Pet Adoption** - Rescued Aspins and Puspins\n• **Fur Parenting** - Tips and responsibilities\n• **Branches** - Locations and contact info\n• **Support** - How to donate or volunteer\n\nWhat would you like to know? You can also type **'quiz'** to find your perfect pet match!";
    } catch (error) {
      console.error("Error processing message:", error);
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

    // If user wants to start the quiz (handle both first-time and returning user options)
    if ((option === "Yes, let's start" || option === "Yes, let's find my pet!" || option === "🎯 Yes, start the quiz!") && currentQuizStep === 0) {
      // Start the quiz
      startQuiz();
      return;
    }

    // If user wants more info first (handle both first-time and returning user options)
    if (option === "Tell me more first" || option === "Tell me about Biyaya first") {
      const infoMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "📋 **How It Works:**\n\nI'll ask you 5 simple questions about your:\n• Preferred pet type (Aspin or Puspin) 🐕🐈\n• Lifestyle and activity level 🏃‍♂️\n• Living space 🏠\n• Personality preference 😊\n• Age preference 👶\n\nBased on your answers, I'll match you with rescued Aspins and Puspins from Biyaya Animal Sanctuary that would be perfect for you!\n\nReady to give a rescued pet a second chance?",
        options: [isFirstTime ? "Yes, let's find my pet!" : "Yes, let's start", "No thanks"],
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
          "No problem! 😊 Feel free to chat with me anytime you're ready to adopt, or if you have questions about Biyaya's services. Every stray deserves a second chance! 🐾💛",
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
    setCurrentQuizStep((prev: number) => prev + 1);

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
      // Check if user is authenticated
      const token = localStorage.getItem("accessToken");
      if (!token) {
        // User is not logged in, redirect to login page
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "🔒 **Please Log In**\n\nYou need to be logged in to view pet details and start the adoption process. I'll redirect you to the login page now!",
          },
        ]);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
        return;
      }
      
      // User is authenticated, proceed to pet details
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
    setMessages([getWelcomeMessage()]);
    setCurrentQuizStep(0);
    setQuizAnswers({});
    setMatchedPet(null);
    setMatchedPets([]);
  };

  // Clear entire chat history
  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the entire chat history?")) {
      setMessages([getWelcomeMessage()]);
      setCurrentQuizStep(0);
      setQuizAnswers({});
      setMatchedPet(null);
      setMatchedPets([]);
      localStorage.removeItem('biyaya_chat_data');
    }
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
                <h3 className="font-semibold text-lg">Biyaya Assistant</h3>
                <span className="ml-2 bg-orange-600 text-xs px-1.5 py-0.5 rounded-full">
                  ✓
                </span>
              </div>
              <p className="text-xs text-gray-400">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-full"
              aria-label="Clear chat"
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
                    className={`mt-2 flex flex-wrap pl-8 gap-2 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.options.map((option) => {
                      const isQuizButton = option.includes("quiz");
                      return (
                        <Button
                          key={option}
                          variant="outline"
                          className={`mr-2 mb-2 transition-all duration-300 hover:scale-105 ${
                            isQuizButton
                              ? "border-2 border-yellow-400 text-yellow-300 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 shadow-lg shadow-yellow-500/50 font-bold text-base px-6 py-3 animate-pulse-slow"
                              : "border-gray-700 text-white bg-[#303846] hover:bg-[#3E4C5E] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          }`}
                          onClick={() => handleOptionClick(option)}
                        >
                          {option}
                        </Button>
                      );
                    })}
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
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
