import { supabase } from '../lib/supabase';
import { GradingService, GradedQuestion } from './gradingService';

interface Question {
  id: string;
  question: string;
  options?: string[];
  correct_answer: number | number[] | boolean | string;
  type: 'single' | 'multiple' | 'true_false' | 'open_ended';
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  created_at: string;
}

export class LearningProgressService {
  static async updateLearningProgress(
    userId: string,
    quiz: Quiz,
    selectedAnswers: (number | number[] | boolean | string)[],
    score: number,
    gradingResults?: GradedQuestion[]
  ): Promise<void> {
    const currentWeakAreas: string[] = [];
    const currentStrengths: string[] = [];

    for (let index = 0; index < quiz.questions.length; index++) {
      const question = quiz.questions[index];
      const userAnswer = selectedAnswers[index];
      const correctAnswer = question.correct_answer;
      let isCorrect = false;
      let gradingResult: GradedQuestion | undefined;
      
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
          } else {
            isCorrect = false; // Default to incorrect if no grading results
          }
          break;
        default:
          isCorrect = userAnswer === correctAnswer;
      }

      // Build answer string safely for all types
      let answerString = '';
      if (question.type === 'open_ended') {
        answerString = typeof userAnswer === 'string' ? userAnswer : '';
      } else if (Array.isArray(userAnswer)) {
        answerString = userAnswer
          .map((value) => question.options && question.options[value] !== undefined ? question.options[value] : value)
          .join(', ');
      } else if (typeof userAnswer === 'boolean') {
        answerString = userAnswer ? 'True' : 'False';
      } else if (
        typeof userAnswer === 'number' &&
        question.options &&
        question.options[userAnswer] !== undefined
      ) {
        answerString = question.options[userAnswer];
      } else {
        answerString = String(userAnswer);
      }

      // Create area description with full question text
      const areaString = question.question; // Use full question text instead of truncating
      
      if (isCorrect || (gradingResult && gradingResult.grade === 'partial')) {
        currentStrengths.push(areaString);
      } else {
        currentWeakAreas.push(areaString);
        
        // Add specific weak areas from grading results for open-ended questions
        if (gradingResult && gradingResult.weakAreas && gradingResult.weakAreas.length > 0) {
          currentWeakAreas.push(...gradingResult.weakAreas);
        }
      }
    }

    // Add general weak areas from grading results
    if (gradingResults && gradingResults.length > 0) {
      const additionalWeakAreas = GradingService.extractWeakAreasFromGrading(gradingResults);
      currentWeakAreas.push(...additionalWeakAreas);
    }

    // Remove duplicates from current session
    const uniqueCurrentWeakAreas = [...new Set(currentWeakAreas)];
    const uniqueCurrentStrengths = [...new Set(currentStrengths)];

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
        const existingWeakAreas = existingProgress.weak_areas || [];
        const existingStrengths = existingProgress.strengths || [];
        
        // Remove current strengths from existing weak areas (showing improvement)
        const filteredExistingWeakAreas = existingWeakAreas.filter(
          area => !uniqueCurrentStrengths.includes(area)
        );
        
        // Remove current weak areas from existing strengths (showing regression)
        const filteredExistingStrengths = existingStrengths.filter(
          area => !uniqueCurrentWeakAreas.includes(area)
        );
        
        // Merge with current results
        const mergedWeakAreas = [...new Set([...filteredExistingWeakAreas, ...uniqueCurrentWeakAreas])];
        const mergedStrengths = [...new Set([...filteredExistingStrengths, ...uniqueCurrentStrengths])];
        
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
      } else {
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
    } catch (error) {
      console.error('Error updating learning progress:', error);
      throw error;
    }
  }
}