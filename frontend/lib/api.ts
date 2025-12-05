import axios from "axios";

// --- LOGICA IBRIDA CLIENT/SERVER ---

// 1. URL CLIENT (Browser)
// Quando l'app gira nel browser dell'utente, usa Nginx (percorso relativo o dominio)
// Dal docker-compose: NEXT_PUBLIC_API_URL=/api
const CLIENT_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 2. URL SERVER (Docker Container)
// Quando Next.js renderizza le pagine lato server (SSR), deve parlare direttamente col container backend
// Dal docker-compose: INTERNAL_API_URL=http://backend:8000
const SERVER_URL = process.env.INTERNAL_API_URL || "http://backend:8000";

// Decide quale usare:
// Se 'window' è undefined, siamo sul server -> Usa SERVER_URL
// Se 'window' esiste, siamo nel browser -> Usa CLIENT_URL
const baseURL = typeof window === "undefined" ? SERVER_URL : CLIENT_URL;

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Nota: localStorage non esiste lato server. 
  // Se fai chiamate SSR autenticate, dovrai gestire i cookie, ma per ora proteggiamo il codice.
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});