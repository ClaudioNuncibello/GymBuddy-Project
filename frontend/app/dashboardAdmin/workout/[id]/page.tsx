"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// --- INTERFACCE ---
interface Exercise { id: number; title: string; }
interface ExerciseWithWorkload extends Exercise { 
  sets: number; 
  reps: number; 
  rest_seconds: number; 
  time_seconds?: number;
  notes?: string;
}
interface WorkoutDetail { id: number; title: string; description: string; exercises: ExerciseWithWorkload[]; }

// Componente Input Semplificato
const InputField = ({ label, type = "text", placeholder, value, onChange }: any) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
    <input
      type={type}
      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red outline-none text-gray-900 transition-colors"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default function AdminWorkoutEditor({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Spacchettiamo l'ID dai params (Next.js 15+)
  const { id } = use(params);
  
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Stati Form
  const [selectedExId, setSelectedExId] = useState<string>("");
  const [sets, setSets] = useState<number | string>(3);
  const [reps, setReps] = useState<number | string>(10);
  const [rest, setRest] = useState<number | string>(90);
  const [notes, setNotes] = useState("");

  // Funzione per caricare i dati della scheda
  const refreshData = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/workouts/${id}`);
      setWorkout(res.data);
    } catch (error: any) { 
      console.error("Errore refreshData:", error);
      if (error.response?.status === 401) {
        alert("Sessione scaduta. Verrai reindirizzato al login.");
        router.push("/login");
      } else if (error.code === "ERR_NETWORK") {
        alert("Impossibile contattare il server. Controlla che il backend sia acceso.");
      } else {
        // Non mostrare alert se è solo un refresh, magari logga e basta
        console.error("Errore caricamento scheda."); 
      }
    } finally {
      setLoading(false);
    }
  };

  // Funzione per caricare il catalogo esercizi
  const loadCatalog = async () => {
    try {
      const res = await api.get("/exercises/");
      setAllExercises(res.data);
    } catch (error) { console.error("Errore catalogo", error); }
  };

  // Init
  useEffect(() => {
    if (id) {
      refreshData();
      loadCatalog();
    }
  }, [id]);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExId) return alert("Seleziona un esercizio");

    try {
      // PREPARAZIONE DATI ROBUSTA
      // Convertiamo in numeri sicuri. Se vuoto o NaN, usa 0 o un default sensato.
      const safeSets = Number(sets) || 0;
      const safeReps = Number(reps) || 0;
      const safeRest = Number(rest) || 0;

      // Usiamo l'oggetto params di Axios invece di costruire la stringa a mano.
      // Questo gestisce automaticamente tipi e caratteri speciali.
      await api.post(
        `/workouts/${id}/add-exercise/${selectedExId}`, 
        null, // Il body è vuoto
        {
          params: {
            sets: safeSets,
            reps: safeReps,
            rest_seconds: safeRest,
            notes: notes // Axios lo ometterà automaticamente se è null/undefined
          }
        }
      );
      
      setIsModalOpen(false);
      setNotes(""); // Reset note
      refreshData(); // Ricarica la lista
    } catch (err: any) { 
      console.error(err);
      // Feedback dettagliato per capire il problema
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      
      if (status === 422) {
        alert(`Errore dati (422): ${JSON.stringify(detail)}`);
      } else if (status === 500) {
        alert(`Errore Server (500): ${detail || "Controlla il terminale backend"}`);
      } else {
        alert(`Errore generico: ${err.message}`);
      }
    }
  };

  const handleRemoveExercise = async (exerciseId: number) => {
    if(!confirm("Rimuovere questo esercizio dalla scheda?")) return;
    try {
      await api.delete(`/workouts/${id}/exercises/${exerciseId}`);
      refreshData();
    } catch (err) { alert("Errore rimozione"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Caricamento Editor...</div>;
  if (!workout) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Scheda non trovata o errore server.</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24 font-sans">
      
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <p className="text-xs text-gym-red font-bold uppercase tracking-wider">Editor Scheda</p>
          <h1 className="text-xl font-black italic uppercase text-gray-900">{workout.title}</h1>
        </div>
      </header>

      <main className="p-5">
        
        <div className="space-y-4">
          {workout.exercises.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <p className="text-gray-400 font-bold mb-2">Scheda Vuota</p>
              <p className="text-sm text-gray-500">Usa il tasto + per aggiungere esercizi.</p>
            </div>
          ) : (
            workout.exercises.map((ex, idx) => (
              <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col gap-2 group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center font-bold font-mono text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{ex.title}</h3>
                      <div className="flex gap-2 text-xs font-bold text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{ex.sets} x {ex.reps}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">Rec: {ex.rest_seconds}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveExercise(ex.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>

                {/* Note */}
                {ex.notes && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800 flex gap-2 items-start">
                    <span className="font-bold">Note:</span> {ex.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </main>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 bg-gym-red text-white rounded-full flex items-center justify-center shadow-xl shadow-gym-red/40 hover:scale-105 active:scale-95 transition-all z-20 border-4 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-gym-red mb-6 uppercase italic">Aggiungi Esercizio</h2>
            
            <form onSubmit={handleAddExercise}>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Esercizio</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red outline-none text-gray-900"
                  value={selectedExId}
                  onChange={(e) => setSelectedExId(e.target.value)}
                >
                  <option value="">-- Seleziona --</option>
                  {allExercises.map(ex => (
                    <option key={ex.id} value={ex.id.toString()}>{ex.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <InputField label="Serie" type="number" value={sets} onChange={(e:any) => setSets(e.target.value)} />
                <InputField label="Reps" type="number" value={reps} onChange={(e:any) => setReps(e.target.value)} />
                <InputField label="Rec (s)" type="number" value={rest} onChange={(e:any) => setRest(e.target.value)} />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Note Esecuzione</label>
                <textarea
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red outline-none text-gray-900 transition-colors"
                  placeholder="Es. Fai pausa in alto..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200">Annulla</button>
                <button type="submit" className="flex-1 py-3 bg-gym-red text-white font-bold rounded-xl shadow-lg shadow-gym-red/30 hover:bg-red-800">Aggiungi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}