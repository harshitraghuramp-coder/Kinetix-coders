import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Bot,
  User,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import {
  ChatMessage,
  answerAttendanceQuestion,
} from '../utils/attendanceAdvisorEngine';
import { SectionTimetable } from '../types/timetable';
import {
  Subject,
  SubjectCalculation,
  OverallSemesterStats,
  LeaveRecord,
  LeavePolicy,
} from '../types/attendance';

interface AttendanceAdvisorChatProps {
  currentTimetable: SectionTimetable;
  subjects: Subject[];
  calculations: SubjectCalculation[];
  stats: OverallSemesterStats;
  planningDate: string;
  semesterEndDate: string;
  novemberDeadline: string;
  todayDateStr: string;
  leaveRecords: LeaveRecord[];
  leavePolicy: LeavePolicy;
  customHolidays: string[];
  selectedTarget: number;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: `Hello! I'm your **Attendance Advisor AI**. I am directly connected to your official SRM IST timetable and live attendance records.\n\nAsk me anything in natural language—like simulating leaves, asking how many classes you can miss, checking the November recovery deadline, or identifying which subject is in danger.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const SUGGESTED_PROMPTS = [
  'Which subject is in the most danger?',
  'Can I reach 75%?',
  'How many classes can I miss?',
  'Can I reach 90% by November?',
  'If I take a 3-day sick leave starting tomorrow, will my attendance drop below 75%?',
  'If I attend every remaining class, what will my final attendance be?',
];

export const AttendanceAdvisorChat: React.FC<AttendanceAdvisorChatProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('attendplan_chat_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_MESSAGES;
  });
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('attendplan_chat_v1', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Simulate instant AI evaluation with typing delay
    setTimeout(() => {
      const result = answerAttendanceQuestion(query, props);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isWarning: result.isWarning,
        isDetention: result.isDetention,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleClearChat = () => {
    setMessages(DEFAULT_MESSAGES);
  };

  return (
    <>
      {/* Floating Circular Chat Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer ring-2 ring-indigo-400/40"
          >
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-700 rounded-full animate-pulse" />
            </div>
            <span>Attendance Advisor</span>
          </button>
        )}
      </div>

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Chat Window Header */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 px-4 py-3 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/20 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">Attendance Advisor AI</h3>
                  <span className="text-[10px] font-bold bg-emerald-400 text-slate-950 px-1.5 rounded-full">
                    Live Engine
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 truncate max-w-[220px]">
                  Connected to {props.currentTimetable.displayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Context Banner */}
          <div className="bg-indigo-50/80 px-3.5 py-1.5 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900 font-medium">
            <span>Overall: <strong>{props.stats.currentPercentage.toFixed(2)}%</strong></span>
            <span>Target: <strong>{props.selectedTarget}%</strong></span>
            <span>Classes Left: <strong>{props.stats.totalRemaining}</strong></span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                      isBot
                        ? msg.isDetention
                          ? 'bg-red-50 text-red-950 border border-red-300 font-medium ring-1 ring-red-400'
                          : msg.isWarning
                          ? 'bg-amber-50 text-amber-950 border border-amber-200 font-medium'
                          : 'bg-white text-slate-800 border border-slate-200/90'
                        : 'bg-indigo-600 text-white font-medium rounded-br-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        isBot ? 'text-slate-400' : 'text-indigo-200'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {!isBot && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Checking timetable & computing mathematics...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Questions Carousel */}
          <div className="bg-white border-t border-slate-200/70 p-2 overflow-x-auto flex gap-1.5 no-scrollbar">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-full border border-slate-200 transition-colors cursor-pointer flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask an attendance or leave question..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
