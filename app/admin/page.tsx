'use client';

import { useSession } from "next-auth/react";

export default function AdminPage() {
    const { status } = useSession();

    // Show loading state while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center">
                <h2 className="font-['Playfair_Display',Helvetica] font-medium text-xl text-white mb-2">
                    Loading...
                </h2>
                <p className="font-['Raleway',Helvetica] font-normal text-[#6B7280] text-sm">
                    Please wait while we load your admin dashboard.
                </p>
            </div>
        </div>
    );
} 