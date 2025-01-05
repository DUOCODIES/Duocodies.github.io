import React, { useEffect, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AuthForm } from './components/auth/AuthForm';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function AuthenticatedApp() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ErrorBoundary fallback={<div>Something went wrong. Please try refreshing the page.</div>}>
        <Sidebar />
        <main className="flex-1">
          <Dashboard />
        </main>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  const { user, loading, initialized } = useAuthStore();

  // Show loading spinner until auth is initialized
  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <ErrorBoundary fallback={<div>Authentication error. Please try again.</div>}>
        <AuthForm />
      </ErrorBoundary>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthenticatedApp />
    </Suspense>
  );
}

export default App;