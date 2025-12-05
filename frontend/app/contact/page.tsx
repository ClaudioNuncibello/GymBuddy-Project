"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSending, setIsSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulazione invio email
    setTimeout(() => {
      alert(`Messaggio inviato da ${formData.name}!\nIl coach ti risponderà a breve su ${formData.email}.`);
      setIsSending(false);
      setFormData({ name: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 selection:bg-gym-yellow selection:text-gym-red relative">
      
      {/* --- TASTO HOME (Flottante in alto a sinistra) --- */}
      <Link 
        href="/dashboard" // O "/" se non loggato
        className="absolute top-6 left-6 p-3 bg-white rounded-full shadow-md text-gym-red hover:bg-gray-100 transition-transform active:scale-95 z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </Link>

      {/* --- HEADER SOCIAL --- */}
      <div className="bg-gym-red text-white pt-20 pb-16 px-6 rounded-b-[3rem] shadow-xl text-center relative overflow-hidden">
        {/* Decorazioni sfondo */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gym-yellow/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3"></div>

        <h1 className="text-3xl font-black italic uppercase tracking-tight mb-2">Il Tuo Coach</h1>
        <p className="text-white/80 text-sm font-medium mb-8 max-w-xs mx-auto">
          Hai dubbi sull'esecuzione? Vuoi cambiare piano? Contattami direttamente qui sotto.
        </p>

        {/* Pulsanti Social */}
        <div className="flex justify-center gap-4">
          
          {/* WhatsApp */}
          <a 
            href="https://wa.me/3476400067" // NUMERO DI TELEFONO
            target="_blank"
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg group-active:scale-95 transition-all text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .57 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.03 12.03 0 0 0 2.81.57 2 2 0 0 1 1.72 2.05z"/></svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 group-hover:opacity-100">WhatsApp</span>
          </a>

          {/* Instagram */}
          <a 
            href="https://www.instagram.com/dariobasilico_pt" // LINK VERO
            target="_blank"
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-active:scale-95 transition-all text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 group-hover:opacity-100">Instagram</span>
          </a>

          {/* Email (Link mailto) */}
          <a 
            href="dariobasilicopt@gmail.com" 
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-white text-gym-red rounded-xl flex items-center justify-center shadow-lg group-active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80 group-hover:opacity-100">  La mia Email  </span>
          </a>

        </div>
      </div>

      {/* --- FORM DI CONTATTO --- */}
      <div className="px-6 -mt-8 relative z-10 max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-black text-gray-900 mb-6 uppercase italic">Scrivimi un messaggio</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Nome */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Il tuo Nome</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Es. Mario Rossi"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-gym-red/50 focus:bg-white outline-none transition-colors font-medium text-gray-900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">La tua Email</label>
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="mario@email.com"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-gym-red/50 focus:bg-white outline-none transition-colors font-medium text-gray-900"
              />
            </div>

            {/* Messaggio */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Messaggio</label>
              <textarea 
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Ciao Coach, volevo chiederti..."
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-gym-red/50 focus:bg-white outline-none transition-colors font-medium text-gray-900 resize-none"
              ></textarea>
            </div>

            {/* Tasto Invio */}
            <button 
              type="submit" 
              disabled={isSending}
              className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wide shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                isSending ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gym-red text-white hover:bg-red-800 shadow-gym-red/30"
              }`}
            >
              {isSending ? (
                "Invio in corso..."
              ) : (
                <>
                  Invia Messaggio
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </>
              )}
            </button>

          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center mt-12 text-gray-400 text-xs font-medium px-8">
        <p>Rispondo solitamente entro 24 ore.</p>
        <p className="mt-1">Gym Buddy v1.0</p>
      </div>

    </div>
  );
}