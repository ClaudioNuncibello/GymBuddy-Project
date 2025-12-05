"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

// --- TIPI ---
interface User { id: number; username: string; is_manager: boolean; }
interface Exercise { id: number; title: string; description: string; video_url: string; default_rest: number; }
interface Workout { id: number; title: string; description: string; }

// --- COMPONENTI UI ---
const InputField = ({ label, type = "text", placeholder, value, onChange }: any) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
    <input
      type={type}
      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red outline-none text-gray-900 transition-colors"
      placeholder={placeholder}
      value={value || ""}
      onChange={onChange}
    />
  </div>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "exercises" | "workouts">("users");
  
  // Dati
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  
  // Stati Modali
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewAssignmentsModalOpen, setIsViewAssignmentsModalOpen] = useState(false);
  
  // --- NUOVO: STATI PER PROFILO UTENTE ---
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userWorkouts, setUserWorkouts] = useState<Workout[]>([]);

  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  // --- INIT ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.is_manager) router.push("/dashboard");
    } catch { router.push("/login"); }

    refreshAllData();
  }, []);

  const refreshAllData = async () => {
    try {
      const [u, e, w] = await Promise.all([
        api.get("/users/"),
        api.get("/exercises/"),
        api.get("/workouts/")
      ]);
      setUsers(u.data);
      setExercises(e.data);
      setWorkouts(w.data);
    } catch (err) { console.error(err); }
  };

  // --- LOGICA PROFILO UTENTE (NUOVA) ---
  const handleOpenUserProfile = async (user: User) => {
    setViewingUser(user);
    try {
      const res = await api.get(`/users/${user.id}/workouts`);
      setUserWorkouts(res.data);
      setIsUserProfileOpen(true);
    } catch (err) { alert("Errore caricamento schede utente"); }
  };

  const handleUnassignWorkoutFromUser = async (workoutId: number) => {
    if (!viewingUser) return;
    if (!confirm("Rimuovere questa scheda dall'utente?")) return;
    
    try {
      // Usiamo l'endpoint di rimozione esistente
      await api.delete(`/assign-workout/${workoutId}/user/${viewingUser.id}`);
      // Aggiorniamo la lista locale
      setUserWorkouts((prev) => prev.filter(w => w.id !== workoutId));
    } catch (err) { alert("Errore rimozione"); }
  };

  // --- LOGICA ESISTENTE ---
  const handleViewAssignments = async (workoutId: number) => {
    setSelectedWorkoutId(workoutId);
    try {
      const res = await api.get(`/workouts/${workoutId}/users`);
      setAssignedUsers(res.data);
      setIsViewAssignmentsModalOpen(true);
    } catch (err) { alert("Errore caricamento assegnazioni"); }
  };

  const handleUnassignUser = async (userId: number) => {
    if (!confirm("Rimuovere la scheda a questo utente?")) return;
    try {
      await api.delete(`/assign-workout/${selectedWorkoutId}/user/${userId}`);
      setAssignedUsers((prev) => prev.filter(u => u.id !== userId));
    } catch (err) { alert("Errore rimozione assegnazione"); }
  };

  const handleAssign = async (userId: number) => {
    if (!selectedWorkoutId) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      await api.post(`/assign-workout/${selectedWorkoutId}/to-user/${user.username}`);
      alert(`Scheda assegnata a ${user.username}!`);
      setIsAssignModalOpen(false);
    } catch (err) { alert("Errore: Scheda probabilmente già assegnata."); }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item || {}); 
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo elemento?")) return;
    try {
      await api.delete(`/${activeTab}/${id}`);
      refreshAllData();
    } catch (err) { alert("Errore eliminazione"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.patch(`/${activeTab}/${editingItem.id}`, formData);
      } else {
        const endpoint = activeTab === "users" ? "/register" : `/${activeTab}/`;
        await api.post(endpoint, formData);
      }
      setIsModalOpen(false);
      refreshAllData();
    } catch (err) { alert("Errore salvataggio. Controlla i dati."); }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-24">
      
      {/* HEADER */}
      <header className="bg-gym-red text-white p-6 pt-12 shadow-lg rounded-b-[2rem] mb-6 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gym-yellow text-xs font-bold uppercase tracking-widest">Pannello Admin</p>
            <h1 className="text-3xl font-black italic tracking-tight">GYM MASTER</h1>
          </div>
          <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
        <div className="flex bg-black/20 p-1 rounded-xl mt-6 backdrop-blur-sm">
          {["users", "exercises", "workouts"].map((tab: any) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                activeTab === tab ? "bg-white text-gym-red shadow-md transform scale-105" : "text-white/70 hover:text-white"
              }`}
            >
              {tab === "users" ? "Utenti" : tab === "exercises" ? "Esercizi" : "Schede"}
            </button>
          ))}
        </div>
      </header>

      {/* CONTENUTO */}
      <main className="px-5 space-y-4">
        
        {/* TAB UTENTI */}
        {activeTab === "users" && users.map((user) => (
          <div key={user.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${user.is_manager ? "bg-gym-yellow text-gym-red" : "bg-gray-100 text-gray-500"}`}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg">{user.username}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${user.is_manager ? "bg-red-100 text-gym-red" : "bg-gray-100 text-gray-500"}`}>
                  {user.is_manager ? "Admin" : "Atleta"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Tasto PROFILO/SCHEDE */}
              <button 
                onClick={() => handleOpenUserProfile(user)} 
                className="p-3 text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100"
                title="Vedi Schede Assegnate"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              
              <button onClick={() => handleOpenModal(user)} className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
              <button onClick={() => handleDelete(user.id)} className="p-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div>
        ))}

        {/* TAB ESERCIZI */}
        {activeTab === "exercises" && exercises.map((ex) => (
          <div key={ex.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-gray-900 text-lg">{ex.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{ex.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleOpenModal(ex)} className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
              <button onClick={() => handleDelete(ex.id)} className="p-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div>
        ))}

        {/* TAB SCHEDE */}
        {activeTab === "workouts" && workouts.map((workout) => (
          <div key={workout.id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-xl text-gym-red uppercase italic tracking-tight">{workout.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{workout.description || "Nessuna descrizione"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(workout)} className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                <button onClick={() => handleDelete(workout.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => router.push(`/dashboardAdmin/workout/${workout.id}`)}
                className="py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                MODIFICA ESERCIZI
              </button>
              <button 
                onClick={() => handleViewAssignments(workout.id)}
                className="py-3 bg-purple-100 text-purple-700 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
              >
                UTENTI ({assignedUsers.length > 0 && selectedWorkoutId === workout.id ? assignedUsers.length : "?"})
              </button>
            </div>
            <button 
              onClick={() => { setSelectedWorkoutId(workout.id); setIsAssignModalOpen(true); }}
              className="w-full py-2 bg-gym-yellow text-gym-red rounded-lg text-xs font-black uppercase tracking-wide hover:bg-yellow-300 transition-colors shadow-sm"
            >
              + ASSEGNA A NUOVO ATLETA
            </button>
          </div>
        ))}

        <div className="h-20"></div>
      </main>

      {/* FAB - ADD BUTTON */}
      <button onClick={() => handleOpenModal(null)} className="fixed bottom-6 right-6 h-16 w-16 bg-gym-red text-white rounded-full flex items-center justify-center shadow-xl shadow-gym-red/40 hover:scale-105 active:scale-95 transition-all z-20 border-4 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      {/* MODALE CRUD (Standard) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gym-red mb-6 uppercase italic tracking-tight">
              {editingItem ? "Modifica" : "Nuovo"} {activeTab === "users" ? "Utente" : activeTab === "exercises" ? "Esercizio" : "Scheda"}
            </h2>
            <form onSubmit={handleSubmit}>
              {activeTab === "users" && (
                <>
                  <InputField label="Username" placeholder="Es. mario.rossi" value={formData.username} onChange={(e: any) => handleInputChange("username", e.target.value)} />
                  <InputField label="Password" type="password" placeholder={editingItem ? "Lascia vuoto per mantenere" : "••••••••"} value={formData.password} onChange={(e: any) => handleInputChange("password", e.target.value)} />
                  <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input type="checkbox" className="w-6 h-6 accent-gym-red rounded cursor-pointer" checked={formData.is_manager || false} onChange={(e) => handleInputChange("is_manager", e.target.checked)} />
                    <label className="text-gray-700 font-bold cursor-pointer">Permessi Amministratore</label>
                  </div>
                </>
              )}
              {activeTab === "exercises" && (
                <>
                  <InputField label="Titolo" placeholder="Es. Panca Piana" value={formData.title} onChange={(e: any) => handleInputChange("title", e.target.value)} />
                  <InputField label="Descrizione" placeholder="Breve descrizione..." value={formData.description} onChange={(e: any) => handleInputChange("description", e.target.value)} />
                  <div className="mb-4">
                    <InputField label="Video URL (Nome file)" placeholder="es. panca.mp4" value={formData.video_url} onChange={(e: any) => handleInputChange("video_url", e.target.value)} />
                    {formData.video_url && (
                        <a href={`http://localhost:8000/video/${formData.video_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline font-bold flex items-center gap-1 mt-1 hover:text-blue-700">
                          Prova il link video (Apri in nuova scheda)
                        </a>
                    )}
                  </div>
                  <InputField label="Recupero Default (sec)" type="number" placeholder="60" value={formData.default_rest} onChange={(e: any) => handleInputChange("default_rest", e.target.value)} />
                </>
              )}
              {activeTab === "workouts" && (
                <>
                  <InputField label="Titolo Scheda" placeholder="Es. Forza A" value={formData.title} onChange={(e: any) => handleInputChange("title", e.target.value)} />
                  <InputField label="Descrizione" placeholder="Note per l'atleta..." value={formData.description} onChange={(e: any) => handleInputChange("description", e.target.value)} />
                </>
              )}
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition">Annulla</button>
                <button type="submit" className="flex-1 py-3 bg-gym-red text-white font-bold rounded-xl shadow-lg shadow-gym-red/30 hover:bg-red-800 transition">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE ASSEGNAZIONE */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-gray-900 mb-2">ASSEGNA A...</h2>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 mb-6 pr-2">
              {users.filter(u => !u.is_manager).map(user => (
                <button key={user.id} onClick={() => handleAssign(user.id)} className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-gym-red hover:bg-red-50 flex items-center gap-3 transition-all group">
                  <div className="h-10 w-10 bg-gray-100 group-hover:bg-white group-hover:text-gym-red rounded-full flex items-center justify-center text-sm font-bold text-gray-500 transition-colors">{user.username.charAt(0).toUpperCase()}</div>
                  <span className="font-bold text-gray-700 group-hover:text-gym-red">{user.username}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setIsAssignModalOpen(false)} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Chiudi</button>
          </div>
        </div>
      )}

      {/* MODALE VEDI ASSEGNATI */}
      {isViewAssignmentsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-gray-900 mb-2">ATLETI ATTIVI</h2>
            <div className="max-h-[50vh] overflow-y-auto space-y-3 mb-6 pr-2">
              {assignedUsers.length === 0 ? <p className="text-center text-gray-400 py-4 italic">Nessun utente assegnato.</p> : assignedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-700 text-sm">{user.username}</span>
                  <button onClick={() => handleUnassignUser(user.id)} className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                </div>
              ))}
            </div>
            <button onClick={() => setIsViewAssignmentsModalOpen(false)} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Chiudi</button>
          </div>
        </div>
      )}

      {/* --- MODALE NUOVO: PROFILO UTENTE (SCHEDE) --- */}
      {isUserProfileOpen && viewingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className="h-14 w-14 bg-gym-yellow text-gym-red rounded-full flex items-center justify-center text-xl font-black">
                {viewingUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase italic leading-none">{viewingUser.username}</h2>
                <p className="text-gray-500 text-xs font-bold mt-1">Schede Assegnate</p>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-3 mb-6 pr-2">
              {userWorkouts.length === 0 ? (
                <p className="text-center text-gray-400 py-8 font-medium">Nessuna scheda attiva.</p>
              ) : (
                userWorkouts.map(workout => (
                  <div key={workout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gym-red/30 transition-colors group">
                    <div>
                      <h4 className="font-bold text-gray-800">{workout.title}</h4>
                      <p className="text-xs text-gray-400 truncate w-40">{workout.description}</p>
                    </div>
                    <button 
                      onClick={() => handleUnassignWorkoutFromUser(workout.id)}
                      className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
                      title="Rimuovi scheda"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setIsUserProfileOpen(false)} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Chiudi</button>
          </div>
        </div>
      )}

    </div>
  );
}