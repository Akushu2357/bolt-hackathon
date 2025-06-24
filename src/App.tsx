import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/QuizResultsPage/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import QuizPage from './pages/QuizPage';
import QuizResultsPage from './pages/QuizResultsPage';
import ProfilePage from './pages/ProfilePage';
import LoadingSpinner from './components/QuizResultsPage/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}

// New component for routes that work for both guest and authenticated users
function GuestOrAuthRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth page - only for non-authenticated users */}
      <Route path="/auth" element={
        <PublicRoute>
          <AuthPage />
        </PublicRoute>
      } />
      
      {/* Default route redirects to home */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      {/* Home page - accessible to both guest and authenticated users */}
      <Route path="/home" element={
        <GuestOrAuthRoute>
          <Layout>
            <HomePage />
          </Layout>
        </GuestOrAuthRoute>
      } />
      
      {/* Chat page - accessible to both guest and authenticated users */}
      <Route path="/chat" element={
        <GuestOrAuthRoute>
          <Layout>
            <ChatPage />
          </Layout>
        </GuestOrAuthRoute>
      } />

      <Route path="/chat/:sessionId" element={
        <GuestOrAuthRoute>
          <Layout>
            <ChatPage />
          </Layout>
        </GuestOrAuthRoute>
      } />

      {/* Quiz page - accessible to both guest and authenticated users */}
      <Route path="/quiz" element={
        <GuestOrAuthRoute>
          <Layout>
            <QuizPage />
          </Layout>
        </GuestOrAuthRoute>
      } />
      
      {/* Quiz results - accessible to both guest and authenticated users */}
      <Route path="/quiz-results" element={
        <GuestOrAuthRoute>
          <Layout>
            <QuizResultsPage />
          </Layout>
        </GuestOrAuthRoute>
      } />
      
      {/* Profile page - only for authenticated users */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;