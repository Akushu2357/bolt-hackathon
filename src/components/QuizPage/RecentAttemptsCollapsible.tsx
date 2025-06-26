import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Target, CheckCircle, XCircle } from 'lucide-react';

interface RecentAttemptsCollapsibleProps {
  attempts: any[];
}

const RecentAttemptsCollapsible: React.FC<RecentAttemptsCollapsibleProps> = ({ attempts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lg:hidden mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-xl transition-colors duration-200"
        >
          <div className="flex items-center">
            <Target className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Attempts</h3>
            {attempts.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                {attempts.length}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            {attempts.length === 0 ? (
              <div className="text-center py-6">
                <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No attempts yet</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {attempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="bg-gray-50 rounded-lg p-3">
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
                {attempts.length > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      +{attempts.length - 5} more attempts
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentAttemptsCollapsible;
