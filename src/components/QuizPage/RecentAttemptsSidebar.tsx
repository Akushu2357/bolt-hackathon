import React from 'react';
import { Target, CheckCircle, XCircle } from 'lucide-react';

interface RecentAttemptsSidebarProps {
  attempts: any[];
}

const RecentAttemptsSidebar: React.FC<RecentAttemptsSidebarProps> = ({ attempts }) => (
  <div className="hidden lg:block lg:w-80">
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <Target className="w-5 h-5 text-gray-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Recent Attempts</h2>
        {attempts.length > 0 && (
          <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
            {attempts.length}
          </span>
        )}
      </div>
      {attempts.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <Target className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No attempts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                  {attempt.quiz.title}
                </h4>
                <div className={`flex items-center ${
                  attempt.score >= 80 ? 'text-green-600' : 
                  attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {attempt.score >= 80 ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">{attempt.score}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(attempt.completed_at).toLocaleDateString()} at {new Date(attempt.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default RecentAttemptsSidebar;
