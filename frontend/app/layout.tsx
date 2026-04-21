import type { Metadata } from "next";
import "./globals.css";
// IMPORTA IL PROVIDER
import { WorkoutProvider } from "@/context/ActiveWorkoutContext";
import { ToastContainer } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Gym Buddy",
  description: "Il tuo compagno di allenamento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        {/* AVVOLGI TUTTO DENTRO IL PROVIDER */}
        <WorkoutProvider>
          <ToastContainer />
          {children}
        </WorkoutProvider>
      </body>
    </html>
  );
}