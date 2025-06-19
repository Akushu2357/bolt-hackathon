import React from 'react';
import { Brain, Lightbulb } from 'lucide-react';

interface PerformanceAnalysisProps {
  loadingAnalysis: boolean;
  analysisText: string;
}

export default function PerformanceAnalysis({ loadingAnalysis, analysisText }: PerformanceAnalysisProps) {
  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-blue-50 rounded-xl shadow-lg border border-primary-200 p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-blue-500/5 pointer-events-none"></div>
      <div className="relative">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Performance Analysis</h2>
        </div>
        {loadingAnalysis ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-gray-600">Analyzing your performance...</span>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm border border-primary-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start">
              <Lightbulb className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-primary-800 leading-relaxed">{analysisText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
