import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 font-medium leading-tight">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
          >
            Annulla
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className="flex-1 py-3 bg-gym-red hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
