import { supabase } from '../lib/supabase';
import { GradingService } from './gradingService';
export class LearningProgressService {
    static async updateLearningProgress(userId, quiz, selectedAnswers, score, gradingResults) {
        const currentWeakAreas = [];
        const currentStrengths = [];
        for (let index = 0; index < quiz.questions.length; index++) {
            const question = quiz.questions[index];
            const userAnswer = selectedAnswers[index];
            const correctAnswer = question.correct_answer;
            let isCorrect = false;
            let gradingResult;
            // Find grading result for open-ended questions by position
            if (question.type === 'open_ended' && gradingResults) {
                const openEndedQuestions = quiz.questions
                    .map((q, idx) => ({ question: q, index: idx }))
                    .filter(item => item.question.type === 'open_ended');
                const currentQuestionOpenEndedIndex = openEndedQuestions.findIndex(item => item.index === index);
                if (currentQuestionOpenEndedIndex >= 0 && currentQuestionOpenEndedIndex < gradingResults.length) {
                    gradingResult = gradingResults[currentQuestionOpenEndedIndex];
                }
            }
            switch (question.type) {
                case 'multiple':
                    const userAnswerArray = Array.isArray(userAnswer) ? userAnswer.sort() : [];
                    const correctAnswerArray = Array.isArray(correctAnswer) ? correctAnswer.sort() : [];
                    isCorrect = JSON.stringify(userAnswerArray) === JSON.stringify(correctAnswerArray);
                    break;
                case 'true_false':
                    isCorrect = userAnswer === correctAnswer;
                    break;
                case 'open_ended':
                    // Use grading results for open-ended questions
                    if (gradingResult) {
                        isCorrect = gradingResult.grade === 'correct';
                    }
                    else {
                        isCorrect = false; // Default to incorrect if no grading results
                    }
                    break;
                case 'single':
                default:
                    // Handle single choice questions properly
                    if (Array.isArray(correctAnswer)) {
                        // If correct_answer is an array, check if user's answer matches any of them
                        if (Array.isArray(userAnswer) && userAnswer.length === 1) {
                            isCorrect = correctAnswer.includes(userAnswer[0]);
                        }
                    }
                    else if (typeof correctAnswer === 'number') {
                        // If correct_answer is a number (index), compare with user's selection
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
                    break;
            }
            // Build answer string safely for all types
            let answerString = '';
            if (question.type === 'open_ended') {
                answerString = typeof userAnswer === 'string' ? userAnswer : '';
            }
            else if (Array.isArray(userAnswer)) {
                answerString = userAnswer
                    .map((value) => question.options && question.options[value] !== undefined ? question.options[value] : value)
                    .join(', ');
            }
            else if (typeof userAnswer === 'boolean') {
                answerString = userAnswer ? 'True' : 'False';
            }
            else if (typeof userAnswer === 'number' &&
                question.options &&
                question.options[userAnswer] !== undefined) {
                answerString = question.options[userAnswer];
            }
            else {
                answerString = String(userAnswer);
            }
            // Create formatted entry: "question: answer" or "question: answer: ai feedback"
            let entryString = `${question.question}: ${answerString}`;
            // For open-ended questions, add AI feedback if available
            if (question.type === 'open_ended' && gradingResult && gradingResult.feedback) {
                entryString += `: ${gradingResult.feedback}`;
            }
            if (isCorrect || (gradingResult && gradingResult.grade === 'partial')) {
                currentStrengths.push(entryString);
            }
            else {
                currentWeakAreas.push(entryString);
                // Add specific weak areas from grading results for open-ended questions
                if (gradingResult && gradingResult.weakAreas && gradingResult.weakAreas.length > 0) {
                    // Format weak areas as concepts, not full question-answer pairs
                    gradingResult.weakAreas.forEach(area => {
                        currentWeakAreas.push(area);
                    });
                }
            }
        }
        // Add general weak areas from grading results (concepts only)
        if (gradingResults && gradingResults.length > 0) {
            const additionalWeakAreas = GradingService.extractWeakAreasFromGrading(gradingResults);
            currentWeakAreas.push(...additionalWeakAreas);
        }
        // Remove duplicates from current session and ensure all items are strings
        const uniqueCurrentWeakAreas = [...new Set(currentWeakAreas.filter(area => typeof area === 'string' && area.trim() !== ''))];
        const uniqueCurrentStrengths = [...new Set(currentStrengths.filter(area => typeof area === 'string' && area.trim() !== ''))];
        try {
            const { data: existingProgress } = await supabase
                .from('learning_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('topic', quiz.topic)
                .maybeSingle();
            if (existingProgress) {
                // Preserve historical data and add new results
                // For weak areas: keep existing ones and add new ones (but remove items that are now strengths)
                const existingWeakAreas = Array.isArray(existingProgress.weak_areas) ? existingProgress.weak_areas.filter((area) => typeof area === 'string') : [];
                const existingStrengths = Array.isArray(existingProgress.strengths) ? existingProgress.strengths.filter((area) => typeof area === 'string') : [];
                // Extract question parts from existing entries to check for improvements
                const getQuestionFromEntry = (entry) => {
                    const colonIndex = entry.indexOf(':');
                    return colonIndex > 0 ? entry.substring(0, colonIndex).trim() : entry;
                };
                // Remove entries from existing weak areas if the same question is now a strength
                const currentStrengthQuestions = uniqueCurrentStrengths.map(getQuestionFromEntry);
                const filteredExistingWeakAreas = existingWeakAreas.filter((area) => !currentStrengthQuestions.includes(getQuestionFromEntry(area)));
                // Remove entries from existing strengths if the same question is now a weak area
                const currentWeakQuestions = uniqueCurrentWeakAreas.map(getQuestionFromEntry);
                const filteredExistingStrengths = existingStrengths.filter((area) => !currentWeakQuestions.includes(getQuestionFromEntry(area)));
                // Merge with current results and ensure all are strings
                const mergedWeakAreas = [...new Set([...filteredExistingWeakAreas, ...uniqueCurrentWeakAreas])].filter(area => typeof area === 'string' && area.trim() !== '');
                const mergedStrengths = [...new Set([...filteredExistingStrengths, ...uniqueCurrentStrengths])].filter(area => typeof area === 'string' && area.trim() !== '');
                // Update existing progress
                await supabase
                    .from('learning_progress')
                    .update({
                    weak_areas: mergedWeakAreas,
                    strengths: mergedStrengths,
                    progress_score: score,
                    last_updated: new Date().toISOString()
                })
                    .eq('id', existingProgress.id);
            }
            else {
                // Create new progress record
                await supabase
                    .from('learning_progress')
                    .insert({
                    user_id: userId,
                    topic: quiz.topic,
                    weak_areas: uniqueCurrentWeakAreas,
                    strengths: uniqueCurrentStrengths,
                    progress_score: score
                });
            }
        }
        catch (error) {
            console.error('Error updating learning progress:', error);
            throw error;
        }
    }
}
