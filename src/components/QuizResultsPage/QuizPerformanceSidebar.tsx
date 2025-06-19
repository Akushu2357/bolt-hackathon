import React from 'react';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import type { QuizStats } from '../../pages/QuizResultsPage';

interface QuizPerformanceSidebarProps {
  loadingStats: boolean;
  quizStats: QuizStats | null;
  actualScore: number;
  correctCount: number;
  totalQuestions: number;
  quizDifficulty: string;
}

export default function QuizPerformanceSidebar({ loadingStats, quizStats, actualScore, correctCount, totalQuestions, quizDifficulty }: QuizPerformanceSidebarProps) {
  return (
    <div className="card sticky top-8">
      <div className="flex items-center mb-4">
        <BarChart3 className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Quiz Performance</h2>
      </div>
      {loadingStats ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-gray-600">Loading stats...</span>
        </div>
      ) : quizStats ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Overall Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{quizStats.totalQuizzes}</div>
                <div className="text-xs text-blue-700">Total Quizzes</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{quizStats.averageScore}%</div>
                <div className="text-xs text-green-700">Average Score</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg col-span-2">
                <div className="text-lg font-bold text-yellow-600">{quizStats.bestScore}%</div>
                <div className="text-xs text-yellow-700">Best Score</div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Quiz</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Accuracy</span>
                <span className="text-sm font-medium">{actualScore}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Questions</span>
                <span className="text-sm font-medium">{correctCount}/{totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Difficulty</span>
                <span className={`text-sm font-medium px-2 py-1 rounded text-xs ${
                  quizDifficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  quizDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {quizDifficulty}
                </span>
              </div>
            </div>
          </div>
          {Object.keys(quizStats.topicStats).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Topic Performance</h3>
              <div className="space-y-2">
                {Object.entries(quizStats.topicStats).slice(0, 4).map(([topic, stats]) => (
                  <div key={topic} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{topic}</div>
                      <div className="text-xs text-gray-500">{stats.count} quiz{stats.count !== 1 ? 'es' : ''}</div>
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {stats.avgScore}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {quizStats.recentAttempts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Attempts</h3>
              <div className="space-y-2">
                {quizStats.recentAttempts.slice(0, 3).map((attempt, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                        {attempt.title}
                      </div>
                      <div className={`text-sm font-medium ${
                        attempt.score >= 80 ? 'text-green-600' : 
                        attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {attempt.score}%
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">{attempt.topic}</div>
                      <div className="text-xs text-gray-500">{attempt.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-primary-50 via-white to-blue-50 rounded-lg border border-primary-200 p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-blue-600 rounded flex items-center justify-center mr-2">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-primary-900">Performance Insight</span>
              </div>
              <p className="text-xs text-primary-700">
                {actualScore > quizStats.averageScore 
                  ? `Great job! This score is ${actualScore - quizStats.averageScore}% above your average.`
                  : actualScore === quizStats.averageScore
                  ? 'This score matches your average performance.'
                  : `This score is ${quizStats.averageScore - actualScore}% below your average. Keep practicing!`
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <PieChart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No statistics available</p>
        </div>
      )}
    </div>
  );
}
