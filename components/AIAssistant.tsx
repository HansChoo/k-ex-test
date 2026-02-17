
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { useGlobal } from '../contexts/GlobalContext';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const PRESETS = [
    "📅 How do I book?",
    "📍 Where is the location?",
    "💰 Any discounts?",
    "📞 Customer Support"
];

export const AIAssistant: React.FC = () => {
  const { products, packages, language } = useGlobal();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
        setMessages([
            { role: 'assistant', text: language === 'ko' ? "안녕하세요! 👋 K-Experience의 AI 가이드 '김'입니다. 무엇을 도와드릴까요?" : "Annyeonghaseyo! 👋 I'm Kim, your virtual Korea guide. How can I help you today?" }
        ]);
    }
  }, [language]);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: text }]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass dynamic context from Firestore to Gemini
      const response = await sendMessageToGemini(text, products, packages);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Network error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 mb-4 overflow-hidden flex flex-col animate-fade-in-up" style={{ height: '500px' }}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={16} className="text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Ask Kim</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">AI Travel Concierge</p>
              </div>
            </div>
            <button onClick={toggleChat} className="text-white/80 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#0070F0] text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-400 text-xs">
                  <Loader2 size={14} className="animate-spin" /> Kim is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100">
              {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => handleSend(p)} className="flex-shrink-0 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors whitespace-nowrap shadow-sm">
                      {p}
                  </button>
              ))}
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Ask Kim anything..."
                className="flex-grow bg-transparent focus:outline-none text-sm text-gray-800"
              />
              <button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()} className={`p-1.5 rounded-full transition-colors ${input.trim() ? 'bg-[#0070F0] text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={toggleChat} className={`${isOpen ? 'scale-0' : 'scale-100'} transition-transform duration-300 bg-[#0070F0] hover:bg-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-blue-500/40 flex items-center justify-center group`}>
        <MessageCircle size={28} className="group-hover:animate-wiggle" />
      </button>
    </div>
  );
};
