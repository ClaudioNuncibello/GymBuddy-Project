"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// --- INTERFACCIA AGGIORNATA CON I TEMPI ---
interface ExerciseWithWorkload {
  id: number;
  title: string;
  video_url: string;
  sets: number;
  reps: number;
  time_seconds?: number; // Opzionale (es. null se è a ripetizioni)
  rest_seconds: number;  // Sempre presente (default 90)
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

  if (loading) return <div className="min-h-screen bg-white text-gym-red flex items-center justify-center font-bold animate-pulse">Caricamento...</div>;
  if (!workout) return <div className="min-h-screen bg-white text-gray-500 flex items-center justify-center font-medium">Scheda non trovata</div>;

  return (
    // SFONDO BIANCO
    <div className="min-h-screen bg-white text-gray-900 pb-24 font-sans">
      
      {/* HEADER BIANCO */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-lg font-black uppercase italic truncate pr-4 text-gym-red">{workout.title}</h1>
      </div>

      <main className="p-5">
        
        <div className="mb-8 text-gray-600 text-sm leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
          {workout.description || "Nessuna descrizione fornita."}
        </div>

        <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-800 uppercase italic">
          <span className="w-1.5 h-6 bg-gym-yellow rounded-full inline-block"></span>
          Lista Esercizi
        </h2>

        {/* LISTA ESERCIZI */}
        <div className="space-y-4">
          {workout.exercises && workout.exercises.length === 0 ? (
            <p className="text-gray-400 text-center py-10 font-medium">Questa scheda è vuota.</p>
          ) : (
            workout.exercises?.map((exercise, index) => (
              <div key={exercise.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-md flex gap-4 relative overflow-hidden group">
                
                {/* Numero */}
                <div className="absolute top-0 right-0 bg-gym-red/5 text-xs px-3 py-1 rounded-bl-xl text-gym-red font-bold font-mono">
                  #{index + 1}
                </div>

                {/* Box Icona */}
                <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-300 border border-gray-100">
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="opacity-50"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>

                <div className="flex-1 flex flex-col justify-center pr-6">
                  <h3 className="font-bold text-lg leading-tight mb-2 text-gray-900">{exercise.title}</h3>
                  
                  {/* --- BADGE CARICO DI LAVORO --- */}
                  <div className="flex flex-wrap gap-2">
                    
                    {/* SERIE */}
                    <span className="bg-gym-red text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm flex items-center gap-1">
                      {exercise.sets} Serie
                    </span>

                    {/* REPS o TEMPO ESECUZIONE */}
                    {exercise.time_seconds && exercise.time_seconds > 0 ? (
                      // Se c'è un tempo, mostriamo quello (es. Plank)
                      <span className="bg-gray-800 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {exercise.time_seconds}s
                      </span>
                    ) : (
                      // Altrimenti mostriamo le ripetizioni
                      <span className="bg-gray-800 text-white text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm">
                        {exercise.reps} Reps
                      </span>
                    )}

                    {/* RECUPERO (Sempre presente) */}
                    <span className="bg-gym-yellow text-gym-red text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm flex items-center gap-1 border border-gym-yellow/50">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6"/><path d="M9 17H4v5"/></svg>
                       Rec: {exercise.rest_seconds}s
                    </span>

                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </main>

      {/* FAB */}
      <div className="fixed bottom-8 right-6 z-30">
        <button className="h-16 w-16 bg-gym-red rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(155,32,55,0.4)] hover:scale-105 active:scale-95 transition-all text-white border-4 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>

    </div>
  );
}