/*
  # Generate Quiz Questions API

  1. Endpoint
    - POST /functions/v1/generate-questions
    - Generates quiz questions using Groq AI API

  2. Request Body
    - `topic` (string, required): The subject topic
    - `difficulty` (string, required): easy | medium | hard
    - `contexts` (string[], optional): Weak areas to focus on
    - `settings` (object, optional): Quiz generation settings
      - `numberOfQuestions` (number): Number of questions to generate
      - `numberOfChoices` (number): Number of choices for multiple choice questions
      - `questionTypes` (object): Types of questions to include
        - `multipleChoice` (boolean): Include multiple choice questions
        - `trueFalse` (boolean): Include true/false questions
        - `openEnded` (boolean): Include open-ended questions

  3. Response
    - Returns array of quiz questions with multiple choice answers
    - Includes explanations for wrong answers
    - Supports single choice, multiple choice, true/false, and open-ended questions
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface QuizSettings {
  numberOfQuestions: number;
  numberOfChoices: number;
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    openEnded: boolean;
  };
}

interface QuestionRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  contexts?: string[];
  settings?: QuizSettings;
}

interface QuizQuestion {
  question: string;
  choices?: string[];
  answer: string | string[] | boolean;
  wrongAnswers?: Record<string, string>;
  type: 'single' | 'multiple' | 'true_false' | 'open_ended';
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const body: QuestionRequest = await req.json()
    
    // Validate required fields
    if (!body.topic || !body.difficulty) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: topic and difficulty are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate difficulty level
    if (!['easy', 'medium', 'hard'].includes(body.difficulty)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid difficulty level. Must be: easy, medium, or hard' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set default settings
    const settings: QuizSettings = {
      numberOfQuestions: 5,
      numberOfChoices: 4,
      questionTypes: {
        multipleChoice: true,
        trueFalse: false,
        openEnded: false
      },
      ...body.settings
    }

    // Validate at least one question type is selected
    const hasSelectedType = Object.values(settings.questionTypes).some(Boolean);
    if (!hasSelectedType) {
      return new Response(
        JSON.stringify({ error: 'At least one question type must be selected' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the prompt
    const { topic, difficulty, contexts = [] } = body
    
    // Build question type instructions
    const questionTypeInstructions = [];
    if (settings.questionTypes.multipleChoice) {
      questionTypeInstructions.push(`Multiple choice questions with ${settings.numberOfChoices} options each`);
    }
    if (settings.questionTypes.trueFalse) {
      questionTypeInstructions.push('True/False questions');
    }
    if (settings.questionTypes.openEnded) {
      questionTypeInstructions.push('Open-ended questions that require written answers');
    }

    // Helper to generate questions from Groq
    async function generateGroqQuestions(prompt: string): Promise<QuizQuestion[]> {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are an AI tutor that generates quiz questions. Always respond with valid JSON in the exact format requested. Do not include any additional text or formatting outside the JSON array. Support single-answer multiple choice, multiple-answer multiple choice, true/false, and open-ended questions. For multiple-answer questions, each answer must be an individual choice that exactly matches one option in the choices array. For true/false questions, use boolean values. For open-ended questions, provide comprehensive model answers.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 3800,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Groq API error: ' + errorText);
      }
      const groqResponse = await response.json();
      const generatedContent = groqResponse.choices?.[0]?.message?.content;
      if (!generatedContent) throw new Error('No content in Groq response');
      
      let questions: QuizQuestion[];
      try {
        // First, try to extract JSON array using regex
        const jsonMatch = generatedContent.match(/\[[\s\S]*\]/)
        
        if (!jsonMatch) {
          console.error('No JSON array found in Groq response:', generatedContent);
          throw new Error('Groq response does not contain a valid JSON array format');
        }
        
        const jsonString = jsonMatch[0];
        
        // Validate that we have a non-empty string
        if (!jsonString || jsonString.trim().length === 0) {
          console.error('Empty JSON string extracted from Groq response');
          throw new Error('Extracted JSON string is empty');
        }
        
        // Try to parse the JSON
        questions = JSON.parse(jsonString);
        
        // Validate that we got an array
        if (!Array.isArray(questions)) {
          console.error('Parsed JSON is not an array:', questions);
          throw new Error('Groq response JSON is not an array');
        }
        
        // Validate that we have at least one question
        if (questions.length === 0) {
          console.error('Groq response contains empty array');
          throw new Error('Groq response contains no questions');
        }
        
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw Groq response:', generatedContent);
        
        // Try to parse the entire content as JSON as a fallback
        try {
          questions = JSON.parse(generatedContent);
          if (!Array.isArray(questions)) {
            throw new Error('Fallback parsing: content is not an array');
          }
        } catch (fallbackError) {
          console.error('Fallback parsing also failed:', fallbackError);
          throw new Error('Failed to parse Groq response as JSON. Response may be malformed.');
        }
      }
      
      return questions;
    }

    // Validate and transform questions
    function validateQuestions(questions: QuizQuestion[], settings: QuizSettings): any[] {
      const validQuestions: any[] = [];
      questions.forEach((question) => {
        if (!question.question || !question.answer || !question.type) return;
        let correctAnswers: number[] | boolean | string;
        let explanation = '';
        switch (question.type) {
          case 'true_false':
            if (typeof question.answer !== 'boolean') return;
            correctAnswers = question.answer;
            if (question.wrongAnswers) {
              const wrongAnswer = question.answer ? 'false' : 'true';
              explanation = `Correct answer: ${question.answer ? 'True' : 'False'}. ${question.wrongAnswers[wrongAnswer] || ''}`;
            } else {
              explanation = `Correct answer: ${question.answer ? 'True' : 'False'}.`;
            }
            break;
          case 'open_ended':
            if (typeof question.answer !== 'string') return;
            correctAnswers = question.answer;
            explanation = `Model answer: ${question.answer}`;
            break;
          default:
            if (!Array.isArray(question.choices)) return;
            if (question.choices.length !== settings.numberOfChoices) return;
            const isMultiple = Array.isArray(question.answer);
            const questionType = isMultiple ? 'multiple' : 'single';
            let correctIndices: number[] = [];
            if (isMultiple) {
              const answerArray = question.answer as string[];
              for (const ans of answerArray) {
                const answerIndex = question.choices!.indexOf(ans);
                if (answerIndex === -1) return;
                correctIndices.push(answerIndex);
              }
            } else {
              const answerString = question.answer as string;
              const correctIndex = question.choices.indexOf(answerString);
              if (correctIndex === -1) return;
              correctIndices = [correctIndex];
            }
            correctAnswers = correctIndices;
            const explanationParts = [];
            if (isMultiple) {
              explanationParts.push(`Correct answers: ${(question.answer as string[]).join(', ')}.`);
            } else {
              explanationParts.push(`Correct answer: ${question.answer}.`);
            }
            if (question.wrongAnswers) {
              Object.entries(question.wrongAnswers).forEach(([choice, explanationText]) => {
                explanationParts.push(`${choice}: ${explanationText}`);
              });
            }
            explanation = explanationParts.join(' ');
            question.type = questionType as any;
            break;
        }
        validQuestions.push({
          id: `q${validQuestions.length + 1}`,
          question: question.question,
          options: question.choices || undefined,
          correct_answer: correctAnswers,
          type: question.type,
          explanation: explanation
        });
      });
      return validQuestions;
    }

    // Create base prompt template
    function createPrompt(numQuestions: number): string {
      return `
Generate ${numQuestions} quiz questions for the topic "${topic}" at ${difficulty} difficulty level.
${contexts.length ? `Focus on these weak areas: ${contexts.join(', ')}` : ''}

Create questions using these types: ${questionTypeInstructions.join(', ')}.

Provide questions in this exact JSON format:
[
  {
    "question": "What is the value of x in the equation 2x + 5 = 11?",
    "choices": ["x = 2", "x = 3", "x = 4", "x = 5"],
    "answer": "x = 3",
    "type": "single",
    "wrongAnswers": {
      "x = 2": "If x = 2, then 2(2) + 5 = 9, not 11",
      "x = 4": "If x = 4, then 2(4) + 5 = 13, not 11", 
      "x = 5": "If x = 5, then 2(5) + 5 = 15, not 11"
    }
  },
  {
    "question": "Which of the following are prime numbers? (Select all that apply)",
    "choices": ["2", "4", "7", "9"],
    "answer": ["2", "7"],
    "type": "multiple",
    "wrongAnswers": {
      "4": "4 is not prime because it can be divided by 2",
      "9": "9 is not prime because it can be divided by 3"
    }
  },
  {
    "question": "The Earth revolves around the Sun.",
    "answer": true,
    "type": "true_false",
    "wrongAnswers": {
      "false": "This is incorrect. The Earth does revolve around the Sun in an elliptical orbit."
    }
  },
  {
    "question": "Explain the process of photosynthesis in plants.",
    "answer": "Photosynthesis is the process by which plants convert light energy into chemical energy. Plants use chlorophyll to capture sunlight, carbon dioxide from the air, and water from the soil to produce glucose and oxygen. The basic equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.",
    "type": "open_ended",
    "wrongAnswers": {}
  }
]

Important guidelines:
- Make questions appropriate for ${difficulty} difficulty level
- For multiple choice questions, use exactly ${settings.numberOfChoices} distinct answer choices
- For multiple-answer questions, use "Select all that apply" or similar phrasing
- For true/false questions, set "answer" to true or false (boolean), no "choices" array needed
- For open-ended questions, provide a comprehensive model answer in the "answer" field, no "choices" array needed
- Ensure questions are clear and unambiguous
- Make sure the correct answer(s) are actually correct
- For single-answer questions, "answer" should be a string that exactly matches one choice
- For multiple-answer questions, "answer" should be an array of strings, each exactly matching choices
- For true/false questions, "answer" should be a boolean (true or false)
- For open-ended questions, "answer" should be a detailed model answer string
- Set "type" to "single", "multiple", "true_false", or "open_ended" accordingly
- Provide educational explanations for wrong answers (empty object for open-ended)
- Use proper grammar and formatting
- Avoid trick questions or overly complex wording
- The "answer" field must exactly match items in the "choices" array (for multiple choice questions)
- Each choice should be a complete, meaningful answer option
${contexts.length ? `- Focus specifically on the weak areas mentioned: ${contexts.join(', ')}` : ''}

Distribution of question types:
${settings.questionTypes.multipleChoice ? `- Include multiple choice questions (both single and multiple answer types)` : ''}
${settings.questionTypes.trueFalse ? `- Include true/false questions` : ''}
${settings.questionTypes.openEnded ? `- Include open-ended questions that test deeper understanding` : ''}

Return only the JSON array, no additional text.
`;
    }

    // Main logic: Generate questions with proper validation and regeneration
    let allQuestions: any[] = [];
    let attempts = 0;
    const maxAttempts = 5;

    while (allQuestions.length < settings.numberOfQuestions && attempts < maxAttempts) {
      attempts++;
      
      // Calculate how many questions we still need
      const questionsNeeded = settings.numberOfQuestions - allQuestions.length;
      
      // Generate more questions than needed to account for validation failures
      const questionsToGenerate = Math.min(questionsNeeded * 2, questionsNeeded + 5);
      
      console.log(`Attempt ${attempts}: Need ${questionsNeeded} questions, generating ${questionsToGenerate}`);
      
      try {
        const prompt = createPrompt(questionsToGenerate);
        const rawQuestions = await generateGroqQuestions(prompt);
        console.log(`Generated ${rawQuestions.length} raw questions`);
        
        const validQuestions = validateQuestions(rawQuestions, settings);
        console.log(`Validated ${validQuestions.length} questions`);
        
        if (validQuestions.length === 0) {
          console.log('No valid questions generated in this attempt');
          continue;
        }
        
        // Add valid questions to our collection
        allQuestions = allQuestions.concat(validQuestions);
        console.log(`Total questions so far: ${allQuestions.length}`);
        
        // If we have too many questions, trim to the exact number needed
        if (allQuestions.length > settings.numberOfQuestions) {
          allQuestions = allQuestions.slice(0, settings.numberOfQuestions);
          console.log(`Trimmed to ${allQuestions.length} questions`);
          break;
        }
        
        // If we have exactly the right number, we're done
        if (allQuestions.length === settings.numberOfQuestions) {
          console.log('Generated exact number of questions needed');
          break;
        }
        
      } catch (error) {
        console.error(`Error in attempt ${attempts}:`, error);
        
        // If this is the first attempt and it fails, throw the error
        if (attempts === 1) {
          throw error;
        }
        
        // For subsequent attempts, continue trying
        continue;
      }
    }

    // Final validation: ensure we have the minimum required questions
    if (allQuestions.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Failed to generate any valid questions. Please try again with different settings or topic.',
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If we still don't have enough questions after all attempts, return what we have with a warning
    if (allQuestions.length < settings.numberOfQuestions) {
      console.log(`Warning: Only generated ${allQuestions.length} out of ${settings.numberOfQuestions} requested questions`);
      
      // If we have less than half of what was requested, return an error
      if (allQuestions.length < Math.ceil(settings.numberOfQuestions / 2)) {
        return new Response(
          JSON.stringify({
            error: `Could only generate ${allQuestions.length} valid questions out of ${settings.numberOfQuestions} requested. Please try again with different settings.`,
          }),
          {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log(`Successfully generated ${allQuestions.length} questions`);

    // Return the generated questions
    return new Response(
      JSON.stringify({ 
        questions: allQuestions,
        metadata: {
          topic,
          difficulty,
          contexts,
          settings,
          generated_at: new Date().toISOString(),
          requested_questions: settings.numberOfQuestions,
          generated_questions: allQuestions.length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})