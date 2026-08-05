import axios from "axios";
import { API_URL } from "../config.js";

const api = axios.create({
  baseURL: API_URL,
});

// This runs before every request automatically
// It grabs the token from localStorage and attaches it to the header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
