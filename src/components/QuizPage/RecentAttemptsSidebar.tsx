import React from 'react';
import { X, Target, CheckCircle, XCircle } from 'lucide-react';

interface RecentAttemptsSidebarProps {
  attempts: any[];
  showSidebar: boolean;
  onClose: () => void;
}

const RecentAttemptsSidebar: React.FC<RecentAttemptsSidebarProps> = ({ attempts, showSidebar, onClose }) => (
  <div className={`lg:w-80 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
    {showSidebar && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose}></div>
    )}
    <div className={`${showSidebar ? 'fixed right-0 top-0 h-full w-80 bg-white z-50 p-4 overflow-y-auto lg:relative lg:z-auto lg:p-0 lg:bg-transparent' : ''}`}>
      {showSidebar && (
        <div className="flex justify-between items-center mb-4 lg:hidden">
          <h3 className="text-lg font-semibold">Recent Attempts</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 hidden lg:block">Recent Attempts</h2>
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
                  {new Date(attempt.completed_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default RecentAttemptsSidebar;
