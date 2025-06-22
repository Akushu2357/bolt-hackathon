import React from 'react';

interface QuizQuestionProps {
  question: any;
  renderInput: (q: any) => React.ReactNode;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, renderInput }) => (
  <div className="mb-6 sm:mb-8">
    <div className="flex items-start space-x-3 mb-4">
      <div className={`px-2 py-1 rounded text-xs font-medium ${
        question.type === 'single' ? 'bg-blue-100 text-blue-700' :
        question.type === 'multiple' ? 'bg-green-100 text-green-700' :
        question.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
        'bg-orange-100 text-orange-700'
      }`}>
        {question.type === 'single' ? 'Single Choice' :
         question.type === 'multiple' ? 'Multiple Choice' :
         question.type === 'true_false' ? 'True/False' :
         'Open Answer'}
      </div>
    </div>
    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
      {question.question}
    </h2>
    {renderInput(question)}
  </div>
);

export default QuizQuestion;