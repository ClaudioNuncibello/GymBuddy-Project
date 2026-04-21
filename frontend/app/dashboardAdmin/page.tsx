"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import { User, Exercise, Workout, WorkoutSession } from "@/types";
import { UsersTab } from "@/components/admin/UsersTab";
import { ExercisesTab } from "@/components/admin/ExercisesTab";
import { WorkoutsTab } from "@/components/admin/WorkoutsTab";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { ExerciseModal } from "@/components/admin/modals/ExerciseModal";

// Sub-components inloco per form elementari
const InputField = ({ label, type = "text", placeholder, value, onChange }: { label: string, type?: string, placeholder?: string, value: any, onChange: (e: any) => void}) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
    <input type={type} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red outline-none text-gray-900 transition-colors" placeholder={placeholder} value={value || ""} onChange={onChange} />
  </div>
);

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "exercises" | "workouts">("users");
  
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<"none"|"user"|"exercise"|"workout">("none");
  const [editingItem, setEditingItem] = useState<any>(null); 
  const [formData, setFormData] = useState<any>({});
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewAssignmentsModalOpen, setIsViewAssignmentsModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, config: any}>({isOpen: false, config: null});
  
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userWorkouts, setUserWorkouts] = useState<Workout[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [assignedUsersMap, setAssignedUsersMap] = useState<Record<number, User[]>>({});
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);

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
        api.get("/users/?limit=100"),
        api.get("/exercises/?limit=100"),
        api.get("/workouts/?limit=100")
      ]);
      setUsers(u.data);
      setExercises(e.data);
      setWorkouts(w.data);
      
      // Load assignments for maps
      const map: Record<number, User[]> = {};
      await Promise.all(w.data.map(async (wk: Workout) => {
        try {
          const res = await api.get(`/workouts/${wk.id}/users`);
          map[wk.id] = res.data;
        } catch { map[wk.id] = []; }
      }));
      setAssignedUsersMap(map);
    } catch (err) { toast.error("Errore download dati"); }
  };

  const popConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      config: { title, message, onConfirm }
    });
  };

  const handleOpenUserProfile = async (user: User) => {
    setViewingUser(user);
    try {
      const res = await api.get(`/users/${user.id}/workouts`);
      setUserWorkouts(res.data);
      setIsUserProfileOpen(true);
    } catch (err) { toast.error("Errore caricamento schede utente"); }
  };

  const handleUnassignWorkoutFromUser = async (workoutId: number) => {
    if (!viewingUser) return;
    popConfirm("Rimuovere scheda", "Vuoi davvero rimuovere questa scheda dall'atleta?", async () => {
      try {
        await api.delete(`/assign-workout/${workoutId}/user/${viewingUser.id}`);
        setUserWorkouts((prev) => prev.filter(w => w.id !== workoutId));
        refreshAllData();
        toast.success("Scheda rimossa in Dashboard");
      } catch (err) { toast.error("Errore rimozione"); }
    });
  };

  const handleViewAssignments = async (workoutId: number) => {
    setSelectedWorkoutId(workoutId);
    setAssignedUsers(assignedUsersMap[workoutId] || []);
    setIsViewAssignmentsModalOpen(true);
  };

  const handleUnassignUser = async (userId: number) => {
    popConfirm("Rimuovere atleta", "Rimuovere l'atleta dalla scheda?", async () => {
      try {
        await api.delete(`/assign-workout/${selectedWorkoutId}/user/${userId}`);
        setAssignedUsers((prev) => prev.filter(u => u.id !== userId));
        refreshAllData();
        toast.success("Atleta rimosso");
      } catch (err) { toast.error("Errore rimozione assegnazione"); }
    });
  };

  const handleAssign = async (userId: number) => {
    if (!selectedWorkoutId) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      await api.post(`/assign-workout/${selectedWorkoutId}/to-user/${user.username}`);
      toast.success(`Scheda assegnata a ${user.username}!`);
      setIsAssignModalOpen(false);
      refreshAllData();
    } catch (err) { toast.error("Scheda probabilmente già assegnata."); }
  };

  const handleInputChange = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const openFormModal = (item: any = null, type: "user"|"exercise"|"workout") => {
    setEditingItem(item);
    setFormData(item || {}); 
    setActiveModal(type);
  };

  const handleDelete = async (tab: string, id: number) => {
    popConfirm("Elimina elemento", "Sei sicuro di voler effettuare la cancellazione irreversibile?", async () => {
      try {
        await api.delete(`/${tab}/${id}`);
        toast.success("Elemento eliminato!");
        refreshAllData();
      } catch (err) { toast.error("Errore eliminazione"); }
    });
  };

  const handleSubmitGeneric = async (e: React.FormEvent, endpointObj: string) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.patch(`/${endpointObj}/${editingItem.id}`, formData);
      } else {
        const endpoint = endpointObj === "users" ? "/register" : `/${endpointObj}/`;
        await api.post(endpoint, formData);
      }
      setActiveModal("none");
      toast.success("Salvataggio avvenuto con successo");
      refreshAllData();
    } catch (err) { toast.error("Errore salvataggio. Controlla i dati."); }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-24">
      
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen} 
        {...confirmDialog.config} 
        onCancel={() => setConfirmDialog({isOpen: false, config: null})} 
      />

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
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${ activeTab === tab ? "bg-white text-gym-red shadow-md transform scale-105" : "text-white/70 hover:text-white"}`}>
              {tab === "users" ? "Utenti" : tab === "exercises" ? "Esercizi" : "Schede"}
            </button>
          ))}
        </div>
      </header>

      <main className="px-5">
        {activeTab === "users" && <UsersTab users={users} onOpenProfile={handleOpenUserProfile} onOpenModal={(u) => openFormModal(u, "user")} onDelete={(id) => handleDelete("users", id)} />}
        {activeTab === "exercises" && <ExercisesTab exercises={exercises} onOpenModal={(e) => openFormModal(e, "exercise")} onDelete={(id) => handleDelete("exercises", id)} />}
        {activeTab === "workouts" && <WorkoutsTab workouts={workouts} assignedUsersMap={assignedUsersMap} onOpenModal={(w) => openFormModal(w, "workout")} onDelete={(id) => handleDelete("workouts", id)} onEditWorkout={(id) => router.push(`/dashboardAdmin/workout/${id}`)} onViewAssignments={handleViewAssignments} onAssignToNew={(id) => { setSelectedWorkoutId(id); setIsAssignModalOpen(true); }} />}
      </main>

      {/* FAB - ADD BUTTON */}
      <button onClick={() => openFormModal(null, activeTab === "users" ? "user" : activeTab === "exercises" ? "exercise" : "workout")} className="fixed bottom-6 right-6 h-16 w-16 bg-gym-red text-white rounded-full flex items-center justify-center shadow-xl shadow-gym-red/40 hover:scale-105 active:scale-95 transition-all z-20 border-4 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>

      {/* MODALS INLINE (User & Workout) + Dedicated Exercise Modal */}
      {activeModal === "exercise" && <ExerciseModal exercise={editingItem} onClose={() => setActiveModal("none")} onSaved={refreshAllData} />}
      
      {(activeModal === "user" || activeModal === "workout") && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gym-red mb-6 uppercase italic tracking-tight">{editingItem ? "Modifica" : "Nuovo"} {activeModal}</h2>
            <form onSubmit={(e) => handleSubmitGeneric(e, activeModal === "user" ? "users" : "workouts")}>
              {activeModal === "user" && (
                <>
                  <InputField label="Username" placeholder="Es. mario.rossi" value={formData.username} onChange={(e) => handleInputChange("username", e.target.value)} />
                  <InputField label="Password" type="password" placeholder={editingItem ? "Lascia vuoto per mantenere" : "••••••••"} value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} />
                  <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input type="checkbox" className="w-6 h-6 accent-gym-red rounded cursor-pointer" checked={formData.is_manager || false} onChange={(e) => handleInputChange("is_manager", e.target.checked)} />
                    <label className="text-gray-700 font-bold cursor-pointer">Permessi Amministratore</label>
                  </div>
                </>
              )}
              {activeModal === "workout" && (
                <>
                  <InputField label="Titolo Scheda" placeholder="Es. Forza A" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} />
                  <InputField label="Descrizione" placeholder="Note per l'atleta..." value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} />
                </>
              )}
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setActiveModal("none")} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition">Annulla</button>
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

      {/* MODALE PROFILO UTENTE (SCHEDE) */}
      {isUserProfileOpen && viewingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className="h-14 w-14 bg-gym-yellow text-gym-red rounded-full flex items-center justify-center text-xl font-black">{viewingUser.username.charAt(0).toUpperCase()}</div>
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
                    <button onClick={() => handleUnassignWorkoutFromUser(workout.id)} className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors" title="Rimuovi scheda">
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