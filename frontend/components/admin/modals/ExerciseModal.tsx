import { useState, ChangeEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "../../ui/Toast";
import { Exercise } from "@/types";

interface Props {
  exercise: Partial<Exercise> | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ExerciseModal({ exercise, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState<Partial<Exercise>>(exercise || {});
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let savedExercise;
      
      // Update o Create Dati Testuali
      if (formData.id) {
        const res = await api.patch(`/exercises/${formData.id}`, formData);
        savedExercise = res.data;
      } else {
        const res = await api.post(`/exercises/`, formData);
        savedExercise = res.data;
      }

      // Se c'è un file da caricare, facciamo la request form-data
      if (videoFile && savedExercise?.id) {
        toast.success("Caricamento media in corso...");
        const formDataPost = new FormData();
        formDataPost.append("file", videoFile);
        
        await api.post(`/exercises/${savedExercise.id}/upload-video`, formDataPost, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Video caricato con successo!");
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error("Errore salvataggio!");
    }
  };

  const InputField = ({ label, type = "text", placeholder, field }: any) => (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <input
        type={type}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red outline-none text-gray-900 transition-colors"
        placeholder={placeholder}
        value={(formData as any)[field] || ""}
        onChange={(e) => setFormData(prev => ({...prev, [field]: e.target.value}))}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-black text-gym-red mb-6 uppercase italic tracking-tight">
          {formData.id ? "Modifica Esercizio" : "Nuovo Esercizio"}
        </h2>
        <form onSubmit={handleSubmit}>
          <InputField label="Titolo" field="title" placeholder="Es. Panca Piana" />
          <InputField label="Descrizione" field="description" placeholder="Breve descrizione..." />
          <InputField label="Recupero Default (sec)" field="default_rest" type="number" placeholder="60" />
          
          <div className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <label className="block text-gray-700 text-sm font-bold mb-2">Carica o aggancia Video MP4</label>
            <input 
              type="file" 
              accept="video/mp4" 
              className="text-sm font-medium w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-gym-red hover:file:bg-red-100 transition-colors"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoFile(e.target.files?.[0] || null)}
            />
            {formData.video_url && (
                <a href={`${api.defaults.baseURL?.replace(/\/api$/, "") || "http://localhost:8000"}/static/videos/${formData.video_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline font-bold flex items-center gap-1 mt-3 hover:text-blue-700">
                  Prova il link video attuale (via /static)
                </a>
            )}
          </div>
          
          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition">Annulla</button>
            <button type="submit" className="flex-1 py-3 bg-gym-red text-white font-bold rounded-xl shadow-lg shadow-gym-red/30 hover:bg-red-800 transition">Salva</button>
          </div>
        </form>
      </div>
    </div>
  );
}
