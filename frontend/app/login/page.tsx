"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link"; // Importiamo Link per la navigazione

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await api.post("/token", params);
      const { access_token } = response.data;
      
      localStorage.setItem("token", access_token);
      const decoded: any = jwtDecode(access_token);

      if (decoded.is_manager === true) {
        router.push("/dashboardAdmin");
      } else {
        router.push("/dashboard");
      }
      
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Username o password errati.");
      } else if (err.response?.status === 422) {
        setError("Errore formato dati (422).");
      } else {
        setError("Errore di connessione col server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Sfondo bianco pulito (Tema Gym Buddy)
    <div className="flex min-h-screen items-center justify-center bg-white text-gray-900 p-4 relative">
      
      {/* --- TASTO HOME (Nuovo) --- */}
      {/* Posizionato in alto a sinistra (absolute) */}
      <Link 
        href="/"
        className="absolute top-6 left-6 p-2 text-gym-red hover:bg-gym-red/5 rounded-full transition-colors flex items-center gap-2 font-bold text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7"/>
          <path d="M19 12H5"/>
        </svg>
        HOME
      </Link>

      {/* Card Login */}
      <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-gym-red/20 shadow-2xl shadow-gym-red/10">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-gym-red uppercase italic tracking-tighter mb-2">
            Benvenuto
          </h1>
          <p className="text-gray-500 font-medium">Entra per allenarti</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-gym-red focus:ring-2 focus:ring-gym-red/20 outline-none transition text-gray-900 font-medium placeholder:text-gray-400"
              placeholder="es. admin"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-gym-red focus:ring-2 focus:ring-gym-red/20 outline-none transition text-gray-900 font-medium placeholder:text-gray-400"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 rounded-xl font-black text-lg uppercase tracking-wide shadow-lg shadow-gym-red/30 transition-all transform active:scale-95 ${
              loading 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-gym-red text-white hover:bg-red-800"
            }`}
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">Problemi con l'accesso? Contatta il supporto.</p>
        </div>
      </div>
    </div>
  );
}