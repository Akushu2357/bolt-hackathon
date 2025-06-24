import React from 'react';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex max-w-3xl">
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Bot className="w-4 h-4 text-gray-600" />
          </div>
        </div>
        <div className="px-4 py-3 rounded-lg bg-gray-100">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}