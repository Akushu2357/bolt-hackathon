import React from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { QuizChatContext } from '../../services/quizChatIntegrationService';

interface QuizSuggestedPromptsProps {
  quizContext: QuizChatContext;
  onPromptSelect: (prompt: string) => void;
}

export default function QuizSuggestedPrompts({ quizContext, onPromptSelect }: QuizSuggestedPromptsProps) {
  const getSuggestedPrompts = () => {
    const prompts: string[] = [];

    // Performance-based prompts
    if (quizContext.score < 60) {
      prompts.push(`I scored ${quizContext.score}% on my ${quizContext.topic} quiz. Can you help me understand the key concepts I'm missing?`);
      prompts.push(`Can you explain the fundamentals of ${quizContext.topic} in simple terms?`);
    } else if (quizContext.score < 80) {
      prompts.push(`I got ${quizContext.score}% on my ${quizContext.topic} quiz. Can you help me improve my understanding?`);
      prompts.push(`I have a decent grasp of ${quizContext.topic} but made some mistakes. Can you help me fill the gaps?`);
    } else {
      prompts.push(`I did well on my ${quizContext.topic} quiz (${quizContext.score}%), but I want to deepen my understanding. What advanced topics should I explore?`);
      prompts.push(`Can you give me more challenging questions about ${quizContext.topic}?`);
    }

    // Weak area specific prompts
    if (quizContext.weakAreas.length > 0) {
      const topWeakAreas = quizContext.weakAreas.slice(0, 3);
      prompts.push(`I need help understanding: ${topWeakAreas.join(', ')}`);
      if (topWeakAreas.length > 0) {
        prompts.push(`Can you explain ${topWeakAreas[0]} in detail with examples?`);
      }
    }

    // Question-specific prompts
    if (quizContext.incorrectQuestions.length > 0) {
      const firstIncorrect = quizContext.incorrectQuestions[0];
      prompts.push(`I got this question wrong: "${firstIncorrect.question}". Can you explain why the correct answer is "${firstIncorrect.correctAnswer}"?`);
    }

    return prompts.slice(0, 6); // Limit to 6 suggestions
  };

  const prompts = getSuggestedPrompts();

  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl border border-blue-200 p-4 mb-4">
      <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
        <MessageCircle className="w-4 h-4 mr-2" />
        Suggested Questions About Your Quiz:
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt)}
            className="text-left p-3 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200 text-sm text-blue-800 hover:text-blue-900 group"
          >
            <div className="flex items-center justify-between">
              <span className="flex-1 pr-2">{prompt}</span>
              <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}