"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";

// Tipi dello stato globale
type PlayerState = "READY" | "WORK" | "REST" | "FINISHED";

interface WorkoutSessionState {
  workoutId: string | null;
  status: PlayerState;
  currentExIndex: number;
  currentSet: number;
  totalTime: number;
  isSessionActive: boolean;
  // Dati per ripristinare il timer locale (opzionale ma utile)
  restTimeLeft: number;
  lastUpdated: number;
}

interface WorkoutContextType {
  state: WorkoutSessionState;
  startSession: (workoutId: string, startIndex: number) => void;
  endSession: () => void;
  updateState: (updates: Partial<WorkoutSessionState>) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkoutSessionState>({
    workoutId: null,
    status: "READY",
    currentExIndex: 0,
    currentSet: 1,
    totalTime: 0,
    isSessionActive: false,
    restTimeLeft: 0,
    lastUpdated: Date.now(),
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // LOGICA TIMER GLOBALE
  // Questo useEffect gira sempre, finché l'app è aperta
  useEffect(() => {
    if (state.isSessionActive && state.status !== "FINISHED" && state.status !== "READY") {
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          totalTime: prev.totalTime + 1,
          // Se siamo in REST, decrementiamo anche il timer di riposo globale
          restTimeLeft: prev.status === "REST" && prev.restTimeLeft > 0 ? prev.restTimeLeft - 1 : prev.restTimeLeft
        }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isSessionActive, state.status]);

  const startSession = (workoutId: string, startIndex: number) => {
    setState({
      workoutId,
      status: "READY",
      currentExIndex: startIndex,
      currentSet: 1,
      totalTime: 0,
      isSessionActive: true,
      restTimeLeft: 0,
      lastUpdated: Date.now(),
    });
  };

  const endSession = () => {
    setState((prev) => ({ ...prev, isSessionActive: false, status: "FINISHED" }));
  };

  const updateState = (updates: Partial<WorkoutSessionState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <WorkoutContext.Provider value={{ state, startSession, endSession, updateState }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkoutSession() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkoutSession must be used within a WorkoutProvider");
  }
  return context;
}