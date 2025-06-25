import React from 'react';
import { Trophy, CheckCircle, XCircle, Star, Eye, EyeOff, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ScoreOverviewProps {
  actualScore: number;
  correctCount: number;
  totalQuestions: number;
  showAnswers: boolean;
  setShowAnswers: (show: boolean) => void;
  retakeQuiz: () => void;
  partialCount?: number; // Add partial count for AI graded questions
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number) => {
  if (score >= 90) return 'bg-green-50 border-green-200';
  if (score >= 80) return 'bg-blue-50 border-blue-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
};

export default function ScoreOverview({ 
  actualScore, 
  correctCount, 
  totalQuestions, 
  showAnswers, 
  setShowAnswers, 
  retakeQuiz,
  partialCount = 0
}: ScoreOverviewProps) {
  const { user } = useAuth();
  const incorrectCount = totalQuestions - correctCount - partialCount;
  
  return (
    <div className={`card mb-6 sm:mb-8 ${getScoreBgColor(actualScore)}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Trophy className={`w-12 h-12 sm:w-16 sm:h-16 ${
            actualScore >= 90 ? 'text-yellow-500' : 
            actualScore >= 80 ? 'text-blue-500' : 
            actualScore >= 60 ? 'text-yellow-600' : 'text-red-500'
          }`} />
        </div>
        <div className={`text-4xl sm:text-5xl font-bold mb-2 ${getScoreColor(actualScore)}`}>{actualScore}%</div>
        <p className="text-lg text-gray-700 mb-4">
          {partialCount > 0 ? (
            <>
              {correctCount} correct, {partialCount} partial credit, {incorrectCount} incorrect out of {totalQuestions} questions
            </>
          ) : (
            <>
              {correctCount} out of {totalQuestions} questions correct
            </>
          )}
        </p>
        
        <div className={`grid ${partialCount > 0 ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-4 mb-6`}>
          <div className="text-center p-3 bg-white rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          
          {partialCount > 0 && (
            <div className="text-center p-3 bg-white rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-yellow-600">{partialCount}</div>
              <div className="text-sm text-gray-600">Partial Credit</div>
            </div>
          )}
          
          <div className="text-center p-3 bg-white rounded-lg">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-red-600">{incorrectCount}</div>
            <div className="text-sm text-gray-600">Incorrect</div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg">
            <Star className="w-6 h-6 text-primary-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-primary-600">{actualScore}%</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`btn-primary flex items-center justify-center space-x-2 ${!user ? 'opacity-75' : ''}`}
          >
            {!user && <Lock className="w-4 h-4" />}
            {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAnswers ? 'Hide' : 'Show'} {user ? 'Answers' : 'Detailed Results'}</span>
          </button>
          <button
            onClick={retakeQuiz}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz Jaa</span>
          </button>

          {/*เพิ่มตรงนี้*/}
          
        </div>
        
        {!user && (
          <p className="text-sm text-gray-600 mt-4">
            Login to view detailed explanations and track your progress over time
          </p>
        )}
      </div>
    </div>
  );
}