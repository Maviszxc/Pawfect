export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const getInitials = (name) => {
  if (!name) return "";

  const words = name.split(" ");
  let initials = "";

  for (let i = 0; i < Math.min(words.length, 2); i++) {
    initials += words[i][0];
  }

  return initials.toUpperCase();
};

// Safe localStorage wrapper that handles the artifact environment
export const isAuthenticated = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return !!localStorage.getItem("accessToken");
    }
    return false;
  } catch (error) {
    console.warn("localStorage not available:", error);
    return false;
  }
};

// Helper to safely get from localStorage
export const getFromStorage = (key) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  } catch (error) {
    console.warn("localStorage not available:", error);
    return null;
  }
};

// Helper to safely set to localStorage
export const setToStorage = (key, value) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("localStorage not available:", error);
    return false;
  }
};

// Helper to safely remove from localStorage
export const removeFromStorage = (key) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("localStorage not available:", error);
    return false;
  }
};
