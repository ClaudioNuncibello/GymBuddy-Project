import React from "react";
import { Workout, User } from "@/types";

interface Props {
  workouts: Workout[];
  assignedUsersMap: Record<number, User[]>;
  onOpenModal: (workout: Workout) => void;
  onDelete: (id: number) => void;
  onEditWorkout: (id: number) => void;
  onViewAssignments: (id: number) => void;
  onAssignToNew: (id: number) => void;
}

export function WorkoutsTab({ workouts, assignedUsersMap, onOpenModal, onDelete, onEditWorkout, onViewAssignments, onAssignToNew }: Props) {
  return (
    <>
      {workouts.map((workout) => (
        <div key={workout.id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-black text-xl text-gym-red uppercase italic tracking-tight">{workout.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{workout.description || "Nessuna descrizione"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onOpenModal(workout)} className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
              <button onClick={() => onDelete(workout.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => onEditWorkout(workout.id)}
              className="py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              MODIFICA ESERCIZI
            </button>
            <button 
              onClick={() => onViewAssignments(workout.id)}
              className="py-3 bg-purple-100 text-purple-700 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
            >
              UTENTI ({assignedUsersMap[workout.id] ? assignedUsersMap[workout.id].length : "?"})
            </button>
          </div>
          <button 
            onClick={() => onAssignToNew(workout.id)}
            className="w-full py-2 bg-gym-yellow text-gym-red rounded-lg text-xs font-black uppercase tracking-wide hover:bg-yellow-300 transition-colors shadow-sm"
          >
            + ASSEGNA A NUOVO ATLETA
          </button>
        </div>
      ))}
    </>
  );
}
