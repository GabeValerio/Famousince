"use client"

import { signOut } from "next-auth/react"
import { useRef, useEffect } from "react"

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string | null;
}

export function UserDropdown({ isOpen, onClose, userName }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
    >
      {userName && (
        <div className="px-4 py-2 text-sm !text-black border-b">
          Hi {userName}!
        </div>
      )}
      <a
        href="/admin/overview"
        className="block px-4 py-2 text-sm !text-black hover:bg-gray-100"
      >
        Dashboard
      </a>
      <button
        onClick={() => signOut()}
        className="w-full text-left px-4 py-2 text-sm !text-black hover:bg-gray-100"
      >
        Sign out
      </button>
    </div>
  );
} 