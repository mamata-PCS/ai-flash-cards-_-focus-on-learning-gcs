import { motion } from "motion/react";
import { LogIn, BookOpen, Sparkles } from "lucide-react";
import { signIn } from "../lib/firebase";

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="w-20 h-20 bg-brand-coral rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-200">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-5xl font-app font-bold mb-4 text-brand-dark">
          AI Flash Cards
        </h1>
        <p className="text-xl text-stone-600 mb-12 font-medium">
          Focus on Learning. Snapshot your textbooks to get <span className="text-brand-coral">AI-powered study cards</span> instantly.
        </p>

        <motion.div
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
        >
          <button 
            onClick={() => signIn()}
            className="btn-vibrant-teal w-full flex items-center justify-center gap-3 text-lg py-5"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
        
        <div className="mt-12 flex items-center justify-center gap-2 text-brand-coral text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Vertex AI</span>
        </div>
      </motion.div>
    </div>
  );
}
