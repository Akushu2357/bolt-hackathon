import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const QuizQuestion = ({ question, renderInput }) => (_jsxs("div", { className: "mb-6 sm:mb-8", children: [_jsx("div", { className: "flex items-start space-x-3 mb-4", children: _jsx("div", { className: `px-2 py-1 rounded text-xs font-medium ${question.type === 'single' ? 'bg-blue-100 text-blue-700' :
                    question.type === 'multiple' ? 'bg-green-100 text-green-700' :
                        question.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'}`, children: question.type === 'single' ? 'Single Choice' :
                    question.type === 'multiple' ? 'Multiple Choice' :
                        question.type === 'true_false' ? 'True/False' :
                            'Open Answer' }) }), _jsx("h2", { className: "text-lg sm:text-xl font-semibold text-gray-900 mb-6", children: question.question }), renderInput(question)] }));
export default QuizQuestion;
