"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api"; 
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Parametri Form-Data standard
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);
      // Alcune implementazioni richiedono grant_type, lo aggiungiamo per sicurezza
      params.append("grant_type", "password"); 

      // 2. Override Header Esplicito
      // È cruciale specificare 'headers' qui per sovrascrivere il default 'application/json' di api.ts
      const res = await api.post("/token", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const token = res.data.access_token;
      if (!token) throw new Error("Token non ricevuto");

      localStorage.setItem("token", token);
      
      // Se vuoi debuggare, puoi stampare il token: console.log("Token:", token);
      router.push("/dashboardAdmin"); 

    } catch (err: any) {
      console.error("Login Error:", err);
      // Analizziamo il dettaglio dell'errore restituito dal server se presente
      const serverError = err.response?.data?.detail;
      
      if (err.response?.status === 422) {
        setErrorMsg(`Errore dati (422): ${JSON.stringify(serverError) || "Formato non valido"}`);
      } else if (err.response?.status === 400 || err.response?.status === 401) {
        setErrorMsg("Username o Password errati.");
      } else {
        setErrorMsg("Errore di connessione. Controlla che il backend sia attivo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      
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

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-gym-red font-black text-xs uppercase tracking-widest mb-2">Gym Buddy</p>
          <h1 className="text-3xl font-black italic text-gray-900">BENVENUTO</h1>
          <p className="text-gray-400 text-sm mt-1">Entra per seguire i tuoi allenamenti</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl text-center break-words">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Username</label>
            <input
              type="text"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red focus:bg-white outline-none transition-colors font-bold text-gray-900"
              placeholder="user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-gym-red focus:bg-white outline-none transition-colors font-bold text-gray-900"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gym-red text-white font-black rounded-xl shadow-lg shadow-gym-red/30 hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "ACCESSO IN CORSO..." : "ACCEDI"}
          </button>
        </form>
      </div>
    </div>
  );
}