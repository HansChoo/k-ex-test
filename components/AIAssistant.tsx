import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Annyeonghaseyo! 👋 I'm Kim, your virtual Korea guide. Looking for a specific tour or need travel tips?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having a bit of trouble connecting right now. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 mb-4 overflow-hidden flex flex-col animate-fade-in-up" style={{ maxHeight: '600px', height: '70vh' }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={16} className="text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Ask Kim</h3>
                <p className="text-xs text-rose-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Online Guide
                </p>
              </div>
            </div>
            <button onClick={toggleChat} className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-rose-500 text-white rounded-br-none' 
                      : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Kim is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-rose-300 focus-within:bg-white transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about tours..."
                className="flex-grow bg-transparent focus:outline-none text-sm text-gray-800"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`p-1.5 rounded-full transition-colors ${
                    input.trim() ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-center mt-2">
                 <span className="text-[10px] text-gray-400">Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className={`${isOpen ? 'scale-0' : 'scale-100'} transition-transform duration-300 bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-full shadow-lg hover:shadow-rose-500/40 flex items-center justify-center group`}
      >
        <MessageCircle size={28} className="group-hover:animate-wiggle" />
        <span className="absolute right-0 top-0 -mr-1 -mt-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
      </button>
      
      <style>{`
        @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
        }
        .animate-wiggle {
            animation: wiggle 0.5s ease-in-out;
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};