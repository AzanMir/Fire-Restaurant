"use client";

import { useAuth as useAuthContext } from "@/context/AuthContext";
export { useAuthContext as useAuth };
export default function useAuth() {
  return useAuthContext();
}
