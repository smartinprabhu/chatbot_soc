"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppProvider } from '@/components/dashboard/app-provider';
import Header from '@/components/dashboard/header';
import MainContent from '@/components/dashboard/main-content';

export default function MainPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const authStatus = localStorage.getItem("isAuthenticated") === "true";
        console.log("Main page - Auth check:", authStatus);
        setIsAuthenticated(authStatus);
        
        if (!authStatus) {
          router.push("/login");
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <Header onLogout={handleLogout} />
        <MainContent />
      </div>
    </AppProvider>
  );
}