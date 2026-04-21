import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Play, Pause, RotateCcw, Camera, Coffee, Sparkles, Brain } from "lucide-react";
import { playSound } from "../lib/sounds";

interface FocusModeProps {
  onBack: () => void;
  onStartCapture: () => void;
}

const PRESETS = [
  { label: "5m", value: 5 * 60, icon: Coffee, desc: "Quick Preview" },
  { label: "10m", value: 10 * 60, icon: Sparkles, desc: "Standard Read" },
  { label: "25m", value: 25 * 60, icon: Brain, desc: "Deep Focus" },
];

export default function FocusMode({ onBack, onStartCapture }: FocusModeProps) {
  const [seconds, setSeconds] = useState(PRESETS[0].value);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(PRESETS[0].value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      if (isActive) {
        playSound("success");
      }
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, seconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectPreset = (val: number) => {
    playSound("flip");
    setIsActive(false);
    setDuration(val);
    setSeconds(val);
  };

  const progress = ((duration - seconds) / duration) * 100;

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col font-sans overflow-hidden">
      <header className="p-6 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-1">Focus Session</h2>
            <p className="text-[10px] text-white/30 font-medium italic">Read your textbook before scanning</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Animated Background Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <motion.div 
                animate={{ scale: isActive ? [1, 1.2, 1] : 1, opacity: isActive ? [0.2, 0.4, 0.2] : 0.2 }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-96 h-96 border border-white/10 rounded-full absolute"
            />
            <motion.div 
                animate={{ scale: isActive ? [1.2, 1.4, 1.2] : 1.2, opacity: isActive ? [0.1, 0.2, 0.1] : 0.1 }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-96 h-96 border border-white/5 rounded-full absolute"
            />
        </div>

        {/* Timer Display */}
        <div className="relative mb-16">
            <svg className="w-72 h-72 -rotate-90 md:w-80 md:h-80">
                <circle
                    cx="50%" cy="50%" r="48%"
                    className="fill-none stroke-white/5 stroke-[4]"
                />
                <motion.circle
                    cx="50%" cy="50%" r="48%"
                    className="fill-none stroke-brand-teal stroke-[6]"
                    strokeDasharray="100 100"
                    initial={{ pathLength: 1 }}
                    animate={{ pathLength: seconds / duration }}
                    transition={{ duration: 1, ease: "linear" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                    key={seconds}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className="text-7xl md:text-8xl font-app font-bold tabular-nums"
                >
                    {formatTime(seconds)}
                </motion.span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mt-2">Time Remaining</p>
            </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-12">
            {PRESETS.map((p) => (
                <button
                    key={p.label}
                    onClick={() => handleSelectPreset(p.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-[28px] border-2 transition-all ${
                        duration === p.value 
                        ? "border-brand-teal bg-brand-teal/10 text-brand-teal" 
                        : "border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:border-white/20"
                    }`}
                >
                    <p.icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{p.label}</span>
                </button>
            ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
            <button 
                onClick={() => { setSeconds(duration); setIsActive(false); }}
                className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                title="Reset"
            >
                <RotateCcw className="w-6 h-6" />
            </button>
            
            <button 
                onClick={() => {
                  playSound("flip");
                  setIsActive(!isActive);
                }}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                    isActive 
                    ? "bg-brand-coral text-white shadow-brand-coral/20" 
                    : "bg-brand-teal text-white shadow-brand-teal/20"
                }`}
            >
                {isActive ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
            </button>

            <button 
                onClick={onStartCapture}
                className="w-14 h-14 rounded-full bg-brand-teal/20 flex items-center justify-center text-brand-teal hover:bg-brand-teal/30 transition-colors border border-brand-teal/20"
                title="Snapshot Now"
            >
                <Camera className="w-6 h-6" />
            </button>
        </div>
      </main>

      <footer className="p-8 flex flex-col items-center gap-6">
        <AnimatePresence>
            {seconds === 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <p className="text-brand-teal font-bold mb-4">You're ready! Start the scan now.</p>
                </motion.div>
            )}
        </AnimatePresence>
        
        <button 
            onClick={onStartCapture}
            className="w-full max-w-sm py-5 bg-white text-brand-dark rounded-full font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-brand-teal hover:text-white transition-all transform hover:-translate-y-1"
        >
            <Camera className="w-6 h-6" />
            READY TO SNAP
        </button>
      </footer>
    </div>
  );
}
