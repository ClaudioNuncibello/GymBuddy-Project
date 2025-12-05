"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ExerciseWithWorkload {
  id: number;
  title: string;
  description: string;
  video_url: string;
  sets: number;
  reps: number;
  time_seconds?: number;
  rest_seconds: number;
  notes?: string;
}

interface WorkoutDetail {
  id: number;
  title: string;
  description: string;
  exercises: ExerciseWithWorkload[];
}

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // STATI PER INTERAZIONE
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/workouts/${id}`);
        setWorkout(res.data);
      } catch (error) {
        console.error("Errore loading scheda", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // --- HELPER VIDEO ---
  const getVideoSrc = (filename: string) => {
    if (!filename) return "";
    if (filename.startsWith("http")) return filename;
    return `${API_BASE_URL}/video/${filename}`;
  };

  // --- HELPER IMMAGINE (AUTOMATICO) ---
  const getImageSrc = (videoFilename: string) => {
    if (!videoFilename) return "";
    // Se è un URL esterno, restituisci placeholder o l'url stesso se è un'immagine
    if (videoFilename.startsWith("http")) return videoFilename;
    
    // LOGICA DI SOSTITUZIONE: panca.mp4 -> panca.jpg
    // Rimuove l'estensione (ultimi 4 caratteri) e aggiunge .jpg
    const imageName = videoFilename.replace(/\.[^/.]+$/, "") + ".jpg";
    
    return `${API_BASE_URL}/image/${imageName}`;
  };

  const handleStart = () => {
    router.push(`/dashboard/workout/${id}/play?start=${selectedIndex}`);
  };

  const toggleExpand = (exId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === exId ? null : exId);
  };

  if (loading) return <div className="min-h-screen bg-white text-gym-red flex items-center justify-center font-bold animate-pulse">Caricamento...</div>;
  if (!workout) return <div className="min-h-screen bg-white text-gray-500 flex items-center justify-center font-medium">Scheda non trovata</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-32 font-sans selection:bg-gym-yellow selection:text-gym-red">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-lg font-black uppercase italic truncate pr-4 text-gym-red">{workout.title}</h1>
      </div>

      <main className="p-5">
        
        <div className="mb-8 text-gray-600 text-sm leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
          {workout.description || "Nessuna descrizione fornita."}
        </div>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-black flex items-center gap-3 text-gray-800 uppercase italic">
            <span className="w-1.5 h-6 bg-gym-yellow rounded-full inline-block"></span>
            Esercizi
          </h2>
          <span className="text-xs font-medium text-gray-400">Tocca per selezionare l'inizio</span>
        </div>

        {/* LISTA ESERCIZI */}
        <div className="space-y-4">
          {workout.exercises?.map((exercise, index) => {
            const isSelected = selectedIndex === index;
            const isExpanded = expandedId === exercise.id;

            return (
              <div 
                key={exercise.id} 
                onClick={() => setSelectedIndex(index)}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer relative ${
                  isSelected 
                    ? "bg-gym-red text-white border-gym-red shadow-lg shadow-gym-red/30 scale-[1.02]" 
                    : "bg-white text-gray-900 border-gray-100 shadow-sm hover:border-gym-red/30"
                }`}
              >
                {/* Indicatore START */}
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-gym-yellow text-gym-red text-[10px] font-black px-2 py-1 rounded-bl-xl uppercase tracking-wider z-10">
                    START QUI
                  </div>
                )}

<div className="p-4 flex flex-col gap-3"> {/* Cambiato in flex-col per ospitare le note sotto */}
                  
                  <div className="flex gap-4 items-center">
                    {/* Immagine */}
                    <div className={`h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border relative ${isSelected ? "border-gym-yellow" : "border-gray-200 bg-gray-100"}`}>
                      <img
                        src={getImageSrc(exercise.video_url)}
                        alt={exercise.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gray-200');
                          e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center font-mono font-bold opacity-30 text-lg">${index + 1}</div>`;
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight mb-1 truncate">{exercise.title}</h3>
                      
                      <div className="flex gap-2 opacity-90">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold border ${isSelected ? "bg-white/20 border-white/30" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                          {exercise.sets} Serie
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold border ${isSelected ? "bg-white/20 border-white/30" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                          {exercise.reps > 0 ? `${exercise.reps} Reps` : `${exercise.time_seconds}s`}
                        </span>
                      </div>
                    </div>

                    {/* Tasto Tendina */}
                    <button 
                      onClick={(e) => toggleExpand(exercise.id, e)}
                      className={`p-2 rounded-full transition-colors z-20 flex-shrink-0 ${
                        isSelected ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-50 hover:bg-gray-100 text-gym-red"
                      }`}
                    >
                      {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      )}
                    </button>
                  </div>

                  {/* VISUALIZZAZIONE NOTE (Se presenti) */}
                  {exercise.notes && (
                    <div className={`text-xs p-2 rounded-lg flex gap-2 items-start ${isSelected ? "bg-white/10 text-white/90" : "bg-yellow-50 text-yellow-800"}`}>
                      <svg className="w-4 h-4 shrink-0 mt-0.5 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      <span>{exercise.notes}</span>
                    </div>
                  )}

                </div>

                {/* --- CONTENUTO TENDINA --- */}
                {isExpanded && (
                  <div className={`p-4 border-t ${isSelected ? "border-white/20 bg-red-900/20" : "border-gray-100 bg-gray-50"}`}>
                    {exercise.description && (
                      <p className={`text-sm mb-4 leading-relaxed ${isSelected ? "text-white/90" : "text-gray-600"}`}>
                        {exercise.description}
                      </p>
                    )}
                    {exercise.video_url ? (
                      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner relative">
                        <video 
                          src={getVideoSrc(exercise.video_url)} 
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-xs italic text-center text-gray-400">Nessun video</div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </main>

      {/* FAB - PLAY BUTTON */}
      <div className="fixed bottom-8 right-6 z-30">
        <button 
          onClick={handleStart}
          className="h-16 w-16 bg-gym-red rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(155,32,55,0.4)] hover:scale-105 active:scale-95 transition-all text-white border-4 border-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>

    </div>
  );
}