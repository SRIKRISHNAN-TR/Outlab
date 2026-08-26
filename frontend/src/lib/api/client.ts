import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send session cookies
  headers: { "Content-Type": "application/json" },
});

export const isDemoMode = !API_URL;
