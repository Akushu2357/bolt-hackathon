import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecommendationsProps {
  actualScore: number;
  quizTopic: string;
}

export default function Recommendations({ actualScore, quizTopic }: RecommendationsProps) {
  const navigate = useNavigate();
  return (
    <div className="card mt-6 sm:mt-8">
      <div className="flex items-center mb-4">
        <TrendingUp className="w-6 h-6 text-primary-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Next Steps</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
          <h3 className="font-medium text-primary-900 mb-2">Continue Learning</h3>
          <p className="text-sm text-primary-700 mb-3">
            {actualScore >= 80 
              ? 'Try a more challenging quiz or explore advanced topics.'
              : 'Review the concepts you missed and practice similar questions.'
            }
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ask AI Tutor →
          </button>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-medium text-green-900 mb-2">Practice More</h3>
          <p className="text-sm text-green-700 mb-3">
            Take more quizzes on {quizTopic} to reinforce your learning.
          </p>
          <button
            onClick={() => navigate('/quiz')}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            More Quizzes →
          </button>
        </div>
      </div>
    </div>
  );
}
