/*
  # Secure AI Chat API

  1. Endpoint
    - POST /functions/v1/chat-ai
    - Handles AI chat requests securely on the server side

  2. Request Body
    - `message` (string, required): The user's message
    - `context` (string[], optional): Previous conversation context
    - `sessionId` (string, optional): Chat session identifier

  3. Response
    - Returns AI response with proper error handling
    - API keys are kept secure on the server side
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string;
  context?: string[];
  sessionId?: string;
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
    const body: ChatRequest = await req.json()
    
    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: message' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate message length
    if (body.message.length > 2000) {
      return new Response(
        JSON.stringify({ 
          error: 'Message too long. Maximum 2000 characters allowed.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Groq API key from environment (secure server-side)
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    
    let aiResponse: string;

    if (groqApiKey) {
      // Use Groq API if available
      try {
        aiResponse = await callGroqAPI(body.message, body.context || [], groqApiKey);
      } catch (error) {
        console.error('Groq API error:', error);
        aiResponse = generateMockResponse(body.message);
      }
    } else {
      // Fallback to mock response
      console.log('No Groq API key found, using mock response');
      aiResponse = generateMockResponse(body.message);
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        timestamp: new Date().toISOString(),
        sessionId: body.sessionId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat AI error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        response: generateMockResponse('I apologize, but I encountered an issue. Please try again.')
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function callGroqAPI(message: string, context: string[], apiKey: string): Promise<string> {
  const systemPrompt = `You are TutorAI, a helpful and knowledgeable AI tutor. Your role is to:
  
  1. Explain concepts clearly and simply
  2. Provide step-by-step solutions to problems
  3. Ask follow-up questions to ensure understanding
  4. Encourage learning and curiosity
  5. Adapt your teaching style to the student's level
  6. Use examples and analogies when helpful
  7. Be patient and supportive
  
  Always aim to help students learn and understand, not just give answers.`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add context if available
  if (context.length > 0) {
    messages.push({
      role: 'assistant',
      content: `Previous context: ${context.slice(-3).join(' ')}`
    });
  }

  messages.push({ role: 'user', content: message });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
}

function generateMockResponse(message: string): string {
  const responses = [
    "That's a great question! Let me help you understand this concept better.",
    "I can see you're working on this topic. Here's a clear explanation...",
    "Excellent! Let me break this down step by step for you.",
    "This is an important concept in your studies. Here's how it works...",
    "I'd be happy to help you with that! Let me provide some guidance.",
    "That's a thoughtful question. Here's what you need to know...",
    "Great topic to explore! Let me give you a comprehensive explanation.",
    "I can help clarify that for you. Here's the key information..."
  ];

  // Check for quiz-related keywords
  const quizKeywords = ['quiz', 'test', 'questions', 'assessment', 'practice'];
  const hasQuizKeyword = quizKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  let response = responses[Math.floor(Math.random() * responses.length)];

  if (hasQuizKeyword) {
    response += "\n\nIf you'd like to create a quiz on this topic, you can use the command:\n`/create-quiz [topic] [difficulty]`\n\nFor example: `/create-quiz mathematics medium`";
  }

  return response;
}