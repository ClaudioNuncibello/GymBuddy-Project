import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white font-sans relative overflow-hidden">
      
      {/* --- SFONDO DECORATIVO --- */}
      {/* Cerchio rosso sfocato in alto a destra per dare colore */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gym-red/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      {/* Cerchio giallo sfocato in basso a sinistra */}
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gym-yellow/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      {/* --- CONTENUTO CENTRALE (Logo e Slogan) --- */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 z-10">
        
        {/* Logo GYM BUDDY */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-black tracking-tighter text-gym-red leading-none uppercase italic">
            Gym<span className="text-black">Buddy</span>
          </h1>
          <div className="h-2 w-24 bg-gym-yellow mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Slogan */}
        <p className="text-lg font-medium text-gray-500 text-center max-w-xs leading-relaxed">
          Il tuo partner digitale per l'allenamento.
          <br />
          <span className="text-gym-red font-bold">Monitora. Migliora. Ripeti.</span>
        </p>

        {/* Illustrazione (Icona stilizzata) */}
        <div className="mt-12 mb-8 relative">
            <div className="absolute inset-0 bg-gym-red/5 blur-2xl rounded-full"></div>
            <img 
              src="/logo.png"
              alt="Gym Buddy Logo"
              className="w-40 h-40 relative z-10 drop-shadow-xl object-contain"
            />
        </div>

      </div>

      {/* --- PULSANTI (Area interattiva in basso) --- */}
      <div className="px-6 pb-12 pt-4 z-10 w-full max-w-md mx-auto flex flex-col gap-4">
        
        {/* Bottone 1: Login (Pieno - Rosso) */}
        <Link 
          href="/login" 
          className="w-full bg-gym-red text-white py-4 rounded-xl font-bold text-center shadow-lg shadow-gym-red/20 active:scale-95 transition-all hover:bg-red-800 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
          </svg>
          ACCEDI AL PORTALE
        </Link>

        {/* Bottone 2: Prezzi (Vuoto - Bordo Rosso) */}
        <button 
          className="w-full bg-transparent border-2 border-gym-red text-gym-red py-4 rounded-xl font-bold text-center active:scale-95 transition-all hover:bg-gym-red/5 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
            <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
            <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
          </svg>
          CONTATTA IL TUO PERSONAL
        </button>

        {/* Footer Text */}
        <div className="text-center mt-2">
          <p className="text-gray-400 text-xs font-medium">
            Non hai un account? <br/>
            <span className="text-gym-red font-bold underline cursor-pointer">Chiedi al tuo Personal Trainer</span>
          </p>
        </div>

      </div>

    </main>
  );
}