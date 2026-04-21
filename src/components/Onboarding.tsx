import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, Clock, Brain, Sparkles, ChevronRight, Check } from "lucide-react";

interface OnboardingProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: "Welcome to AI Flash Cards",
    description: "Focus on Learning. Your new AI-powered study companion. Let's show you how to master any textbook page in minutes.",
    icon: Sparkles,
    color: "bg-brand-teal",
    shadow: "shadow-teal-100",
  },
  {
    title: "The Focus Ritual",
    description: "Before you scan, use Focus Mode. Set a timer for 5, 10, or 25 minutes to prep your brain and read the content first.",
    icon: Clock,
    color: "bg-brand-coral",
    shadow: "shadow-red-100",
  },
  {
    title: "Snapshot Analysis",
    description: "Snap a photo of any textbook page. Our AI instantly extracts key concepts and creates interactive material.",
    icon: Camera,
    color: "bg-brand-teal",
    shadow: "shadow-teal-100",
  },
  {
    title: "Deep Mastery",
    description: "Study with 3D flashcards and test yourself with Smart Quizzes. Each question comes with expert concept insights.",
    icon: Brain,
    color: "bg-brand-coral",
    shadow: "shadow-red-100",
  },
];

export default function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[40px] p-8 relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-5 transition-colors duration-500 ${current.color}`} />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-50 text-stone-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center text-center mt-8"
          >
            <div className={`w-20 h-20 ${current.color} rounded-3xl flex items-center justify-center shadow-2xl ${current.shadow} mb-8`}>
              <current.icon className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-app font-bold text-brand-dark mb-4 leading-tight">
              {current.title}
            </h2>
            <p className="text-stone-500 font-medium leading-relaxed mb-10 px-2">
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <button 
            onClick={next}
            className={`w-full py-5 rounded-3xl font-bold flex items-center justify-center gap-2 text-white shadow-xl transition-all active:scale-95 ${current.color} ${current.shadow}`}
          >
            {step === STEPS.length - 1 ? (
              <>
                <Check className="w-5 h-5" />
                GET STARTED
              </>
            ) : (
              <>
                NEXT STEP
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="flex justify-center gap-2 mt-2">
            {STEPS.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? `w-8 ${current.color}` : "w-1.5 bg-stone-100"}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
