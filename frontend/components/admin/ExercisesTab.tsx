import React from "react";
import { Exercise } from "@/types";

interface Props {
  exercises: Exercise[];
  onOpenModal: (exercise: Exercise) => void;
  onDelete: (id: number) => void;
}

export function ExercisesTab({ exercises, onOpenModal, onDelete }: Props) {
  return (
    <>
      {exercises.map((ex) => (
        <div key={ex.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow mb-4">
          <div className="flex-1 pr-4">
            <h3 className="font-bold text-gray-900 text-lg">{ex.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{ex.description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onOpenModal(ex)} className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button onClick={() => onDelete(ex.id)} className="p-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
