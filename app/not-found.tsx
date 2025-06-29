"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 
            className="text-6xl md:text-8xl font-bold tracking-tight"
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            404
          </h1>
          <p className="text-xl text-white/60">
            The page you are looking for does not exist.
          </p>
          <p className="text-lg mt-4">
            Go to homepage to stay{" "}
            <span 
              onClick={() => router.push("/")}
              style={{ fontFamily: 'Chalkduster, fantasy' }}
              className="cursor-pointer border border-white/20 px-4 py-1 rounded-md hover:bg-white hover:text-black transition-colors inline-block"
            >
              Famous
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}