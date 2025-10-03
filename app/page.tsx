"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Add a small delay to make sure localStorage is available
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
        console.log("Root page - Auth check:", isAuthenticated);
        
        if (isAuthenticated) {
          router.push("/main");
        } else {
          router.push("/login");
        }
        setIsChecking(false);
      }
    };

    // Small delay to make sure proper hydration
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  // Show loading while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">
        {isChecking ? "Checking authentication..." : "Redirecting..."}
      </div>
    </div>
  );
}
