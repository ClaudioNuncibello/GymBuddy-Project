"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

interface Workout {
  id: number;
  title: string;
  description: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [username, setUsername] = useState("Atleta");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded: any = jwtDecode(token);
      setUsername(decoded.sub);
    } catch {
      router.push("/login");
    }

    const fetchWorkouts = async () => {
      try {
        const res = await api.get("/workouts/");
        setWorkouts(res.data);
      } catch (error) {
        console.error("Errore scaricamento schede", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [router]);

  const latestWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;

  return (
    // CAMBIO SFONDO: da black a gray-50
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 font-sans selection:bg-gym-yellow selection:text-gym-red">
      
      {/*HEADER (Bianco Sfumato) */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-end bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Bentornato</p>
          <h1 className="text-3xl font-black text-gym-red tracking-tight italic uppercase">{username}</h1>
        </div>
        {/* Avatar: Giallo con testo Rosso */}
        <div className="h-12 w-12 bg-gym-yellow rounded-full flex items-center justify-center border-2 border-white shadow-md">
          <span className="text-xl font-black text-gym-red">{username.charAt(0).toUpperCase()}</span>
        </div>
      </header>

      <main className="px-5 space-y-8 mt-6">
        
        {/* HERO CARD (Rossa) */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Consigliato per te</h2>
          </div>
          
          {loading ? (
             <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
          ) : latestWorkout ? (
            <div 
              onClick={() => router.push(`/dashboard/workout/${latestWorkout.id}`)}
              className="bg-gym-red rounded-2xl p-6 shadow-xl shadow-gym-red/30 relative overflow-hidden active:scale-[0.98] transition-transform duration-100 cursor-pointer text-white"
            >
              {/* Decorazione */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gym-yellow opacity-20 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <span className="bg-gym-yellow text-gym-red text-xs font-black px-2 py-1 rounded mb-3 inline-block uppercase tracking-wide">Nuova Scheda</span>
                <h3 className="text-2xl font-black mb-1 truncate uppercase italic">{latestWorkout.title}</h3>
                <p className="text-white/80 text-sm mb-6 line-clamp-2 font-medium">
                  {latestWorkout.description || "Pronto a spingere? Inizia subito."}
                </p>
                
                <button className="w-full bg-white text-gym-red font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gym-yellow transition-colors shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  INIZIA SUBITO
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-400 font-medium">Nessuna scheda in evidenza.</p>
            </div>
          )}
        </section>

        {/* LISTA SCHEDE (Bianche) */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Tutte le Schede</h2>
          
          {loading ? (
            <div className="text-center py-10 text-gray-400 font-medium">Caricamento elenco...</div>
          ) : workouts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 mb-2 font-medium">Nessuna scheda assegnata.</p>
              <p className="text-sm text-gym-red font-bold">Chiedi al tuo coach!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div 
                  key={workout.id} 
                  onClick={() => router.push(`/dashboard/workout/${workout.id}`)}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between active:bg-gray-50 transition-all cursor-pointer hover:shadow-md hover:border-gym-red/20 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Icona Lista: Grigio chiaro o Rosso al passaggio del mouse */}
                    <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-gym-red group-hover:bg-gym-red/5 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg line-clamp-1">{workout.title}</h4>
                      <p className="text-gray-500 text-sm line-clamp-1">{workout.description || "Allenamento"}</p>
                    </div>
                  </div>
                  <svg className="text-gray-300 group-hover:text-gym-red transition-colors" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* BOTTOM NAV (Bianca) */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1 text-gym-red w-16">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[10px] font-black tracking-wide">HOME</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 w-16 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          <span className="text-[10px] font-bold">STORICO</span>
        </button>

        <button 
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/login");
          }}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gym-red w-16 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          <span className="text-[10px] font-bold">ESCI</span>
        </button>
      </nav>
    </div>
  );
}