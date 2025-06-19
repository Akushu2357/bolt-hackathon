export interface MockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface MockChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  messages: MockMessage[];
}

export const mockChatSessions: MockChatSession[] = [
  {
    id: '1',
    title: 'Mathematics Tutor',
    lastMessage: 'Great! Let me explain quadratic equations step by step...',
    timestamp: '2025-01-09T10:30:00Z',
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Hi! Can you help me understand quadratic equations?',
        timestamp: '2025-01-09T10:25:00Z',
        status: 'read'
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Hello! I\'d be happy to help you with quadratic equations. They\'re a fundamental concept in algebra. A quadratic equation is any equation that can be written in the form ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0.',
        timestamp: '2025-01-09T10:26:00Z',
        status: 'read'
      },
      {
        id: 'm3',
        role: 'user',
        content: 'That makes sense! Can you show me how to solve one?',
        timestamp: '2025-01-09T10:28:00Z',
        status: 'read'
      },
      {
        id: 'm4',
        role: 'assistant',
        content: 'Absolutely! Let\'s solve x² - 5x + 6 = 0 using the factoring method. We need to find two numbers that multiply to 6 and add to -5. Those numbers are -2 and -3.',
        timestamp: '2025-01-09T10:29:00Z',
        status: 'read'
      },
      {
        id: 'm5',
        role: 'user',
        content: 'So it would be (x - 2)(x - 3) = 0?',
        timestamp: '2025-01-09T10:29:30Z',
        status: 'delivered'
      },
      {
        id: 'm6',
        role: 'assistant',
        content: 'Great! Let me explain quadratic equations step by step...',
        timestamp: '2025-01-09T10:30:00Z',
        status: 'sent'
      }
    ]
  },
  {
    id: '2',
    title: 'Chemistry Study Session',
    lastMessage: 'Organic chemistry can be challenging, but...',
    timestamp: '2025-01-08T16:45:00Z',
    unreadCount: 1,
    isOnline: false,
    messages: [
      {
        id: 'm11',
        role: 'user',
        content: 'Can you explain organic chemistry reactions?',
        timestamp: '2025-01-08T16:40:00Z',
        status: 'read'
      },
      {
        id: 'm12',
        role: 'assistant',
        content: 'Organic chemistry reactions involve carbon-based compounds. There are several types: substitution, addition, elimination, and rearrangement reactions.',
        timestamp: '2025-01-08T16:42:00Z',
        status: 'read'
      },
      {
        id: 'm13',
        role: 'user',
        content: 'What about functional groups?',
        timestamp: '2025-01-08T16:44:00Z',
        status: 'read'
      },
      {
        id: 'm14',
        role: 'assistant',
        content: 'Organic chemistry can be challenging, but...',
        timestamp: '2025-01-08T16:45:00Z',
        status: 'delivered'
      }
    ]
  },
];

export const getFormattedTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

export const getMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};