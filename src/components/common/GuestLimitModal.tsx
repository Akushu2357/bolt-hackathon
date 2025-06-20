import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, LogIn, Star } from 'lucide-react';
import { GuestLimitService } from '../../services/guestLimitService';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'chat' | 'quiz' | 'quizAttempt' | 'results';
  title?: string;
  message?: string;
}

export default function GuestLimitModal({ 
  isOpen, 
  onClose, 
  limitType, 
  title, 
  message 
}: GuestLimitModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/auth');
  };

  const getDefaultContent = () => {
    const usage = GuestLimitService.getUsageSummary();
    
    switch (limitType) {
      case 'chat':
        return {
          title: 'Chat Limit Reached',
          message: `You've used all ${usage.chats.total} free chat messages. Login to get unlimited access to our AI tutor!`,
          icon: <Lock className="w-12 h-12 text-primary-500" />
        };
      case 'quiz':
        return {
          title: 'Quiz Generation Limit Reached',
          message: `You've generated ${usage.quizzes.total} free quizzes. Login to create unlimited custom quizzes!`,
          icon: <Lock className="w-12 h-12 text-primary-500" />
        };
      case 'quizAttempt':
        return {
          title: 'Quiz Attempt Limit Reached',
          message: `You've taken ${usage.quizAttempts.total} free quiz attempts. Login to take unlimited quizzes!`,
          icon: <Lock className="w-12 h-12 text-primary-500" />
        };
      case 'results':
        return {
          title: 'Detailed Results Locked',
          message: 'Login to view detailed quiz analysis, track your progress, and access personalized learning insights!',
          icon: <Lock className="w-12 h-12 text-primary-500" />
        };
      default:
        return {
          title: 'Feature Locked',
          message: 'Login to access this feature and unlock the full TutorAI experience!',
          icon: <Lock className="w-12 h-12 text-primary-500" />
        };
    }
  };

  const content = {
    title: title || getDefaultContent().title,
    message: message || getDefaultContent().message,
    icon: getDefaultContent().icon
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="mb-4">
            {content.icon}
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {content.title}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {content.message}
          </p>

          {/* Usage Summary for non-results limits */}
          {limitType !== 'results' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Your Usage</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Chat Messages:</span>
                  <span className="font-medium">
                    {usage.chats.used}/{usage.chats.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Quiz Generation:</span>
                  <span className="font-medium">
                    {usage.quizzes.used}/{usage.quizzes.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Quiz Attempts:</span>
                  <span className="font-medium">
                    {usage.quizAttempts.used}/{usage.quizAttempts.total}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Login for Unlimited Access</span>
            </button>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Free account • No credit card required</span>
            </div>
            
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors duration-200"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}