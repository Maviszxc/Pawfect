/** @format */

import axios from "axios";
import { BASE_URL } from "../utils/constants";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased from 10s to 15s for slow API responses
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 🐛 DEBUG: Log the full request URL to catch issues
    const fullUrl =
      (config.baseURL ? config.baseURL.replace(/\/$/, "") : "") +
      (config.url ? config.url : "");
    console.log("🔍 Request URL:", fullUrl);
    if (config.params) {
      console.log("🔍 Request params:", config.params);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration and HTML error responses
axiosInstance.interceptors.response.use(
  (response) => {
    // Detect HTML response (e.g. server error, 404 page)
    if (
      typeof response.data === "string" &&
      response.data.trim().startsWith("<!DOCTYPE")
    ) {
      const error = new Error(
        "API returned HTML instead of JSON. Check endpoint and backend."
      );
      error.name = "HTMLResponseError";
      error.response = response;
      throw error;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Improved error logging: show status, url, and message if available
    const status = error.response?.status;
    const url =
      (error.config?.baseURL ? error.config.baseURL.replace(/\/$/, "") : "") +
      (error.config?.url ? error.config.url : "");
    const message =
      error.response?.data?.message ||
      error.message ||
      (error.response?.status === 404
        ? "Endpoint not found (404)"
        : "Unknown error");

    // Log full error details for debugging
    console.error("❌ API Error:", {
      url,
      method: error.config?.method,
      status,
      message,
      errorName: error.name,
      errorCode: error.code,
      isTimeout: error.code === 'ECONNABORTED',
    });
    
    // Also log the raw error for complete context
    if (error.code === 'ECONNABORTED') {
      console.error("⏱️ Request timed out after", error.config?.timeout, "ms");
    }

    // If the error is 401 (Unauthorized) and not already retrying
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // If 404, show a more helpful message
    if (status === 404) {
      error.message = "API endpoint not found (404): " + url;
    }

    // Detect HTML error response
    if (
      error.response &&
      typeof error.response.data === "string" &&
      error.response.data.trim().startsWith("<!DOCTYPE")
    ) {
      error.message =
        "API returned HTML instead of JSON. Check endpoint and backend.";
      error.name = "HTMLResponseError";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
