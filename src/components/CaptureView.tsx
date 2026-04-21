import { useState, useRef, ChangeEvent, useEffect } from "react";
import { motion } from "motion/react";
import { Camera as CameraIcon, Upload, X, BookOpen, Folder as FolderIcon, ChevronDown } from "lucide-react";
import { analyzeTextbookImage, StudyContent } from "../lib/gemini";
import { auth, db, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { Folder } from "../App";

interface CaptureViewProps {
  onCancel: () => void;
  onSuccess: (guide: StudyContent) => void;
}

export default function CaptureView({ onCancel, onSuccess }: CaptureViewProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth.currentUser) {
      const fetchFolders = async () => {
        const q = query(collection(db, `users/${auth.currentUser?.uid}/folders`), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Folder)));
      };
      fetchFolders();
    }
  }, []);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Balanced for OCR vs Firestore size limits
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const raw = reader.result as string;
        const compressed = await compressImage(raw);
        setImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // 1. AI Analysis
      const content = await analyzeTextbookImage(image);
      
      // 2. Database Sync
      if (auth.currentUser) {
        try {
          const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/studyGuides`), {
            ...content,
            createdAt: serverTimestamp(),
            userId: auth.currentUser.uid,
            imageUrl: image,
            folderId: selectedFolderId || null
          });
          onSuccess({ ...content, id: docRef.id } as any);
        } catch (dbErr: any) {
          console.error("Firestore Save Error:", dbErr);
          // Distinguish between size errors and other errors
          if (dbErr.message?.includes("exceeds the maximum allowed size") || dbErr.message?.includes("too large")) {
            setError("Document too large. Try a smaller image or one with less text.");
          } else {
            // If the AI worked but DB failed, don't block the user from studying
            setError("Study guide created but cloud sync failed. You can still study now!");
            setTimeout(() => onSuccess(content), 2000);
          }
          setIsAnalyzing(false);
        }
      } else {
        onSuccess(content);
      }
    } catch (aiErr: any) {
      console.error("Analysis failure:", aiErr);
      setError(aiErr.message || "The AI couldn't read this image. Please try again with a clearer, brighter photo.");
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-brand-bg">
        <motion.div
           animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
           transition={{ duration: 1.5, repeat: Infinity }}
           className="w-24 h-24 bg-brand-coral rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-red-200"
        >
          <BookOpen className="w-12 h-12 text-white" />
        </motion.div>
        
        <h2 className="text-3xl font-app font-bold mb-4 text-brand-dark">Genius at Work...</h2>
        <p className="text-stone-600 mb-10 max-w-xs mx-auto font-medium">Vertex AI is scanning your textbook to build the perfect study guide.</p>
        
        <div className="w-64 h-3 bg-white rounded-full overflow-hidden mx-auto shadow-inner border-2 border-brand-yellow relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-1/2 h-full bg-brand-teal"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <button onClick={onCancel} className="p-2 rounded-full bg-white/10 text-white hover:bg-brand-coral transition-colors">
          <X className="w-6 h-6" />
        </button>
        <span className="font-bold uppercase tracking-widest text-[10px] opacity-60">AI Scanner : Pro</span>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
        {image ? (
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl border-4 border-brand-yellow bg-black">
            <img src={image} className="w-full h-full object-cover" alt="Capture" />
            <div className="scanning-line animate-scan"></div>
            <button 
              onClick={() => setImage(null)}
              className="absolute top-6 right-6 p-3 bg-brand-coral rounded-full text-white shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm aspect-[3/4] rounded-[40px] border-4 border-dashed border-white/20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/5 transition-all group"
          >
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-brand-teal/20 group-hover:scale-110 transition-all">
              <CameraIcon className="w-10 h-10 text-white/40 group-hover:text-brand-teal" />
            </div>
            <div className="text-center">
              <p className="text-white/60 font-bold text-lg mb-1">Snapshot Page</p>
              <p className="text-white/30 text-xs font-medium uppercase tracking-widest">Better lighting = Better study cards</p>
            </div>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileChange} 
        />
        
        {error && (
          <p className="mt-6 text-white text-xs font-bold bg-brand-coral px-6 py-3 rounded-2xl shadow-lg border-2 border-white/20">
            {error}
          </p>
        )}
      </div>

      <footer className="p-8 pb-12 bg-gradient-to-t from-black to-transparent flex flex-col items-center gap-6">
        {image ? (
          <>
            {folders.length > 0 && (
              <div className="w-full max-w-sm relative">
                <FolderIcon className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <select 
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full bg-white/10 border-2 border-white/10 rounded-2xl py-4 pl-12 pr-10 text-white font-bold text-sm appearance-none focus:border-brand-teal outline-none cursor-pointer"
                >
                  <option value="" className="bg-brand-dark">Study Folder (Optional)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id} className="bg-brand-dark">{f.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-white/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={handleStartAnalysis}
              className="btn-vibrant-coral w-full max-w-sm py-5 text-lg flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              GENERATE STUDY GUIDE
            </motion.button>
          </>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm py-5 bg-white/10 text-white rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/20 transition-colors"
          >
            <Upload className="w-5 h-5" />
            SELECT PHOTO
          </button>
        )}
      </footer>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
