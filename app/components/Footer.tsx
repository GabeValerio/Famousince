export function Footer() {
  return (
    <footer className="w-full bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Desktop View - Hidden on mobile */}
        <div className="hidden sm:block text-center">
          <p className="text-white/60 text-sm">
            site designed and developed by{" "}
            <a 
              href="https://x.com/gabi_Valerio3/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-white/90 transition-colors" 
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              Gabriel Valerio
            </a>
          </p>
        </div>

        {/* Mobile View - Hidden on desktop */}
        <div className="sm:hidden text-center space-y-1">
          <p className="text-white/60 text-sm">
            site designed and developed by
          </p>
          <p>
            <a 
              href="https://x.com/gabi_Valerio3/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-white/90 transition-colors text-sm" 
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              Gabriel Valerio
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
