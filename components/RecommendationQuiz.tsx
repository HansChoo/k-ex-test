
import React, { useState } from 'react';
import { X, Sparkles, Check, ChevronRight, Wand2 } from 'lucide-react';
import { useGlobal } from '../contexts/GlobalContext';

interface QuizProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecommendationQuiz: React.FC<QuizProps> = ({ isOpen, onClose }) => {
  const { t } = useGlobal();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      id: 'interest',
      question: t('quiz_q1'),
      options: [
        { label: t('quiz_opt_kpop'), value: "idol", icon: "🎤" },
        { label: t('quiz_opt_beauty'), value: "beauty", icon: "✨" },
        { label: t('quiz_opt_health'), value: "health", icon: "🩺" }
      ]
    },
    {
      id: 'budget',
      question: t('quiz_q2'),
      options: [
        { label: t('quiz_basic'), value: "basic", icon: "💰" },
        { label: t('quiz_premium'), value: "premium", icon: "💎" }
      ]
    }
  ];

  const handleAnswer = (val: string) => {
    const currentQ = questions[step];
    setAnswers({ ...answers, [currentQ.id]: val });

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      analyzeResult({ ...answers, [currentQ.id]: val });
    }
  };

  const analyzeResult = (finalAnswers: any) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      let recommendedProduct = { title: "", link: "" };
      
      if (finalAnswers.interest === 'health') {
          recommendedProduct = finalAnswers.budget === 'premium' 
            ? { title: "Premium Health Checkup", link: "/reservation-premium" }
            : { title: "Basic Health Checkup", link: "/reservation-basic" };
      } else if (finalAnswers.interest === 'idol') {
          recommendedProduct = finalAnswers.budget === 'premium'
            ? { title: "K-IDOL Premium Makeover", link: "/reservation-premium" }
            : { title: "K-IDOL Basic Photoshoot", link: "/reservation-basic" };
      } else {
          recommendedProduct = finalAnswers.budget === 'premium'
            ? { title: "Rejuran Healer VIP Pkg", link: "/reservation-premium" }
            : { title: "Glass Skin Basic Pkg", link: "/reservation-basic" };
      }

      setResult(recommendedProduct);
      setIsAnalyzing(false);
    }, 2000);
  };

  const resetQuiz = () => {
      setStep(0);
      setAnswers({});
      setResult(null);
      setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-[420px] overflow-hidden shadow-2xl relative min-h-[500px] flex flex-col">
        
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#0070F0]">
            <Wand2 size={20} />
            <span className="font-bold text-sm tracking-wider uppercase">{t('ai_concierge')}</span>
          </div>
          <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-black" /></button>
        </div>

        <div className="flex-1 p-8 flex flex-col justify-center items-center text-center">
            {isAnalyzing ? (
                <div className="animate-pulse flex flex-col items-center">
                    <Sparkles size={48} className="text-[#0070F0] mb-6 animate-spin-slow" />
                    <h3 className="text-xl font-bold mb-2">{t('analyzing')}</h3>
                    <p className="text-gray-500 text-sm">{t('finding')}</p>
                </div>
            ) : result ? (
                <div className="animate-fade-in-up w-full">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🎉</div>
                    <h3 className="text-gray-500 font-medium mb-2 text-sm">{t('we_recommend')}</h3>
                    <h2 className="text-2xl font-black text-[#111] mb-8 leading-tight">{result.title}</h2>
                    
                    <button onClick={() => window.location.href = result.link} className="w-full py-4 bg-[#0070F0] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 mb-4">
                        {t('book_now')} <ChevronRight size={20} />
                    </button>
                    <button onClick={resetQuiz} className="text-sm text-gray-400 hover:text-gray-600 font-medium">{t('start_over')}</button>
                </div>
            ) : (
                <div className="w-full animate-fade-in">
                    <div className="mb-8">
                        <span className="text-xs font-bold text-gray-300 mb-2 block">{t('question')} {step + 1}/{questions.length}</span>
                        <h2 className="text-2xl font-bold text-[#111]">{questions[step].question}</h2>
                    </div>
                    <div className="space-y-3">
                        {questions[step].options.map((opt) => (
                            <button 
                                key={opt.value} 
                                onClick={() => handleAnswer(opt.value)}
                                className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#0070F0] hover:bg-blue-50 transition-all flex items-center gap-4 group text-left"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                                <span className="font-bold text-gray-700 group-hover:text-[#0070F0]">{opt.label}</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 text-[#0070F0]"><Check size={20} /></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
      <style>{`
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
