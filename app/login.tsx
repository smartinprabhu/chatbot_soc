"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import InteractiveLogin from "@/components/auth/interactive-login";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, redirect to main page
    if (typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true") {
      router.push("/main");
    }
  }, [router]);

  // Auth handler for InteractiveLogin
  const handleLogin = (username: string, password: string) => {
    // Simple authentication check (you can customize this)
    if (username === 'admin' && password === 'demo') {
      localStorage.setItem("isAuthenticated", "true");
      router.push("/main");
    } else {
      // Handle invalid credentials
      alert("Invalid credentials. Use admin/demo");
    }
  };

  // Don't render login if already authenticated
  if (typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true") {
    return null;
  }

  return (
    <InteractiveLogin onLogin={handleLogin} />
  );
}
