import React from "react";
import { User } from "@/types";

interface Props {
  users: User[];
  onOpenProfile: (user: User) => void;
  onOpenModal: (user: User) => void;
  onDelete: (id: number) => void;
}

export function UsersTab({ users, onOpenProfile, onOpenModal, onDelete }: Props) {
  return (
    <>
      {users.map((user) => (
        <div key={user.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow mb-4">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${user.is_manager ? "bg-gym-yellow text-gym-red" : "bg-gray-100 text-gray-500"}`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg">{user.username}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${user.is_manager ? "bg-red-100 text-gym-red" : "bg-gray-100 text-gray-500"}`}>
                {user.is_manager ? "Admin" : "Atleta"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onOpenProfile(user)} 
              className="p-3 text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100"
              title="Vedi Schede Assegnate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button onClick={() => onOpenModal(user)} className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button onClick={() => onDelete(user.id)} className="p-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
