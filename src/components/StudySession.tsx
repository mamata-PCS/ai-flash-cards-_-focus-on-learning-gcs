import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, RotateCcw, CheckCircle2, ChevronRight, XCircle, Award, Trophy, ArrowRight, Moon, Sun, Info, Share2, Download, Image as ImageIcon, Copy, Check, Eye } from "lucide-react";
import { StudyContent } from "../lib/gemini";
import { playSound } from "../lib/sounds";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

interface StudySessionProps {
  guide: StudyContent & { id: string, userId?: string, imageUrl?: string, isPublic?: boolean };
  isPublicView?: boolean;
  onBack: () => void;
}

export default function StudySession({ guide, isPublicView, onBack }: StudySessionProps) {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz'>('flashcards');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => (prev + 1) % guide.flashcards.length);
    }, 150);
  };

  const handleFlip = () => {
    playSound("flip");
    setIsFlipped(!isFlipped);
  };

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    
    if (option === currentQuizItem.correctAnswer) {
      playSound("correct");
    } else {
      playSound("wrong");
    }

    const newAns = [...userAnswers];
    newAns[quizIndex] = option;
    setUserAnswers(newAns);
    
    if (quizIndex === guide.quiz.length - 1) {
      setTimeout(() => {
        if (option === currentQuizItem.correctAnswer) playSound("success");
      }, 500);
    }
  };

  const togglePublic = async () => {
    if (isPublicView || !auth.currentUser) return;
    try {
      const guideRef = doc(db, `users/${auth.currentUser.uid}/studyGuides`, guide.id);
      await updateDoc(guideRef, { isPublic: !guide.isPublic });
    } catch (e) {
      console.error("Error toggling public state:", e);
    }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${guide.userId || auth.currentUser?.uid}.${guide.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsText = () => {
    let content = `STUDY GUIDE: ${guide.title}\n\n`;
    content += "FLASHCARDS:\n";
    guide.flashcards.forEach((c, i) => {
      content += `${i+1}. Q: ${c.front}\n   A: ${c.back}\n\n`;
    });
    content += "QUIZ:\n";
    guide.quiz.forEach((q, i) => {
      content += `${i+1}. ${q.question}\n   Options: ${q.options.join(", ")}\n   Answer: ${q.correctAnswer}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.title.replace(/\s+/g, '_')}_study_guide.txt`;
    link.click();
  };

  const currentQuizItem = guide.quiz[quizIndex];
  const userSelection = userAnswers[quizIndex];
  const isCorrect = userSelection === currentQuizItem?.correctAnswer;
  const isAnswered = userSelection !== undefined;

  const score = useMemo(() => {
    return userAnswers.filter((ans, i) => ans === guide.quiz[i].correctAnswer).length;
  }, [userAnswers, guide.quiz]);

  const resetQuiz = () => {
    setQuizIndex(0);
    setUserAnswers([]);
    setShowResults(false);
  };

  const themeClasses = isDarkMode 
    ? "bg-[#121212] text-white/90" 
    : "bg-brand-bg text-brand-dark";

  const cardClasses = isDarkMode
    ? "bg-[#1E1E1E] border-white/10 text-white"
    : "bg-white border-brand-yellow text-brand-dark";

  return (
    <div className={`min-h-screen p-6 flex flex-col font-sans transition-colors duration-500 overflow-x-hidden ${themeClasses}`}>
      {/* Modals */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 text-brand-dark"
            >
              <h3 className="text-2xl font-app font-bold mb-2">Share Guide</h3>
              <p className="text-sm text-stone-500 mb-8 font-medium">Anyone with the link can view your flashcards and take the quiz.</p>
              
              <div className="flex items-center gap-2 mb-8 bg-stone-50 rounded-2xl p-4 border-2 border-stone-100 group">
                <input 
                  readOnly 
                  value={shareUrl} 
                  className="bg-transparent border-none text-xs flex-1 truncate font-mono text-stone-400 outline-none"
                />
                <button onClick={copyToClipboard} className="text-brand-teal transition-colors">
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={togglePublic}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${guide.isPublic ? 'bg-red-50 text-red-500' : 'bg-brand-teal text-white shadow-xl shadow-teal-100'}`}
                >
                  {guide.isPublic ? "Disable Sharing" : "Enable Sharing"}
                </button>
                <button onClick={() => setShowShareModal(false)} className="w-full py-4 text-xs font-bold text-stone-400 uppercase">Close</button>
              </div>
            </motion.div>
          </div>
        )}

        {showImagePreview && guide.imageUrl && (
          <div className="fixed inset-0 z-[120] flex flex-col bg-black/95 p-6">
            <button 
              onClick={() => setShowImagePreview(false)}
              className="self-end p-2 bg-white/10 rounded-full text-white mb-6"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img src={guide.imageUrl} alt="Textbook original" className="max-w-full max-h-full object-contain rounded-2xl" />
            </div>
            <p className="text-center text-white/40 text-xs font-bold uppercase tracking-widest mt-6">Original Textbook Reference</p>
          </div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 -ml-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-brand-teal' : 'hover:bg-brand-teal/10 text-brand-teal'}`}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-app font-bold text-xl truncate max-w-[150px] sm:max-w-md leading-none">{guide.title}</h2>
            {guide.isPublic && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-brand-teal mt-1 flex items-center gap-1">
                <Share2 className="w-2.5 h-2.5" /> Shared Publicly
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isPublicView && (
            <div className="flex items-center gap-1">
             {guide.imageUrl && (
              <button 
                onClick={() => setShowImagePreview(true)}
                className={`p-3 rounded-2xl border-2 transition-all ${isDarkMode ? 'border-white/10 bg-white/5 text-brand-teal' : 'border-brand-yellow bg-white text-stone-400'}`}
                title="View Original"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
             )}
              <button 
                onClick={exportAsText}
                className={`p-3 rounded-2xl border-2 transition-all ${isDarkMode ? 'border-white/10 bg-white/5 text-brand-teal' : 'border-brand-yellow bg-white text-stone-400'}`}
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className={`p-3 rounded-2xl border-2 transition-all ${isDarkMode ? 'border-white/10 bg-white/5 text-brand-teal' : 'border-brand-yellow bg-white text-stone-400'}`}
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl border-2 transition-all ${isDarkMode ? 'border-white/10 bg-white/5 text-yellow-400' : 'border-brand-yellow bg-white text-stone-400'}`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className={`flex p-1 rounded-2xl mb-8 w-fit mx-auto border-2 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-brand-yellow'}`}>
        <button 
          onClick={() => { setActiveTab('flashcards'); setShowResults(false); }}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'flashcards' ? 'bg-brand-teal text-white shadow-md' : 'text-stone-400'}`}
        >
          Flashcards
        </button>
        <button 
          onClick={() => setActiveTab('quiz')}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'quiz' ? 'bg-brand-teal text-white shadow-md' : 'text-stone-400'}`}
        >
          Smart Quiz
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'flashcards' ? (
            <motion.div
              key="flashcard-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center"
            >
              <div 
                className="w-full aspect-[3/4] perspective-1000 mb-8 cursor-pointer group"
                onClick={handleFlip}
              >
                <div className="relative w-full h-full transition-all duration-500 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
                  <motion.div 
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full h-full relative preserve-3d"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front */}
                    <div 
                      className={`absolute inset-0 card-vibrant p-8 flex flex-col items-center justify-center text-center backface-hidden transition-colors ${cardClasses}`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <p className="text-[10px] uppercase tracking-widest text-brand-coral font-bold mb-6">Discovery Card</p>
                      <h3 className="text-2xl font-bold leading-tight px-4 lg:text-3xl">
                        {guide.flashcards[cardIndex].front}
                      </h3>
                      <div className={`mt-10 py-2 px-6 border-2 border-dashed rounded-xl text-xs font-bold italic transition-colors ${isDarkMode ? 'border-white/10 text-white/30' : 'border-brand-yellow text-stone-400'}`}>
                        Tap to reveal answer
                      </div>
                    </div>
                    
                    {/* Back */}
                    <div 
                      className="absolute inset-0 card-vibrant p-8 flex flex-col items-center justify-center text-center backface-hidden bg-brand-coral text-white border-none"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-6">Expert Answer</p>
                      <h3 className="text-xl font-bold leading-relaxed px-4 lg:text-2xl">
                        {guide.flashcards[cardIndex].back}
                      </h3>
                      <div className="mt-10 py-2 px-6 border-2 border-dashed border-white/20 rounded-xl text-white/50 text-xs font-bold italic">
                        Mastered this concept?
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setCardIndex((prev) => (prev - 1 + guide.flashcards.length) % guide.flashcards.length); setIsFlipped(false); }}
                  className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all border-2 ${isDarkMode ? 'bg-[#1E1E1E] border-white/10 text-white/40 hover:text-brand-coral' : 'bg-white border-brand-yellow text-stone-400 hover:text-brand-coral'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <div className="flex flex-col items-center">
                   <span className={`font-bold text-xs px-4 py-1.5 rounded-full border-2 shadow-sm transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-white/10 text-white/60' : 'bg-white border-brand-yellow text-stone-600'}`}>
                    {cardIndex + 1} / {guide.flashcards.length}
                  </span>
                </div>
                <motion.button 
                   whileTap={{ scale: 0.9 }}
                   onClick={handleNextCard}
                   className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all border-2 ${isDarkMode ? 'bg-[#1E1E1E] border-white/10 text-white/40 hover:text-brand-coral' : 'bg-white border-brand-yellow text-stone-400 hover:text-brand-coral'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ) : showResults ? (
            <motion.div
              key="quiz-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full text-center"
            >
              <div className={`card-vibrant p-10 flex flex-col items-center transition-colors ${cardClasses}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${isDarkMode ? 'bg-brand-coral/20 shadow-none' : 'bg-brand-yellow shadow-yellow-100'}`}>
                  <Trophy className={`w-12 h-12 ${isDarkMode ? 'text-brand-coral' : 'text-brand-coral'}`} />
                </div>
                <h3 className="text-3xl font-app font-bold mb-2">Quiz Complete!</h3>
                <p className="text-stone-500 font-medium mb-8">You've mastered these concepts.</p>
                
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-6xl font-bold text-brand-coral">{score}</span>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-white/20' : 'text-stone-300'}`}>/ {guide.quiz.length}</span>
                </div>

                <div className={`w-full h-3 rounded-full overflow-hidden mb-12 shadow-inner border transition-colors ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-stone-100 border'}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / guide.quiz.length) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-brand-teal"
                  />
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <button 
                    onClick={resetQuiz}
                    className="btn-vibrant-teal w-full flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    RETAKE QUIZ
                  </button>
                  <button 
                    onClick={onBack}
                    className={`w-full py-4 font-bold uppercase tracking-widest text-[10px] transition-colors ${isDarkMode ? 'text-white/30 hover:text-brand-coral' : 'text-stone-400 hover:text-brand-coral'}`}
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quiz-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="mb-6 flex items-center justify-between px-2">
                <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-brand-coral mb-1">Knowledge Check</p>
                   <span className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-white/40' : 'text-stone-400'}`}>Question {quizIndex + 1} of {guide.quiz.length}</span>
                </div>
                <div className="flex gap-1.5 w-1/2">
                  {guide.quiz.map((_, i) => (
                    <motion.div 
                      key={i} 
                      initial={false}
                      animate={{ 
                        backgroundColor: i === quizIndex ? '#FF6B6B' : userAnswers[i] ? '#4ECDC4' : (isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                        scale: i === quizIndex ? 1.1 : 1
                      }}
                      className="h-2 flex-1 rounded-full shadow-sm"
                    />
                  ))}
                </div>
              </div>

              <div className={`card-vibrant p-6 mb-6 shadow-2xl transition-all ${cardClasses} ${isDarkMode ? 'shadow-black/40' : 'shadow-brand-yellow/10'}`}>
                <h3 className="text-xl font-bold mb-10 leading-tight min-h-[4rem]">{currentQuizItem.question}</h3>
                <div className="space-y-3">
                  {currentQuizItem.options.map((option, idx) => {
                    const isSelected = userSelection === option;
                    const showCorrect = isAnswered && option === currentQuizItem.correctAnswer;
                    const showWrong = isAnswered && isSelected && !isCorrect;
                    
                    return (
                      <motion.button
                        key={idx}
                        disabled={isAnswered}
                        whileHover={!isAnswered ? { x: 4, backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#fafafa" } : {}}
                        whileTap={!isAnswered ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full text-left p-5 rounded-[24px] border-2 font-bold transition-all flex justify-between items-center group relative overflow-hidden ${
                          showCorrect ? 'border-green-500 bg-green-500/10 text-green-500' :
                          showWrong ? 'border-brand-coral bg-brand-coral/10 text-brand-coral' :
                          isSelected ? 'border-brand-teal bg-brand-teal/10 text-brand-teal' :
                          (isDarkMode ? 'border-white/5 bg-white/5 text-white/50' : 'border-stone-100 bg-stone-50 text-stone-600')
                        }`}
                      >
                        <span className="flex-1 pr-4">{option}</span>
                        <AnimatePresence>
                          {showCorrect && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 className="w-5 h-5 text-green-500" /></motion.div>
                          )}
                          {showWrong && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><XCircle className="w-5 h-5 text-brand-coral" /></motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isAnswered && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`mt-8 p-6 rounded-3xl border-2 overflow-hidden ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-brand-bg/50 border-brand-yellow/30'}`}
                    >
                      <div className="flex items-center gap-2 mb-3 text-brand-teal">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Concept Insight</span>
                      </div>
                      <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-white/80' : 'text-stone-600'}`}>
                        {currentQuizItem.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between gap-4"
                  >
                    {quizIndex < guide.quiz.length - 1 ? (
                      <button 
                        onClick={() => setQuizIndex(prev => prev + 1)}
                        className="btn-vibrant-coral flex-1 py-5 text-base flex items-center justify-center gap-2"
                      >
                        CONTINUE
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowResults(true)}
                        className="btn-vibrant-teal flex-1 py-5 text-base flex items-center justify-center gap-2"
                      >
                        <Award className="w-5 h-5" />
                        SEE RESULTS
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
