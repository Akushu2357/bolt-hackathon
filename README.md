# 📚 TutorAI - Personalized AI Tutoring Platform

An AI-powered tutoring web application that helps students learn smarter by offering real-time AI conversations, personalized quizzes, and progress tracking. Built for the [Bolt Hackathon 2025](https://worldslargesthackathon.devpost.com).

## 🚀 Features

### 🤖 AI Chat Service
- **Real-time AI tutoring** with multiple AI providers (OpenAI, Groq, Anthropic)
- **Conversation history** - All chats are saved and searchable
- **Multiple chat sessions** - Organize conversations by topic
- **Guest mode** - 5 free chats for non-registered users
- **Unlimited chats** for registered users
- **Mobile responsive** design

### 📝 Quiz System
- **AI-generated quizzes** based on any topic
- **Multiple question types**: Single choice, multiple choice, true/false, open-ended
- **AI grading** for open-ended questions with detailed feedback
- **Progress tracking** and weak area identification
- **Difficulty levels**: Easy, medium, hard

### 👤 User Management
- **Secure authentication** with Supabase
- **Profile management** with learning statistics
- **Progress tracking** across all subjects
- **Study schedule** with reminders

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI Integration**: OpenAI, Groq, Anthropic APIs
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd tutorai-chat
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Add your Supabase credentials (required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add at least one AI API key (optional but recommended)
VITE_GROQ_API_KEY=your_groq_api_key  # FREE and fast!
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 🔑 Getting AI API Keys (Optional)

Your chat service works with mock responses by default. For real AI responses, get a free API key:

### Groq (Recommended - FREE & Fast!)
1. Visit [console.groq.com](https://console.groq.com/)
2. Sign up for free account
3. Go to API Keys section
4. Create new API key
5. Add to `.env` as `VITE_GROQ_API_KEY=your_key_here`

### OpenAI (Paid)
1. Visit [platform.openai.com](https://platform.openai.com/)
2. Create account and add billing
3. Generate API key
4. Add to `.env` as `VITE_OPENAI_API_KEY=your_key_here`

### Anthropic Claude (Paid)
1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Create account and add billing
3. Generate API key
4. Add to `.env` as `VITE_ANTHROPIC_API_KEY=your_key_here`

## 📱 How to Use

### Chat Service
1. **Navigate to Chat**: Click "Chat" in the navigation
2. **Start Chatting**: Type any question and get AI responses
3. **Multiple Sessions**: Create new chat sessions for different topics
4. **Guest Mode**: Try 5 free chats without signing up
5. **Unlimited Access**: Sign up for unlimited chats and history

### Quiz System
1. **Generate Quiz**: Click "Quiz" → "Generate Quiz"
2. **Choose Topic**: Enter any subject (e.g., "Mathematics", "History")
3. **Select Difficulty**: Easy, Medium, or Hard
4. **Take Quiz**: Answer questions and get instant feedback
5. **View Results**: See detailed analysis and areas to improve

### Study Schedule
1. **Add Sessions**: Create study sessions with date/time
2. **Track Progress**: Mark sessions as completed
3. **View Statistics**: Monitor your learning progress

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
├── contexts/            # React contexts (Auth)
├── pages/               # Main application pages
│   ├── ChatPage.tsx     # 💬 Main chat interface
│   ├── QuizPage.tsx     # 📝 Quiz system
│   ├── HomePage.tsx     # 🏠 Dashboard
│   └── ...
├── services/            # Business logic
│   ├── aiChatService.ts # 🤖 AI integration
│   ├── quizService.ts   # 📝 Quiz generation
│   └── ...
└── types/               # TypeScript definitions
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding New AI Providers
1. Update `aiChatService.ts`
2. Add API key to `.env.example`
3. Update provider selection in `ChatPage.tsx`

## 🚀 Deployment

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

### Deploy to Vercel
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Hackathon Submission

This project was built for the Bolt Hackathon 2025. Key features that make it stand out:

- **Complete Learning Platform**: Chat + Quizzes + Progress Tracking
- **Multiple AI Providers**: Flexibility and reliability
- **Guest Mode**: Try before you buy experience
- **Mobile First**: Works perfectly on all devices
- **Real-time Features**: Instant AI responses and feedback
- **Production Ready**: Full authentication, database, and deployment ready

---

**Built with ❤️ for the Bolt Hackathon 2025**