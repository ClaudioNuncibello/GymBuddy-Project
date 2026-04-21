"use client";
import React, { useEffect, useState } from 'react';

// Questa è una semplice implementazione di Toast. 
// Per progetti più complessi, si raccomanda una libreria come react-hot-toast con Context.

let addToastFunction: (message: string, type?: 'success' | 'error') => void;

export function ToastContainer() {
  const [toasts, setToasts] = useState<{id: number, msg: string, type: string}[]>([]);

  useEffect(() => {
    addToastFunction = (message: string, type = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg: message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`px-6 py-3 rounded-xl shadow-lg text-white font-bold text-center animate-in slide-in-from-top-4 fade-in duration-300 ${t.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export const toast = {
  success: (msg: string) => addToastFunction?.(msg, 'success'),
  error: (msg: string) => addToastFunction?.(msg, 'error'),
};
