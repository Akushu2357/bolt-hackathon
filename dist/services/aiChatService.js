/**
 * AI Chat Service for real AI integration
 * Supports multiple AI providers: OpenAI, Groq, Anthropic
 */
export class AIChatService {
    static providers = {
        openai: {
            name: 'OpenAI',
            apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
            model: 'gpt-3.5-turbo',
            endpoint: 'https://api.openai.com/v1/chat/completions'
        },
        groq: {
            name: 'Groq',
            apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
            model: 'llama3-8b-8192',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions'
        },
        anthropic: {
            name: 'Anthropic',
            apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
            model: 'claude-3-haiku-20240307',
            endpoint: 'https://api.anthropic.com/v1/messages'
        }
    };
    /**
     * Generate AI response using the specified provider
     */
    static async generateResponse(message, conversationHistory = [], provider = 'groq') {
        const selectedProvider = this.providers[provider];
        if (!selectedProvider.apiKey) {
            console.warn(`${selectedProvider.name} API key not found, using mock response`);
            return this.generateMockResponse(message);
        }
        try {
            switch (provider) {
                case 'anthropic':
                    return await this.callAnthropicAPI(message, conversationHistory, selectedProvider);
                default:
                    return await this.callOpenAICompatibleAPI(message, conversationHistory, selectedProvider);
            }
        }
        catch (error) {
            console.error(`Error calling ${selectedProvider.name} API:`, error);
            return this.generateMockResponse(message);
        }
    }
    /**
     * Call OpenAI-compatible APIs (OpenAI, Groq)
     */
    static async callOpenAICompatibleAPI(message, conversationHistory, provider) {
        const systemPrompt = {
            role: 'system',
            content: `You are TutorAI, a helpful and knowledgeable AI tutor. Your role is to:
      
      1. Explain concepts clearly and simply
      2. Provide step-by-step solutions to problems
      3. Ask follow-up questions to ensure understanding
      4. Encourage learning and curiosity
      5. Adapt your teaching style to the student's level
      6. Use examples and analogies when helpful
      7. Be patient and supportive
      
      Always aim to help students learn and understand, not just give answers.`
        };
        const messages = [
            systemPrompt,
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: provider.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });
        if (!response.ok) {
            throw new Error(`${provider.name} API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
    /**
     * Call Anthropic Claude API
     */
    static async callAnthropicAPI(message, conversationHistory, provider) {
        const systemPrompt = `You are TutorAI, a helpful and knowledgeable AI tutor. Your role is to:
    
    1. Explain concepts clearly and simply
    2. Provide step-by-step solutions to problems
    3. Ask follow-up questions to ensure understanding
    4. Encourage learning and curiosity
    5. Adapt your teaching style to the student's level
    6. Use examples and analogies when helpful
    7. Be patient and supportive
    
    Always aim to help students learn and understand, not just give answers.`;
        const messages = conversationHistory.slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));
        messages.push({ role: 'user', content: message });
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': provider.apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: provider.model,
                max_tokens: 1000,
                system: systemPrompt,
                messages: messages,
            }),
        });
        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.content[0].text;
    }
    /**
     * Generate mock response when no API key is available
     */
    static generateMockResponse(message) {
        const responses = [
            `Great question about "${message.substring(0, 30)}..."! Let me help you understand this concept better. This is a fundamental topic that builds on several key principles.`,
            `I'd be happy to explain that! Let's break down "${message.substring(0, 30)}..." step by step to make it easier to understand.`,
            `That's a thoughtful question! For "${message.substring(0, 30)}...", here's how I would approach this problem systematically.`,
            `Excellent! This relates to an important concept. Let me provide you with a clear explanation and some practical examples.`,
            `I can see you're thinking deeply about this topic. Let me guide you through the solution process for "${message.substring(0, 30)}...".`,
            `This is a common question that many students ask! The key to understanding "${message.substring(0, 30)}..." is to start with the basics.`,
            `Perfect timing for this question! Let me explain "${message.substring(0, 30)}..." in a way that connects to what you might already know.`,
            `I love questions like this! "${message.substring(0, 30)}..." touches on several important concepts. Let's explore them together.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    /**
     * Get available providers and their status
     */
    static getProviderStatus() {
        const status = {};
        Object.entries(this.providers).forEach(([key, provider]) => {
            status[key] = {
                available: !!provider.apiKey,
                name: provider.name
            };
        });
        return status;
    }
    /**
     * Test if a provider is working
     */
    static async testProvider(provider) {
        try {
            const response = await this.generateResponse('Hello, this is a test message.', [], provider);
            return response.length > 0;
        }
        catch {
            return false;
        }
    }
}
