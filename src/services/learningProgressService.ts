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
    const weakAreas: string[] = [];
    const strengths: string[] = [];

    for (let index = 0; index < quiz.questions.length; index++) {
      const question = quiz.questions[index];
      const userAnswer = selectedAnswers[index];
      const correctAnswer = question.correct_answer;
      let isCorrect = false;
      let gradingResult: GradedQuestion | undefined;
      
      // Find grading result for open-ended questions
      if (question.type === 'open_ended' && gradingResults) {
        gradingResult = gradingResults.find(r => r.question === question.question);
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
      
      if (isCorrect) {
        strengths.push(areaString);
      } else {
        weakAreas.push(areaString);
        
        // Add specific weak areas from grading results for open-ended questions
        if (gradingResult && gradingResult.weakAreas && gradingResult.weakAreas.length > 0) {
          weakAreas.push(...gradingResult.weakAreas);
        }
      }
    }

    // Add general weak areas from grading results
    if (gradingResults && gradingResults.length > 0) {
      const additionalWeakAreas = GradingService.extractWeakAreasFromGrading(gradingResults);
      weakAreas.push(...additionalWeakAreas);
    }

    // Remove duplicates
    const uniqueWeakAreas = [...new Set(weakAreas)];
    const uniqueStrengths = [...new Set(strengths)];

    try {
      const { data: existingProgress } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', quiz.topic)
        .maybeSingle();

      if (existingProgress) {
        // Merge with existing weak areas and strengths
        const mergedWeakAreas = [...new Set([...existingProgress.weak_areas, ...uniqueWeakAreas])];
        const mergedStrengths = [...new Set([...existingProgress.strengths, ...uniqueStrengths])];
        
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
            weak_areas: uniqueWeakAreas,
            strengths: uniqueStrengths,
            progress_score: score
          });
      }
    } catch (error) {
      console.error('Error updating learning progress:', error);
      throw error;
    }
  }
}