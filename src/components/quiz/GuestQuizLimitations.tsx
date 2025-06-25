import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Star, LogIn, MessageCircle, BarChart3, Brain } from 'lucide-react';

interface GuestQuizLimitationsProps {
  score: number;
  totalQuestions: number;
  correctCount: number;
  onRetakeQuiz: () => void;
}

export default function GuestQuizLimitations({ 
  score, 
  totalQuestions, 
  correctCount, 
  onRetakeQuiz 
}: GuestQuizLimitationsProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Basic Score Display */}
      <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="text-4xl font-bold text-gray-700 mb-2">{score}%</div>
        <p className="text-gray-600">
          {correctCount} out of {totalQuestions} questions correct
        </p>
      </div>

      {/* Premium Features Preview */}
      <div className="bg-gradient-to-br from-primary-50 via-white to-blue-50 rounded-xl border border-primary-200 p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unlock Detailed Analysis
          </h3>
          <p className="text-gray-600">
            Get personalized feedback, AI tutoring, and track your progress
          </p>
        </div>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">AI Analysis</h4>
            <p className="text-sm text-gray-600">Detailed feedback on each answer</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">AI Tutoring</h4>
            <p className="text-sm text-gray-600">Unlimited chat with AI tutor</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Progress Tracking</h4>
            <p className="text-sm text-gray-600">Track improvement over time</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/auth')}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign Up for Free Analysis</span>
          </button>
          <button
            onClick={onRetakeQuiz}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Retake Quiz</span>
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>Free account • No credit card required</span>
        </div>
      </div>

      {/* Limited Chat Access */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <MessageCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Limited Chat Access</h4>
            <p className="text-sm text-yellow-700 mb-3">
              You have 5 free chat messages to ask basic questions about this quiz.
            </p>
            <button
              onClick={() => navigate('/chat', {
                state: {
                  fromQuiz: true,
                  guestMode: true,
                  quizScore: score
                }
              })}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded transition-colors duration-200"
            >
              Ask AI Tutor →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}