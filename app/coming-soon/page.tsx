export default function ComingSoon() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Coming Soon Text */}
        <h1 
          className="text-4xl md:text-6xl font-bold mb-4"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-white/80 mb-8">
          We're working on something special. Stay tuned!
        </p>

        {/* Copyright */}
        <div className="mt-12 text-white/60">
          © {new Date().getFullYear()} Famous Since. All rights reserved.
        </div>
      </div>
    </div>
  );
} 