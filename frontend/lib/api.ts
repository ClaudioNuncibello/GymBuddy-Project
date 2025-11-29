import axios from 'axios';

// URL del Backend (nota: localhost va bene perché il codice gira nel browser dell'utente)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

// --- INTERCEPTOR (Il Maggiordomo) ---
// Prima di ogni richiesta, controlla se c'è il token e aggiungilo
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestione Errori Globale (Opzionale ma consigliata)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Se il token è scaduto o non valido, slogga l'utente
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);