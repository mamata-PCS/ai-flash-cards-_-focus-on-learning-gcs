import { useState, useEffect, FormEvent } from "react";
import { motion } from "motion/react";
import { Camera, Clock, ChevronRight, LogOut, User as UserIcon, HelpCircle, Folder as FolderIcon, Plus, Search, Image as ImageIcon } from "lucide-react";
import { auth, logout, db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { StudyContent } from "../lib/gemini";
import Onboarding from "./Onboarding";
import { Folder } from "../App";

interface DashboardProps {
  history: (StudyContent & { id: string, createdAt: any, folderId?: string, imageUrl?: string })[];
  folders: Folder[];
  onStartCapture: () => void;
  onStartFocus: () => void;
  onSelectGuide: (guide: StudyContent) => void;
}

export default function Dashboard({ history, folders, onStartCapture, onStartFocus, onSelectGuide }: DashboardProps) {
  const user = auth.currentUser;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("snapstudy_onboarding_seen");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem("snapstudy_onboarding_seen", "true");
    setShowOnboarding(false);
  };

  const handleCreateFolder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newFolderName.trim()) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/folders`), {
        name: newFolderName.trim(),
        createdAt: serverTimestamp(),
        color: "#4ECDC4"
      });
      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (e) {
      console.error("Error creating folder:", e);
    }
  };

  const filteredGuides = history.filter(guide => {
    const matchesFolder = selectedFolderId ? guide.folderId === selectedFolderId : true;
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto font-sans">
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
      
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-coral rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <span className="text-white text-2xl font-bold font-app underline">F</span>
          </div>
          <div>
            <h1 className="text-xl font-bold font-app text-brand-dark leading-tight">AI Flash Cards</h1>
            <p className="text-[9px] tracking-widest text-brand-coral font-bold uppercase">Focus on Learning</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-brand-yellow text-xs font-bold">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>{history.length} Guides Saved</span>
          </div>
          <button 
            onClick={() => setShowOnboarding(true)}
            className="p-2 text-stone-300 hover:text-brand-teal transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button onClick={() => logout()} className="p-2 text-stone-400 hover:text-brand-coral transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartCapture}
          className="card-vibrant p-8 flex flex-col items-center justify-center gap-4 text-brand-dark bg-white"
        >
          <div className="w-16 h-16 bg-brand-teal rounded-full flex items-center justify-center shadow-lg shadow-teal-100">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h3 className="font-app font-bold text-2xl mb-1">Snapshot</h3>
            <p className="text-stone-500 font-medium">Capture textbook page</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartFocus}
          className="card-vibrant p-8 flex flex-col items-center justify-center gap-4 text-brand-dark bg-white border-brand-teal/20"
        >
          <div className="w-16 h-16 bg-brand-coral rounded-full flex items-center justify-center shadow-lg shadow-red-100">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h3 className="font-app font-bold text-2xl mb-1">Focus Mode</h3>
            <p className="text-stone-500 font-medium">Study before you snap</p>
          </div>
        </motion.button>
      </section>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
          <input 
            type="text" 
            placeholder="Search guides..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-stone-100 rounded-2xl py-3 pl-12 pr-4 font-bold text-sm focus:border-brand-teal outline-none transition-all placeholder:text-stone-300"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:max-w-[50%]">
          <button 
            onClick={() => setSelectedFolderId(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${!selectedFolderId ? 'bg-brand-teal border-brand-teal text-white' : 'bg-white border-stone-100 text-stone-400'}`}
          >
            All
          </button>
          {folders.map(f => (
            <button 
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${selectedFolderId === f.id ? 'bg-brand-teal border-brand-teal text-white' : 'bg-white border-stone-100 text-stone-400'}`}
            >
              {f.name}
            </button>
          ))}
          <button 
            onClick={() => setShowCreateFolder(true)}
            className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center hover:bg-brand-teal/20 transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showCreateFolder && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-white rounded-3xl border-2 border-brand-teal shadow-xl"
        >
          <form onSubmit={handleCreateFolder} className="flex gap-4">
            <input 
              autoFocus
              type="text" 
              placeholder="New folder name..." 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-brand-teal"
            />
            <button type="submit" className="bg-brand-teal text-white px-8 py-3 rounded-2xl font-bold">CREATE</button>
            <button type="button" onClick={() => setShowCreateFolder(false)} className="px-4 text-stone-400 font-bold text-xs uppercase">Cancel</button>
          </form>
        </motion.div>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-brand-coral">
            <Clock className="w-4 h-4" />
            <h3 className="font-bold uppercase tracking-widest text-[10px]">Your Vault</h3>
          </div>
          <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{filteredGuides.length} Items</span>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="text-center py-20 bg-white/40 rounded-[40px] border-2 border-dashed border-brand-yellow">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-stone-100">
               <Search className="w-6 h-6 text-stone-200" />
            </div>
            <p className="text-stone-400 font-medium">No results found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuides.map((guide) => (
              <motion.div
                key={guide.id}
                whileHover={{ y: -4 }}
                onClick={() => onSelectGuide(guide)}
                className="card-vibrant p-5 flex flex-col gap-4 cursor-pointer group border-2 relative overflow-hidden bg-white"
              >
                {guide.imageUrl && (
                   <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                      <img src={guide.imageUrl} alt="Scan preview" className="w-full h-full object-cover" />
                   </div>
                )}
                
                <div className="flex items-start justify-between z-10">
                  <div className="flex-1">
                    <h4 className="font-app font-bold text-xl text-brand-dark leading-snug group-hover:text-brand-coral transition-colors truncate">{guide.title}</h4>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-md">
                        {guide.flashcards.length} Cards
                      </span>
                      {guide.imageUrl && (
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-stone-300">
                          <ImageIcon className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center group-hover:bg-brand-coral transition-all transform group-hover:rotate-12">
                    <ChevronRight className="w-5 h-5 text-brand-coral group-hover:text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
