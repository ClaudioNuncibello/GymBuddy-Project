"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useWorkoutSession } from "@/context/ActiveWorkoutContext"; // <--- Importiamo il contesto

// --- TIPI ---
interface ExerciseWithWorkload {
  id: number;
  title: string;
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
  exercises: ExerciseWithWorkload[];
}

export default function WorkoutPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  
  // STATO LOCALE (Solo per i dati statici della scheda)
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // STATO GLOBALE (Dal Context)
  const { state: session, startSession, endSession, updateState } = useWorkoutSession();

  // TIMER LOCALE ESECUZIONE (Solo visivo, sincronizzato col globale se serve)
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Carica Dati Scheda
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/workouts/${id}`);
        setWorkout(res.data);
      } catch (error) { console.error("Errore loading", error); } 
      finally { setLoading(false); }
    };
    fetchDetail();
  }, [id]);

  // 2. Inizializzazione o Ripristino Sessione
  useEffect(() => {
    if (loading || !workout) return;

    // Se c'è già una sessione attiva per QUESTA scheda, la usiamo (Resume)
    if (session.isSessionActive && session.workoutId === id) {
      console.log("Ripristino sessione attiva...");
      // Se eravamo in REST, sincronizziamo il timer locale col globale
      if (session.status === "REST") {
        setLocalTimeLeft(session.restTimeLeft);
      }
    } 
    // Altrimenti ne iniziamo una nuova
    else {
      const startIndex = parseInt(searchParams.get("start") || "0", 10);
      console.log("Nuova sessione...");
      startSession(id, startIndex);
    }
  }, [loading, workout, id]); // Rimosso session dalle dipendenze per evitare loop

  // 3. Gestione Timer Locale (Esecuzione esercizi a tempo)
  useEffect(() => {
    // Questo timer gestisce solo il conto alla rovescia VISIVO dell'esercizio o del recupero
    // Il tempo totale è gestito dal Context
    if ((session.status === "WORK" && currentExercise?.time_seconds) || session.status === "REST") {
        if (localTimeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setLocalTimeLeft((t) => t - 1);
                // Se siamo in REST, aggiorniamo anche il contesto per persistenza
                if (session.status === "REST") updateState({ restTimeLeft: localTimeLeft - 1 });
            }, 1000);
        } else if (localTimeLeft === 0) {
            handleTimerComplete();
        }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [localTimeLeft, session.status]);


  // Helper variabili
  const currentExIndex = session.currentExIndex;
  const currentSet = session.currentSet;
  const currentExercise = workout?.exercises[currentExIndex];

  // --- LOGICA DI GIOCO (Usa updateState invece di setState) ---

  const handleStartWorkout = () => {
    updateState({ status: "WORK" });
    if (currentExercise?.time_seconds) {
      setLocalTimeLeft(currentExercise.time_seconds);
    }
  };

  const handleFinishSet = () => {
    if (currentSet < (currentExercise?.sets || 1)) {
      startRest();
    } else {
      if (currentExIndex < (workout?.exercises.length || 0) - 1) {
        startRest(true);
      } else {
        endSession(); // Finito!
      }
    }
  };

  const startRest = (isSwitchingExercise = false) => {
    const restTime = currentExercise?.rest_seconds || 90;
    updateState({ status: "REST", restTimeLeft: restTime });
    setLocalTimeLeft(restTime);
  };

  const handleTimerComplete = () => {
    if (session.status === "WORK") { handleFinishSet(); return; }
    if (session.status === "REST") { nextStep(); }
  };

  const nextStep = () => {
    let nextSet = currentSet;
    let nextIndex = currentExIndex;

    if (currentSet < (currentExercise?.sets || 1)) {
      nextSet += 1;
    } else {
      nextIndex += 1;
      nextSet = 1;
    }

    // Aggiorniamo il contesto
    updateState({ status: "WORK", currentSet: nextSet, currentExIndex: nextIndex });

    // Setup timer prossimo esercizio se serve
    const nextEx = workout?.exercises[currentSet < (currentExercise?.sets || 1) ? currentExIndex : currentExIndex + 1];
    if (nextEx?.time_seconds) {
      setLocalTimeLeft(nextEx.time_seconds);
    }
  };

  const skipRest = () => {
    // Forziamo timer a 0 per scatenare handleTimerComplete
    setLocalTimeLeft(0);
  };

  // --- RENDER ---

  if (loading || !session) return <div className="min-h-screen bg-white text-gym-red flex items-center justify-center font-bold animate-pulse">Caricamento Player...</div>;
  if (!workout || !currentExercise) return <div className="min-h-screen bg-white flex items-center justify-center">Dati non disponibili</div>;

  if (session.status === "FINISHED") {
    return (
      <div className="min-h-screen bg-gym-red text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in">
        <h1 className="text-5xl font-black italic uppercase mb-4">Grande!</h1>
        <p className="text-xl mb-2 text-white/90">Hai completato {workout.title}.</p>
        <div className="bg-white/20 px-6 py-3 rounded-xl mb-8 backdrop-blur-sm">
          <p className="text-sm font-bold uppercase tracking-widest opacity-80">Durata Totale</p>
          <p className="text-4xl font-black font-mono">{formatTime(session.totalTime)}</p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="bg-white text-gym-red px-8 py-4 rounded-xl font-bold shadow-xl active:scale-95 transition">
          Torna alla Home
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${session.status === "REST" ? "bg-gym-yellow text-gray-900" : "bg-white text-gray-900"}`}>
      
      <div className="px-6 py-6 flex justify-between items-center bg-transparent z-10">
        <button onClick={() => router.back()} className="opacity-50 hover:opacity-100">
          {/* Tasto Indietro (Ora sicuro perché lo stato è nel Context!) */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <span className="font-bold text-xs uppercase tracking-widest opacity-60">
          {session.status === "REST" ? "RECUPERO" : session.status === "WORK" ? "IN ESECUZIONE" : "PRONTO"}
        </span>
        {/* TIMER GLOBALE DAL CONTESTO */}
        <div className="flex items-center gap-2 font-mono font-bold opacity-80 bg-black/5 px-3 py-1 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {formatTime(session.totalTime)}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-12 w-full">
        
        <h2 className="text-4xl font-black uppercase italic mb-4 leading-tight">
          {session.status === "REST" ? "Riposati..." : currentExercise.title}
        </h2>
        
        {session.status === "WORK" && (
          <p className="text-gray-500 font-medium mb-8 text-xl">
            Serie <strong className="text-gym-red text-2xl">{currentSet}</strong> di {currentExercise.sets}
          </p>
        )}

        {/* DISPLAY PRINCIPALE */}
        <div className="mb-12">
          {session.status === "REST" || (session.status === "WORK" && currentExercise.time_seconds) ? (
            <div className={`text-[8rem] font-black leading-none tabular-nums tracking-tighter ${session.status === "REST" ? "text-gray-900" : "text-gym-red"}`}>
              {localTimeLeft}<span className="text-2xl text-gray-400 font-bold ml-1">s</span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <span className="text-[9rem] font-black text-gym-red leading-none">{currentExercise.reps}</span>
              <span className="text-2xl font-bold text-gray-400 uppercase tracking-widest mt-[-10px]">Reps</span>
            </div>
          )}
        </div>

        {/* PULSANTI */}
        {session.status === "READY" && (
          <button onClick={handleStartWorkout} className="w-full max-w-xs bg-gym-red text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-gym-red/30 active:scale-95 transition-all">
            INIZIA
          </button>
        )}

        {session.status === "WORK" && (
          <button onClick={handleFinishSet} className="w-full max-w-xs bg-gray-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">
            {currentExercise.time_seconds ? "STOP TIMER" : "SERIE COMPLETATA"}
          </button>
        )}

        {session.status === "REST" && (
          <div className="w-full max-w-xs mx-auto">
            <p className="text-sm font-bold opacity-50 mb-4 uppercase">
              Prossimo: {currentSet < currentExercise.sets ? currentExercise.title : workout.exercises[currentExIndex + 1]?.title || "Finito"}
            </p>
            <button onClick={skipRest} className="w-full px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-2xl font-bold hover:bg-gray-900 hover:text-white transition-colors">
              SALTA RECUPERO ⏩
            </button>
          </div>
        )}

      </div>
    </div>
  );
}