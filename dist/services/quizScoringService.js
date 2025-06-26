import { GradingService } from './gradingService';
export class QuizScoringService {
    static async calculateScore(quiz, selectedAnswers) {
        let correct = 0;
        let totalQuestions = quiz.questions.length;
        let gradingResults = [];
        // Collect open-ended questions for batch grading
        const openEndedQuestions = [];
        const openEndedIndices = [];
        for (let index = 0; index < quiz.questions.length; index++) {
            const question = quiz.questions[index];
            const userAnswer = selectedAnswers[index];
            const correctAnswer = question.correct_answer;
            switch (question.type) {
                case 'multiple':
                    // Multiple choice: check if arrays match (by value, not reference)
                    const userAnswerArray = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
                    const correctAnswerArray = Array.isArray(correctAnswer) ? [...correctAnswer].sort() : [];
                    const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
                    if (arraysEqual(userAnswerArray, correctAnswerArray)) {
                        correct++;
                    }
                    break;
                case 'true_false':
                    if (userAnswer === correctAnswer) {
                        correct++;
                    }
                    break;
                case 'open_ended':
                    // Collect for batch grading - include question index for proper matching
                    openEndedQuestions.push({
                        question: question.question,
                        answer: userAnswer,
                        context: `Expected answer: ${correctAnswer}`,
                        questionIndex: index // Add this to track original position
                    });
                    openEndedIndices.push(index);
                    break;
                case 'single':
                default: {
                    // Single choice: always compare indices
                    let isCorrect = false;
                    if (Array.isArray(correctAnswer)) {
                        // If correct_answer is an array, check if user's answer matches any of them
                        // For single choice, userAnswer should be an array with one element
                        if (Array.isArray(userAnswer) && userAnswer.length === 1) {
                            isCorrect = correctAnswer.includes(userAnswer[0]);
                        }
                    }
                    else if (typeof correctAnswer === 'number') {
                        // If correct_answer is a number (index), compare with user's selection
                        // For single choice, userAnswer should be an array with one element
                        if (Array.isArray(userAnswer) && userAnswer.length === 1) {
                            isCorrect = userAnswer[0] === correctAnswer;
                        }
                    }
                    else if (typeof correctAnswer === 'string') {
                        // If correct_answer is a string, find its index in options and compare
                        if (question.options && Array.isArray(userAnswer) && userAnswer.length === 1) {
                            const correctIndex = question.options.indexOf(correctAnswer);
                            isCorrect = userAnswer[0] === correctIndex;
                        }
                    }
                    if (isCorrect) {
                        correct++;
                    }
                    break;
                }
            }
        }
        // Grade open-ended questions if any exist
        if (openEndedQuestions.length > 0) {
            try {
                const gradingResult = await GradingService.gradeOpenEndedQuestions(openEndedQuestions);
                gradingResults = gradingResult.graded;
                // Add scores from graded open-ended questions
                for (const gradedQuestion of gradingResult.graded) {
                    correct += gradedQuestion.score; // Use the actual score (0-1)
                }
            }
            catch (error) {
                console.error('Error grading open-ended questions:', error);
                // Give partial credit for open-ended questions if grading fails
                correct += openEndedQuestions.length * 0.5;
            }
        }
        const finalScore = Math.round((correct / totalQuestions) * 100);
        return {
            score: finalScore,
            gradingResults
        };
    }
    static isQuestionCorrect(question, userAnswer, gradingResults) {
        const correctAnswer = question.correct_answer;
        switch (question.type) {
            case 'multiple': {
                // Compare arrays by value, not reference
                const userAnswerArray = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
                const correctAnswerArray = Array.isArray(correctAnswer) ? [...correctAnswer].sort() : [];
                return userAnswerArray.length === correctAnswerArray.length && userAnswerArray.every((v, i) => v === correctAnswerArray[i]);
            }
            case 'true_false':
                return userAnswer === correctAnswer;
            case 'open_ended':
                // For open-ended questions, we need to find the grading result by position
                // This is handled in the component level now
                return false; // Default to false, actual grading is handled elsewhere
            case 'single':
            default: {
                // Single choice: always compare indices
                if (Array.isArray(correctAnswer)) {
                    // If correct_answer is an array, check if user's answer matches any of them
                    // For single choice, userAnswer should be an array with one element
                    if (Array.isArray(userAnswer) && userAnswer.length === 1) {
                        return correctAnswer.includes(userAnswer[0]);
                    }
                }
                else if (typeof correctAnswer === 'number') {
                    // If correct_answer is a number (index), compare with user's selection
                    // For single choice, userAnswer should be an array with one element
                    if (Array.isArray(userAnswer) && userAnswer.length === 1) {
                        return userAnswer[0] === correctAnswer;
                    }
                }
                else if (typeof correctAnswer === 'string') {
                    // If correct_answer is a string, find its index in options and compare
                    if (question.options && Array.isArray(userAnswer) && userAnswer.length === 1) {
                        const correctIndex = question.options.indexOf(correctAnswer);
                        return userAnswer[0] === correctIndex;
                    }
                }
                return false;
            }
        }
    }
    static getAnswerFeedback(question, userAnswer, gradingResults) {
        const isCorrect = this.isQuestionCorrect(question, userAnswer, gradingResults);
        let feedback = question.explanation;
        let improvements = [];
        let weakAreas = [];
        let score;
        // Note: For open-ended questions, specific feedback is now handled at the component level
        // using position-based matching rather than question text matching
        return {
            isCorrect,
            userAnswer,
            correctAnswer: question.correct_answer,
            explanation: feedback,
            improvements,
            weakAreas,
            score
        };
    }
}
