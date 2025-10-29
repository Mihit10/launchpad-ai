"use client";
import { createContext, useContext, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Create Context
export const AuthContext = createContext<null>(null);

// Context Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get fresh token and update localStorage
        try {
          const token = await user.getIdToken(true);
          localStorage.setItem("lpai_token", token);
          localStorage.setItem("lpai_uid", user.uid);
        } catch (err) {
          console.error("Error refreshing token:", err);
        }
      } else {
        // Clear tokens on sign out
        localStorage.removeItem("lpai_token");
        localStorage.removeItem("lpai_uid");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}