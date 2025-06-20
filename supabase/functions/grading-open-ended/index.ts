/*
  # Grading Open-Ended Questions API

  1. Endpoint
    - POST /functions/v1/grading-open-ended
    - Grades open-ended questions using Groq AI API

  2. Request Body
    - Contains array of open-ended questions
    - Each question has:
      - `question`: The question text
      - `answer`: The student's answer
      - `context`: Additional context or instructions for grading

  3. Response
    - Returns array of graded open-ended questions
    - Each question includes:
      - `question`: The original question text
      - `answer`: The student's answer
      - `grade`: The grade awarded ("correct", "incorrect", "partial")
      - `score`: Numerical score (0-1)
      - `feedback`: Detailed feedback explaining the grade
      - `improvements`: Specific suggestions for improvement
      - `weakAreas`: Identified weak areas in the answer
*/

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GradingRequestItem {
  question: string;
  answer: string;
  context?: string;
}

interface GradedQuestion {
  question: string;
  answer: string;
  grade: 'correct' | 'incorrect' | 'partial';
  score: number; // 0-1 scale
  feedback: string;
  improvements: string[];
  weakAreas: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    if (!Array.isArray(body) || body.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Request body must be a non-empty array of questions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each question
    for (const item of body) {
      if (!item.question || !item.answer) {
        return new Response(
          JSON.stringify({ error: 'Each item must have question and answer fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build grading prompt
    const gradingPrompt = `
You are an expert tutor grading open-ended student answers. For each question, provide detailed feedback including:

1. Grade the answer as "correct", "incorrect", or "partial"
2. Provide a numerical score from 0 to 1 (0 = completely wrong, 0.5 = partially correct, 1 = fully correct)
3. Give detailed feedback explaining why the answer received this grade
4. List specific improvements the student can make
5. Identify weak areas or concepts the student needs to work on

Return your response as a JSON array in this exact format:
[
  {
    "question": "...",
    "answer": "...",
    "grade": "correct" | "incorrect" | "partial",
    "score": 0.0-1.0,
    "feedback": "Detailed explanation of why this grade was given...",
    "improvements": ["Specific suggestion 1", "Specific suggestion 2"],
    "weakAreas": ["Concept 1", "Concept 2"]
  }
]

Questions to grade:
${body.map((item: GradingRequestItem, idx: number) => 
  `Q${idx+1}: ${item.question}
Student answer: ${item.answer}
${item.context ? `Expected/Context: ${item.context}` : ''}`
).join('\n\n')}

Grading Guidelines:
- "correct" (score 0.8-1.0): Answer demonstrates complete understanding and covers all key points
- "partial" (score 0.3-0.7): Answer shows some understanding but missing key elements or has minor errors
- "incorrect" (score 0.0-0.2): Answer shows fundamental misunderstanding or is completely wrong

Be constructive and educational in your feedback. Focus on helping the student learn and improve.

Return only the JSON array, no extra text.
`;

    // Call Groq API
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
            content: 'You are an expert educational tutor. Always respond with valid JSON in the exact format requested. Provide detailed, constructive feedback that helps students learn. Do not include any extra text outside the JSON array.'
          },
          {
            role: 'user',
            content: gradingPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Groq API error: ' + errorText);
    }
    
    const groqResponse = await response.json();
    const generatedContent = groqResponse.choices?.[0]?.message?.content;
    if (!generatedContent) throw new Error('No content in Groq response');

    let graded: GradedQuestion[];
    try {
      const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : generatedContent;
      graded = JSON.parse(jsonString);
      
      // Validate and sanitize the response
      graded = graded.map(item => ({
        question: item.question || '',
        answer: item.answer || '',
        grade: ['correct', 'incorrect', 'partial'].includes(item.grade) ? item.grade : 'incorrect',
        score: Math.max(0, Math.min(1, Number(item.score) || 0)),
        feedback: item.feedback || 'No feedback provided',
        improvements: Array.isArray(item.improvements) ? item.improvements : [],
        weakAreas: Array.isArray(item.weakAreas) ? item.weakAreas : []
      }));
      
    } catch {
      throw new Error('Failed to parse Groq response as JSON');
    }

    return new Response(
      JSON.stringify({ 
        graded, 
        metadata: { 
          graded_at: new Date().toISOString(),
          total_questions: graded.length,
          average_score: graded.reduce((sum, item) => sum + item.score, 0) / graded.length
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Grading error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});