import Link from "next/link";

export default function Home() {
  return (
    // FIX: overflow-x-hidden è corretto.
    <main className="flex min-h-screen flex-col bg-white font-sans relative overflow-x-hidden">
      
      {/* --- SFONDO DECORATIVO --- */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gym-red/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gym-yellow/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      {/* --- CONTENUTO CENTRALE (Logo e Slogan) --- */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 z-10"> {/* FIX: Padding laterale ridotto a px-4 */}
        
        {/* Logo GYM BUDDY */}
        <div className="text-center mb-6">
          {/* FIX: Riduciamo la dimensione del font su schermi piccoli (text-5xl) */}
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gym-red leading-none uppercase italic"> 
            Coach<span className="text-black">Progress</span>
          </h1>
          <div className="h-2 w-24 bg-gym-yellow mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Slogan */}
        <p className="text-lg font-medium text-gray-500 text-center max-w-xs leading-relaxed">
          Il tuo partner digitale per l'allenamento.
          <br/>
          <span className="text-gym-red font-bold">Monitora. Migliora. Ripeti.</span>
        </p>

        {/* Illustrazione (Icona stilizzata) */}
        <div className="mt-12 mb-8 relative">
            <div className="absolute inset-0 bg-gym-red/5 blur-2xl rounded-full"></div>
            <img 
              src="/logo.png"
              alt="Gym Buddy Logo"
              className="w-50 h-50 relative z-10 drop-shadow-xl object-contain"
            />
        </div>

      </div>

      {/* --- PULSANTI (Area interattiva in basso) --- */}
      {/* FIX: Riduciamo il padding laterale a px-4 per dare più spazio sui lati */}
      <div className="px-4 pb-12 pt-4 z-10 w-full max-w-md mx-auto flex flex-col gap-4">
        
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
        <Link 
          href="/contact" 
          className="w-full bg-transparent border-2 border-gym-red text-gym-red py-4 rounded-xl font-bold text-center active:scale-95 transition-all hover:bg-gym-red/5 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          CONTATTA IL COACH
        </Link>

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