import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
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
