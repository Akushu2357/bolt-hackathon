import React from 'react';
import { Play, Clock, List } from 'lucide-react';

interface QuizListProps {
  quizzes: any[];
  onStart: (quiz: any) => void;
  getDifficultyColor: (difficulty: string) => string;
}

// Function to calculate estimated time for completing a quiz
const calculateEstimatedTime = (questionCount: number): string => {
  // Estimate based on question types and typical completion times
  // Single/Multiple choice: ~30-45 seconds per question
  // True/False: ~20-30 seconds per question  
  // Open-ended: ~2-3 minutes per question
  // Using average of ~60 seconds per question for mixed question types
  const baseTimePerQuestion = 0.75; // 1 minute per question as base estimate
  const totalMinutes = questionCount * baseTimePerQuestion;
  
  if (totalMinutes < 1) {
    return '< 1 min';
  } else if (totalMinutes === 1) {
    return '1 min';
  } else if (totalMinutes < 60) {
    return `${totalMinutes} mins`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
};

const QuizList: React.FC<QuizListProps> = ({ quizzes, onStart, getDifficultyColor }) => (
  <div className="space-y-4">
    {quizzes.map((quiz) => (
      <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{quiz.title}</h3>
            <p className="text-gray-600 mb-2">{quiz.topic}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                {quiz.difficulty}
              </span>
              <span className="flex items-center">
                <List className="w-4 h-4 mr-1" />
                {quiz.questions.length} questions
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                ~{calculateEstimatedTime(quiz.questions.length)}
              </span>
            </div>
          </div>
          <button
            onClick={() => onStart(quiz)}
            className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Play className="w-4 h-4" />
            <span>Start</span>
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default QuizList;
