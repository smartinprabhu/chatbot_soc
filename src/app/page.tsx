"use client";

import { useState, useEffect } from 'react';
import { AppProvider } from '@/components/dashboard/app-provider';
import Header from '@/components/dashboard/header';
import MainContent from '@/components/dashboard/main-content';
import InteractiveLogin from '@/components/auth/interactive-login';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('dashboard-auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string, password: string) => {
    // Simple authentication check
    if (username === 'admin' && password === 'demo') {
      setIsAuthenticated(true);
      localStorage.setItem('dashboard-auth', 'true');
    }
  };

  const handleLogout = () => {
    console.log('Logout triggered'); // Debug log
    setIsAuthenticated(false);
    localStorage.removeItem('dashboard-auth');
    // Force a page refresh to ensure clean state
    window.location.reload();
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <InteractiveLogin onLogin={handleLogin} />;
  }

  // Show main dashboard if authenticated
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-background text-foreground font-body">
        <Header onLogout={handleLogout} />
        <MainContent />
      </div>
    </AppProvider>
  );
}
