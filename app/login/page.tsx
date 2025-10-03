"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InteractiveLogin from "@/components/auth/interactive-login";

export default function LoginPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const authStatus = localStorage.getItem("isAuthenticated") === "true";
        console.log("Login page - Auth check:", authStatus);
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          router.push("/main");
        }
      }
    };

    checkAuth();
  }, [router]);

  // Auth handler for InteractiveLogin
  const handleLogin = (username: string, password: string) => {
    console.log("Login attempt:", username);
    // Authentication check
    if (username === 'admin' && password === 'demo') {
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
      console.log("Login successful, redirecting to main");
      router.push("/main");
    } else {
      // Handle incorrect credentials
      alert("Incorrect credentials. Use admin/demo");
    }
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't show login if already authenticated
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Already logged in, redirecting...</div>
      </div>
    );
  }

  return (
    <InteractiveLogin onLogin={handleLogin} />
  );
}