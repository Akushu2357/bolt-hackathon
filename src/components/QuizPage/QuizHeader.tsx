import React from 'react';
import { X } from 'lucide-react';

interface QuizHeaderProps {
  title: string;
  current: number;
  total: number;
  progress: number;
  onExit: () => void;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({ title, current, total, progress, onExit }) => (
  <div className="p-4 sm:p-6 border-b border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Question {current} of {total}
        </p>
      </div>
      <button
        onClick={onExit}
        className="btn-secondary text-sm px-3 py-2 sm:px-4 sm:py-2"
      >
        <span className="hidden sm:inline">Exit Quiz</span>
        <X className="w-4 h-4 sm:hidden" />
      </button>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

export default QuizHeader;
